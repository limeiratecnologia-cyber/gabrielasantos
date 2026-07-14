import { Approach } from "./types";
import GabrielaSantosImg from "./assets/images/gabriela_santos_uploaded_1783958114731.jpg";
import GabrielaSantosLogo from "./assets/images/gabriela_santos_logo_1783954576192.jpg";
import SereneMindHeroImg from "./assets/images/serene_mind_hero_1783952389939.jpg";

export const IMAGES = {
  profile: GabrielaSantosImg,
  logo: GabrielaSantosLogo,
  hero: SereneMindHeroImg
};

export const CLINIC_INFO = {
  therapistName: "Dra. Gabriela Santos",
  title: "Psicóloga Clínica (CRP 06/123456)",
  tabTitle: "Serena Mente - Dra. Gabriela Santos",
  clinicLogo: "",
  faviconUrl: "",
  tagline: "Cultivando espaço para o auto-conhecimento, acolhimento e transformação pessoal.",
  bio: "Com mais de 15 anos de experiência clínica, sou dedicada a ajudar pessoas a navegarem pelas complexidades da vida, ansiedade, relacionamentos e transições de carreira. Minha prática é pautada na empatia profunda, ética rigorosa e na escolha integrada de abordagens que respeitam a singularidade de cada indivíduo. Acredito que a psicoterapia é uma parceria colaborativa para reencontrar a serenidade e a força interior.",
  credentials: [
    "Mestre em Psicologia Clínica pela Universidade de São Paulo (USP)",
    "Especialização em Terapia Cognitivo-Comportamental (CBT)",
    "Formação em Atenção Plena (Mindfulness) aplicada à Saúde Mental",
    "Membro Associado da Associação Brasileira de Psicologia"
  ],
  clinicDetails: {
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
    phone: "(11) 98765-4321",
    email: "contato@serenamente.com.br",
    hours: "Segunda a Sexta: 08:00 - 20:00 | Sábado: 09:00 - 13:00"
  },
  services: [
    {
      title: "Psicoterapia Individual",
      description: "Sessões semanais voltadas para adolescentes e adultos, focando no alívio de sintomas de ansiedade, depressão, estresse, autoconhecimento e desenvolvimento de inteligência emocional."
    },
    {
      title: "Terapia de Casal",
      description: "Espaço mediado para casais que buscam reestabelecer canais de comunicação saudáveis, compreender dinâmicas de conflito e fortalecer os laços de intimidade e respeito mútuo."
    },
    {
      title: "Orientação de Carreira",
      description: "Apoio focado em momentos de transição profissional, esgotamento (Burnout), desenvolvimento de liderança e busca de alinhamento entre valores pessoais e carreira."
    }
  ]
};

