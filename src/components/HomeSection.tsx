import { CLINIC_INFO, IMAGES } from "../data";
import { ActiveTab } from "../types";
import { CheckCircle2, Phone, Mail, Clock, MapPin, Sparkles, Heart, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { getClinicInfoFromDb } from "../lib/firebaseService";

interface HomeSectionProps {
  setActiveTab: (tab: ActiveTab) => void;
  logoSrc?: string;
}

export default function HomeSection({ setActiveTab, logoSrc }: HomeSectionProps) {
  const [clinicInfo, setClinicInfo] = useState<any>(CLINIC_INFO);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    getClinicInfoFromDb().then((info) => {
      setClinicInfo(info);
    }).catch((err) => {
      console.error("Erro ao carregar informações da clínica do Firestore:", err);
      const saved = localStorage.getItem("serenamente_clinic_info");
      if (saved) {
        try {
          setClinicInfo(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao ler serenamente_clinic_info:", e);
        }
      }
    });
  }, []);

  const bannerImages = clinicInfo.bannerImages && clinicInfo.bannerImages.length > 0
    ? clinicInfo.bannerImages
    : [IMAGES.hero];

  // Auto-play slideshow if multiple banners exist
  useEffect(() => {
    if (bannerImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 6000); // 6 seconds per slide
    
    return () => clearInterval(interval);
  }, [bannerImages]);

  return (
    <div className="space-y-16 py-6" id="home-section">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-xl bg-slate-50 h-[360px] md:h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent z-10" />
        
        {/* Banner Images (Slideshow / Crossfade) */}
        {bannerImages.map((imgUrl: string, index: number) => (
          <img
            key={index}
            src={imgUrl}
            alt={`Consultório Serena Mente ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
            referrerPolicy="no-referrer"
          />
        ))}

        {/* Carousel indicators/dots */}
        {bannerImages.length > 1 && (
          <div className="absolute bottom-6 right-6 md:right-16 z-20 flex gap-1.5">
            {bannerImages.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  index === currentSlide 
                    ? "bg-purple-500 w-5" 
                    : "bg-white/40 hover:bg-white"
                }`}
                title={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 text-white max-w-3xl space-y-5">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex self-start items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <img src={logoSrc || clinicInfo.clinicLogo || IMAGES.logo} className="w-6 h-6 object-contain image-render-crisp" alt="Logo" />
            Psicologia Clínica & Bem-Estar
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans font-extrabold text-4xl sm:text-6xl tracking-tight leading-[1.1] text-white"
          >
            Sua jornada de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">cura</span> começa aqui.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-slate-100 text-sm sm:text-base leading-relaxed opacity-95 max-w-xl"
          >
            {clinicInfo.tagline}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button
              id="hero-cta-btn"
              onClick={() => setActiveTab("booking")}
              className="px-8 py-4 bg-purple-600 text-white rounded-full font-bold shadow-lg shadow-purple-600/20 hover:bg-purple-700 hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2 group text-sm"
            >
              Agendar Consulta
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <div className="flex items-center gap-3 px-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700" />
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-purple-500" />
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-500" />
              </div>
              <span className="text-xs font-medium text-slate-300">Mais de +100 vidas transformadas</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Psychologist Bio Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative" id="bio-section">
        
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[360px] aspect-[2/3] overflow-hidden rounded-2xl shadow-md bg-slate-50">
            <img
              src={clinicInfo.therapistImage || (clinicInfo.therapistName === "Dra. Gabriela Santos" ? IMAGES.profile : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400")}
              alt={clinicInfo.therapistName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              id="therapist-avatar-img"
            />
          </div>
        </div>
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider font-sans">
              Sua Psicóloga
            </span>
            <h2 className="text-2xl sm:text-4xl font-sans font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              {clinicInfo.therapistName}
              <img src={logoSrc || clinicInfo.clinicLogo || IMAGES.logo} className="w-12 h-12 object-contain shrink-0 image-render-crisp" alt="Logo" />
            </h2>
            <p className="text-purple-600 font-sans font-semibold text-sm sm:text-base">
              {clinicInfo.title}
            </p>
          </div>
          <p className="text-slate-600 leading-relaxed font-sans text-base">
            {clinicInfo.bio}
          </p>

          <div className="space-y-3 pt-2">
            <h3 className="font-sans font-bold text-slate-800 text-xs tracking-widest uppercase">Qualificações Acadêmicas</h3>
            <ul className="space-y-2.5">
              {clinicInfo.credentials.map((cred, index) => (
                <li key={index} className="flex items-start gap-3 font-sans text-slate-600 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{cred}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="space-y-8 border-t border-slate-100 pt-16" id="services-section">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="w-20 h-20 flex items-center justify-center mx-auto hover:scale-105 transition-transform duration-300">
            <img src={logoSrc || clinicInfo.clinicLogo || IMAGES.logo} className="w-full h-full object-contain animate-pulse-slow image-render-crisp" alt="Logo" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">
            Nossos Serviços e Atendimentos
          </h2>
          <p className="text-slate-500 text-sm font-sans max-w-lg mx-auto">
            Soluções terapêuticas personalizadas para apoiar você em diferentes etapas e desafios do seu desenvolvimento emocional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clinicInfo.services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-500/10 transition-all duration-300 flex flex-col justify-between group"
              id={`service-card-${index}`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center transition-colors group-hover:bg-purple-100">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-sans font-bold text-slate-900">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed font-sans">
                  {service.description}
                </p>
              </div>
              <div className="pt-6 border-t border-slate-50 mt-4">
                <button 
                  onClick={() => setActiveTab("booking")}
                  className="text-xs font-sans font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
                >
                  Saber mais / Agendar
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Location Footer block */}
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden" id="clinic-contact-info">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/4">
          <Heart className="w-96 h-96 text-purple-400" />
        </div>
        {/* Subtle glow sphere */}
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoSrc || clinicInfo.clinicLogo || IMAGES.logo} className="w-16 h-16 object-contain shrink-0 image-render-crisp" alt="Logo" />
              <div>
                <h3 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight leading-none">O Consultório</h3>
                <span className="text-[10px] text-purple-400 tracking-widest font-bold uppercase mt-1 block">Serena Mente</span>
              </div>
            </div>
            <p className="font-sans text-slate-300 text-sm leading-relaxed max-w-sm">
              Um ambiente projetado especificamente para proporcionar segurança, privacidade e acolhimento absoluto para todos os pacientes. Oferecemos opções presenciais e online por videochamada segura.
            </p>
            <div className="pt-2">
              <span className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                Atendimento Online e Presencial
              </span>
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-400 text-xs tracking-widest uppercase">Endereço</h4>
                  <p className="font-sans text-sm text-slate-200 mt-1">{clinicInfo.clinicDetails.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-400 text-xs tracking-widest uppercase">Horário de Funcionamento</h4>
                  <p className="font-sans text-sm text-slate-200 mt-1">{clinicInfo.clinicDetails.hours}</p>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-400 text-xs tracking-widest uppercase">WhatsApp / Telefone</h4>
                  <p className="font-sans text-sm text-slate-200 mt-1">{clinicInfo.clinicDetails.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-400 text-xs tracking-widest uppercase">E-mail</h4>
                  <p className="font-sans text-sm text-slate-200 mt-1">{clinicInfo.clinicDetails.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
