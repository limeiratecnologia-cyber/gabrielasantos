import { APPROACHES } from "../data";
import { useState, useEffect } from "react";
import { BookOpen, Sparkles, Check, Heart, RefreshCw, Quote, ArrowRight, Play, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApproachesFromDb } from "../lib/firebaseService";

export default function ApproachesSection() {
  const [approaches, setApproaches] = useState<typeof APPROACHES>(APPROACHES);

  useEffect(() => {
    getApproachesFromDb().then((apps) => {
      setApproaches(apps);
    }).catch((err) => {
      console.error("Erro ao ler approaches do Firestore:", err);
      const saved = localStorage.getItem("serenamente_approaches");
      if (saved) {
        try {
          setApproaches(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao ler serenamente_approaches:", e);
        }
      }
    });
  }, []);

  const [selectedApproachId, setSelectedApproachId] = useState(APPROACHES[0].id);
  const [isReframed, setIsReframed] = useState(false);
  const [exerciseMessage, setExerciseMessage] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);

  const selectedApproach = approaches.find((a) => a.id === selectedApproachId) || approaches[0] || APPROACHES[0];

  const handleApproachChange = (id: string) => {
    setSelectedApproachId(id);
    setIsReframed(false); // reset reframing tool
  };

  const runExercise = (type: "breath" | "grounding") => {
    setActiveExercise(type);
    if (type === "breath") {
      setExerciseMessage("Ciclo Iniciado! Respire fundo: Inspire por 4 segundos... Segure por 7 segundos... Expire devagar por 8 segundos. Sinta o relaxamento corporal imediato.");
    } else {
      setExerciseMessage("Aterramento Ativo: Identifique 5 coisas que você vê, 4 que pode tocar, 3 que ouve, 2 que cheira e 1 que saboreia. Sinta seus pés firmes no chão neste momento.");
    }
  };

  return (
    <div className="space-y-12 py-6" id="approaches-section">
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider font-sans">
          Psicoeducação
        </span>
        <h2 className="text-2xl sm:text-4xl font-sans font-extrabold text-slate-900 tracking-tight">
          Como funciona a psicoterapia?
        </h2>
        <p className="text-slate-600 font-sans text-sm sm:text-base leading-relaxed">
          Existem diferentes caminhos teóricos e científicos para compreender a mente humana e promover a saúde mental. Explore abaixo as quatro principais abordagens oferecidas em nossa clínica.
        </p>
      </div>

      {/* Tabs list selector */}
      <div className="flex flex-wrap gap-2 justify-center border-b border-slate-100 pb-5" id="approach-tabs">
        {approaches.map((appr) => (
          <button
            key={appr.id}
            id={`tab-approach-${appr.id}`}
            onClick={() => handleApproachChange(appr.id)}
            className={`px-5 py-2.5 rounded-full font-sans text-sm font-medium transition-all duration-300 cursor-pointer ${
              selectedApproachId === appr.id
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20 font-semibold"
                : "text-slate-500 hover:text-purple-600 hover:bg-slate-50 bg-[#FCFDFD]"
            }`}
          >
            {appr.fullName}
          </button>
        ))}
      </div>

      {/* Detail Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-3xl border border-slate-100 p-6 md:p-10 shadow-lg">
        {/* Left column info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider font-sans">
              <BookOpen className="w-3.5 h-3.5" />
              Abordagem Clínica
            </span>
            <h3 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">
              {selectedApproach.fullName}
            </h3>
            <p className="text-slate-700 font-sans leading-relaxed text-base">
              {selectedApproach.longDescription}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-sans font-bold text-slate-800 text-xs tracking-widest uppercase">Princípios Fundamentais</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {selectedApproach.corePrinciples.map((princ, idx) => (
                <div key={idx} className="flex gap-2.5 items-start p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="font-sans text-slate-600 text-xs sm:text-sm leading-relaxed">{princ}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Quote and Interactive Reframing Playground */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-10">
          {/* Quote Block */}
          <div className="bg-purple-50/40 rounded-2xl p-6 border border-purple-100/50 relative">
            <Quote className="absolute right-4 top-4 w-12 h-12 text-purple-200/30 pointer-events-none" />
            <p className="font-sans italic text-slate-700 text-sm sm:text-base leading-relaxed relative z-10">
              {selectedApproach.quote}
            </p>
          </div>

          {/* Interactive Re-framing tool */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-purple-600" />
              <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-widest">
                Reestruturação Cognitiva
              </h4>
            </div>
            <p className="text-slate-500 font-sans text-xs leading-normal">
              Veja na prática como esta abordagem ajuda a transformar interpretações automáticas disfuncionais em pensamentos mais equilibrados e compassivos.
            </p>

            <div className="space-y-4 pt-1">
              {/* Original negative thought */}
              <div className="bg-white rounded-xl p-4 border border-rose-100 shadow-sm">
                <span className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider font-sans mb-1">
                  Pensamento Automático Disfuncional
                </span>
                <p className="font-sans text-slate-700 text-xs sm:text-sm italic">
                  "{selectedApproach.reframingExample.original}"
                </p>
                <span className="block text-[10px] font-sans font-medium text-rose-400 mt-2">
                  Distorção: {selectedApproach.reframingExample.distortion}
                </span>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  id={`btn-reframe-${selectedApproach.id}`}
                  onClick={() => setIsReframed(!isReframed)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans font-semibold text-xs transition-all shadow-md cursor-pointer ${
                    isReframed
                      ? "bg-slate-800 hover:bg-slate-900 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReframed ? "rotate-180" : ""} transition-transform duration-500`} />
                  {isReframed ? "Voltar ao Original" : "Aplicar Reestruturação Saudável"}
                </button>
              </div>

              {/* Reframed Compassionate perspective */}
              <AnimatePresence mode="wait">
                {isReframed && (
                  <motion.div
                    key="reframed-thought"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-purple-50/60 rounded-xl p-4 border border-purple-100 shadow-sm"
                  >
                    <span className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider font-sans mb-1">
                      Perspectiva Saudável Reframada
                    </span>
                    <p className="font-sans text-purple-950 font-semibold text-xs sm:text-sm leading-relaxed">
                      "{selectedApproach.reframingExample.reframed}"
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-purple-100/50">
                      <span className="block text-[11px] font-sans text-purple-800 leading-relaxed">
                        <strong>Foco terapêutico:</strong> {selectedApproach.reframingExample.explanation}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Self-Regulating exercises block */}
      <section className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-600">
            <Heart className="w-6 h-6 fill-purple-600/10" />
            <h3 className="font-sans font-extrabold text-slate-900 text-lg sm:text-xl">
              Ferramentas Práticas de Regulação Emocional
            </h3>
          </div>
          <p className="font-sans text-slate-500 text-xs sm:text-sm">
            Aqui estão exercícios clínicos recomendados para auxiliar no foco mental, ansiedade e centramento no momento presente.
          </p>
        </div>

        {/* Inline Feedback Banner if exercise is running */}
        <AnimatePresence>
          {exerciseMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-3 items-start"
            >
              <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-xs text-purple-800 font-sans block uppercase tracking-wider">
                  {activeExercise === "breath" ? "Exercício Prático de Respiração" : "Centramento de Atenção"}
                </span>
                <p className="text-xs sm:text-sm font-sans text-purple-950 leading-relaxed font-medium">
                  {exerciseMessage}
                </p>
                <button
                  onClick={() => { setExerciseMessage(null); setActiveExercise(null); }}
                  className="text-[10px] text-purple-700 hover:underline font-bold pt-1 block cursor-pointer"
                >
                  Concluir Prática / Limpar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Breathe exercise */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-purple-500/15 transition-all">
            <div className="space-y-2">
              <span className="text-purple-600 text-[10px] font-extrabold uppercase tracking-widest block font-sans">Método 4-7-8</span>
              <h4 className="font-sans font-bold text-slate-900">Exercício de Respiração</h4>
              <p className="font-sans text-slate-600 text-xs sm:text-sm leading-relaxed">
                Reduz o batimento cardíaco, acalma o sistema nervoso simpático e promove foco imediato. Recomendado antes de dormir ou durante crises de agitação.
              </p>
              <div className="pt-2 flex flex-col gap-1.5 font-mono text-xs text-slate-500">
                <div className="flex justify-between border-b border-slate-50 py-1.5">
                  <span>1. Inspirar pelo nariz</span>
                  <span className="font-semibold text-purple-600">4 segundos</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 py-1.5">
                  <span>2. Reter o ar</span>
                  <span className="font-semibold text-purple-600">7 segundos</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>3. Expirar devagar</span>
                  <span className="font-semibold text-purple-600">8 segundos</span>
                </div>
              </div>
            </div>
            <div className="pt-5 flex justify-end">
              <button
                onClick={() => runExercise("breath")}
                className="text-purple-600 text-xs font-sans font-bold flex items-center gap-1.5 hover:text-purple-700 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-purple-600" />
                Iniciar Ciclo Simulado
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grounding exercise */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-purple-500/15 transition-all">
            <div className="space-y-2">
              <span className="text-purple-600 text-[10px] font-extrabold uppercase tracking-widest block font-sans">Aterramento 5-4-3-2-1</span>
              <h4 className="font-sans font-bold text-slate-900">Centramento de Atenção</h4>
              <p className="font-sans text-slate-600 text-xs sm:text-sm leading-relaxed">
                Conecta você de volta aos sentidos físicos quando sua cabeça estiver inundada de pensamentos ansiosos sobre o futuro.
              </p>
              <div className="pt-2 grid grid-cols-5 gap-2 text-center font-sans font-semibold text-xs text-slate-500">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="block text-purple-700 text-sm font-extrabold">5</span>
                  <span className="text-[9px] text-slate-400">Ver</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="block text-purple-700 text-sm font-extrabold">4</span>
                  <span className="text-[9px] text-slate-400">Tocar</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="block text-purple-700 text-sm font-extrabold">3</span>
                  <span className="text-[9px] text-slate-400">Ouvir</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="block text-purple-700 text-sm font-extrabold">2</span>
                  <span className="text-[9px] text-slate-400">Cheirar</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="block text-purple-700 text-sm font-extrabold">1</span>
                  <span className="text-[9px] text-slate-400">Degustar</span>
                </div>
              </div>
            </div>
            <div className="pt-5 flex justify-end">
              <button
                onClick={() => runExercise("grounding")}
                className="text-purple-600 text-xs font-sans font-bold flex items-center gap-1.5 hover:text-purple-700 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-purple-600" />
                Praticar Agora
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