export const APPROACHES: Approach[] = [
  {
    id: "tcc",
    name: "TCC",
    fullName: "Terapia Cognitivo-Comportamental",
    shortDescription: "Focada no presente, estruturada e colaborativa. Identifica e reestrutura padrões de pensamento e comportamento disfuncionais.",
    longDescription: "A Terapia Cognitivo-Comportamental (TCC) fundamenta-se na premissa de que a forma como pensamos sobre as situações influencia diretamente como nos sentimos e nos comportamos. É uma abordagem prática, orientada a metas e focada na resolução de problemas no presente. Durante as sessões, trabalhamos juntos para mapear 'pensamentos automáticos' e 'crenças limitantes', testando sua validade e desenvolvendo formas mais flexíveis e saudáveis de interpretar a realidade.",
    corePrinciples: [
      "Foco na interação entre pensamentos, emoções e comportamentos",
      "Processo colaborativo: terapeuta e paciente trabalham como uma equipe",
      "Orientação para o presente e foco na resolução de problemas atuais",
      "Desenvolvimento de autonomia: o paciente aprende a ser seu próprio terapeuta"
    ],
    reframingExample: {
      original: "Cometi um erro na apresentação de hoje. Eu sou um fracasso absoluto e nunca vou ser bom no meu trabalho.",
      distortion: "Supergeneralização e Pensamento de Tudo ou Nada (Cognição Disfuncional)",
      reframed: "Eu cometi um erro específico hoje, o que é natural para qualquer pessoa em aprendizado. Eu fiz ótimas apresentações no passado e vou usar o erro de hoje como oportunidade de melhoria.",
      explanation: "A reestruturação ajuda a separar um comportamento isolado da sua identidade global, trazendo uma perspectiva mais realista e compassiva."
    },
    quote: "Não são as coisas que nos perturbam, mas sim a opinião que temos sobre elas. — Epicteto"
  },
  {
    id: "psicanalise",
    name: "Psicanálise",
    fullName: "Psicanálise Contemporânea",
    shortDescription: "Investigação profunda do inconsciente, da história de vida e dos padrões repetitivos inconscientes que causam sofrimento.",
    longDescription: "A Psicanálise convida a um mergulho profundo no inconsciente. Através da associação livre (falar abertamente o que vem à mente), buscamos compreender a origem de angústias, conflitos reprimidos, desejos e defesas psicológicas que se formaram ao longo da infância e da história de vida do indivíduo. Essa compreensão liberta o paciente de repetir padrões dolorosos de forma automática, abrindo espaço para escolhas genuínas e criativas.",
    corePrinciples: [
      "Exploração do inconsciente e dos sonhos",
      "Análise de padrões de repetição e mecanismos de defesa",
      "Atenção à transferência (a relação construída na própria terapia)",
      "Foco na re-significação de traumas e experiências passadas"
    ],
    reframingExample: {
      original: "Sempre me afasto das pessoas que começam a gostar de mim. Acho que elas vão me abandonar mais cedo ou mais tarde.",
      distortion: "Padrão de apego inseguro baseado em medos inconscientes de rejeição infantil",
      reframed: "Percebo que afastar os outros é uma estratégia antiga que criei para me proteger de dores passadas. Agora, como adulto, posso escolher vivenciar a intimidade de forma gradual e segura, sem precisar fugir preventivamente.",
      explanation: "A Psicanálise ajuda a reconhecer que as defesas do passado podem estar boicotando a felicidade do presente, possibilitando novas formas de amar."
    },
    quote: "Olhar para trás ajuda a compreender, mas para viver é preciso olhar para a frente. — Sigmund Freud"
  },
  {
    id: "humanismo",
    name: "Abordagem Humanista",
    fullName: "Psicologia Humanista / Centrada na Pessoa",
    shortDescription: "Foco na autorrealização, no potencial inerente do ser humano e no poder de cura da empatia e aceitação incondicional.",
    longDescription: "O Humanismo, particularmente a Abordagem Centrada na Pessoa de Carl Rogers, compreende o indivíduo como o maior especialista de sua própria vida. Em vez de focar em patologias ou técnicas rígidas, esta abordagem prioriza a criação de um clima de aceitação incondicional, empatia profunda e congruência. Em um ambiente verdadeiramente seguro e livre de julgamentos, a tendência natural do ser humano para o crescimento e a autorrealização floresce livremente.",
    corePrinciples: [
      "Visão holística do ser humano e foco no seu potencial positivo",
      "Aceitação positiva incondicional do paciente pelo terapeuta",
      "Empatia genuína como principal agente de cura e escuta ativa",
      "Foco na experiência imediata do 'aqui e agora'"
    ],
    reframingExample: {
      original: "Sinto que não sou bom o suficiente para as expectativas da minha família. Vivo tentando agradá-los e me sinto vazio.",
      distortion: "Condições de valor externas sufocando o Eu autêntico",
      reframed: "Minha necessidade de aprovação externa é real, mas minha maior responsabilidade é com meu próprio crescimento. Posso honrar minha história enquanto aprendo a ouvir minhas próprias necessidades e ser fiel a quem eu sou.",
      explanation: "O refreamento humanista resgata o locus de controle interno do indivíduo, validando seu direito de existir em sua própria autenticidade."
    },
    quote: "O curioso paradoxo é que quando me aceito como sou, então eu posso mudar. — Carl Rogers"
  },
  {
    id: "sistemica",
    name: "Sistêmica",
    fullName: "Terapia Familiar e Individual Sistêmica",
    shortDescription: "Analisa o indivíduo conectado aos seus sistemas (família, trabalho, sociedade), entendendo as relações e dinâmicas afetivas.",
    longDescription: "A Abordagem Sistêmica compreende que nenhum ser humano vive isolado. Somos parte de sistemas complexos (família de origem, casal, ambiente de trabalho, cultura). O sofrimento ou o sintoma de um indivíduo é analisado como um reflexo de dinâmicas relacionais e comunicações disfuncionais dentro desses sistemas. A terapia sistêmica foca em alterar as regras invisíveis das relações, os papéis rígidos e os ciclos de feedback que perpetuam os conflitos.",
    corePrinciples: [
      "O indivíduo visto como parte de uma rede interconectada",
      "Foco nos padrões de comunicação e ciclos repetitivos de interação",
      "Compreensão de que a mudança de uma parte afeta todo o sistema",
      "Identificação de alianças, fronteiras e papéis invisíveis nos grupos"
    ],
    reframingExample: {
      original: "Meu filho está rebelde e agressivo para me atingir. Nosso relacionamento acabou.",
      distortion: "Linearidade de culpa e personalização do conflito",
      reframed: "A agressividade do meu filho pode ser um sintoma de tensões gerais que nossa família está atravessando e uma forma desajeitada de pedir espaço ou socorro. Podemos olhar para o sistema familiar inteiro e abrir novos canais de comunicação conjunta.",
      explanation: "A visão sistêmica retira a culpa exclusiva de um único membro, enxergando o problema como um desafio relacional coletivo que pode ser curado em conjunto."
    },
    quote: "A família é o sistema onde nascemos, somos moldados e onde aprendemos a nos relacionar com o mundo. — Virginia Satir"
  }
];

export const SELF_CARE_EXERCISES = [
  {
    id: "breathing_478",
    title: "Respiração Conscienciosa 4-7-8",
    description: "Excelente técnica para redução rápida da ansiedade e indução ao relaxamento profundo.",
    duration: "4 minutos",
    steps: [
      { text: "Inspire calmamente pelo nariz por 4 segundos.", duration: 4 },
      { text: "Prenda a respiração por 7 segundos.", duration: 7 },
      { text: "Expire lenta e completamente pela boca fazendo um som de sopro suave por 8 segundos.", duration: 8 }
    ]
  },
  {
    id: "grounding_54321",
    title: "Técnica de Aterramento 5-4-3-2-1",
    description: "Método cognitivo-sensorial para momentos de agitação mental, ajudando a trazer a mente de volta para o momento presente.",
    duration: "5 minutos",
    steps: [
      { text: "Identifique 5 COISAS que você pode VER ao seu redor (um quadro, uma planta, uma luz...).", duration: 0 },
      { text: "Identifique 4 COISAS que você pode TOCAR ou sentir fisicamente (a cadeira, sua roupa, o vento, a mesa...).", duration: 0 },
      { text: "Identifique 3 COISAS que você pode OUVIR (o trânsito distante, o barulho do vento, um pássaro, o ar condicionado...).", duration: 0 },
      { text: "Identifique 2 COISAS que você pode SENTIR O CHEIRO (café, perfume, o ar...).", duration: 0 },
      { text: "Identifique 1 COISA que você pode SENTIR O GOSTO ou uma sensação agradável interna.", duration: 0 }
    ]
  }
];
