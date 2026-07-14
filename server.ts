import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave GEMINI_API_KEY não está configurada nas variáveis de ambiente.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for safe psychoeducational chat with Gemini
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, currentTopic } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "O campo 'messages' é obrigatório e deve ser um array." });
    }

    const ai = getGeminiClient();

    // Map messages to the format expected by the @google/genai SDK
    // @google/genai SDK expects contents in the form of { role: string, parts: [{ text: string }] }
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const systemInstruction = `Você é o "Guia Serena Mente", um assistente virtual focado exclusivamente em psicoeducação, bem-estar emocional, técnicas de relaxamento e auto-reflexão.

Suas diretrizes fundamentais de atendimento são:
1. Empatia e Respeito: Ofereça escuta ativa, respostas gentis, acolhedoras e sem julgamentos. Use termos acessíveis e de fácil compreensão.
2. Abordagem Baseada em Evidências: Embase suas orientações em conceitos reconhecidos da psicologia (como a Terapia Cognitivo-Comportamental, Terapia de Aceitação e Compromisso e práticas de Mindfulness/Atenção Plena).
3. Auto-Cuidado Prático: Sugira técnicas simples e seguras de respiração, visualização criativa, escrita reflexiva ou organização mental para apoiar o bem-estar cotidiano.
4. Tópico Atual: O usuário está focando no tema "${currentTopic || 'Bem-estar Geral'}". Ajude-o a explorar esse tema com perguntas abertas e reflexões úteis.
5. Limites Profissionais (Muito Importante): Você NÃO é psicólogo clínico real, NÃO faz diagnósticos e NÃO prescreve tratamentos. Lembre o usuário amigavelmente, quando apropriado, que este espaço é de psicoeducação complementar e que a psicoterapia é o caminho indicado para acompanhamento profundo.
6. Protocolo de Crise e Segurança (Crítico): Se o usuário manifestar ideação suicida, autolesão ou sofrimento mental agudo/crise severa, interrompa discussões gerais e responda IMEDIATAMENTE com empatia absoluta, recomendando buscar ajuda imediata e fornecendo informações do CVV (Centro de Valorização da Vida - ligue 188 ou acesse cvv.org.br no Brasil) ou serviços de emergência (SAMU 192).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Desculpe, não consegui formular uma resposta no momento.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Erro no processamento do Chat com Gemini:", error);
    res.status(500).json({ 
      error: "Ocorreu um erro no servidor de inteligência artificial.",
      details: error.message || "Erro desconhecido"
    });
  }
});

// API endpoint to analyze a journal entry and provide positive reflection prompts
app.post("/api/analyze-journal", async (req, res) => {
  try {
    const { journalText, mood } = req.body;

    if (!journalText) {
      return res.status(400).json({ error: "O texto do diário é obrigatório." });
    }

    const ai = getGeminiClient();

    const prompt = `Analise a seguinte entrada de diário escrita por um usuário que registrou que está se sentindo "${mood}".
Diário:
"${journalText}"

Com base nisso, escreva um feedback breve (máximo de 3 a 4 parágrafos), acolhedor e com foco em psicologia positiva e autocompaixão. 
Seu retorno deve incluir:
1. Uma validação empática dos sentimentos expressos (sem julgar ou minimizar).
2. Uma perspectiva construtiva ou pergunta reflexiva que ajude o usuário a olhar para a situação de outra forma (reestruturação cognitiva suave).
3. Uma pequena sugestão de prática de autocuidado ou bem-estar adequada para o estado de ânimo relatado.
Escreva em formato Markdown claro e amigável.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um mentor de escrita terapêutica e psicologia positiva extremamente sensível e acolhedor.",
        temperature: 0.7,
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Erro na análise do diário:", error);
    res.status(500).json({ 
      error: "Ocorreu um erro ao processar a reflexão do diário.",
      details: error.message 
    });
  }
});

// Vite middleware configuration for development, static assets for production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Serena Mente Server] Servidor executando em http://localhost:${PORT}`);
  });
}

setupServer();
