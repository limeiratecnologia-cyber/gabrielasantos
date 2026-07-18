import { ActiveTab } from "../types";
import { Sparkles, Heart, HelpCircle, Calendar, BookOpen, Menu, X, Sliders, Video, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { IMAGES, CLINIC_INFO } from "../data";
import { getClinicInfoFromDb } from "../lib/firebaseService";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  logoSrc?: string;
  clinicInfo?: any;
}

export default function AestheticHeader({ activeTab, setActiveTab, logoSrc, clinicInfo: propClinicInfo }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localClinicInfo, setLocalClinicInfo] = useState(() => {
    const saved = localStorage.getItem("serenamente_clinic_info");
    if (saved) {
      try {
        return { ...CLINIC_INFO, ...JSON.parse(saved) };
      } catch (e) {
        console.error(e);
      }
    }
    return CLINIC_INFO;
  });

  useEffect(() => {
    if (propClinicInfo) {
      setLocalClinicInfo(propClinicInfo);
    } else {
      getClinicInfoFromDb().then((info) => {
        if (info) {
          setLocalClinicInfo(info);
          localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
        }
      }).catch((err) => {
        console.error("Erro ao carregar informações da clínica do Firestore:", err);
        const saved = localStorage.getItem("serenamente_clinic_info");
        if (saved) {
          try {
            setLocalClinicInfo(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
  }, [activeTab, propClinicInfo]);

  const clinicInfo = propClinicInfo || localClinicInfo;

  const navItems = [
    { id: "home", label: "A Clínica", icon: Heart },
    { id: "approaches", label: "Abordagens", icon: HelpCircle },
    { id: "online", label: "Consulta Online", icon: Video },
    { id: "tracking", label: "Acompanhar", icon: Search },
    { id: "booking", label: "Agendar Consulta", icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FCFDFD]/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-3.5 cursor-pointer group" 
            onClick={() => { setActiveTab("home"); setIsOpen(false); }}
            id="header-logo"
          >
            <img 
              src={logoSrc || clinicInfo.clinicLogo || IMAGES.logo} 
              alt={`Logo ${clinicInfo.therapistName}`} 
              className="w-14 h-14 object-contain group-hover:scale-105 transition-all duration-300 image-render-crisp"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="font-sans font-extrabold text-lg tracking-tight text-slate-900 block leading-none">
                {clinicInfo.therapistName.replace("Dra. ", "")}
              </span>
              <span className="font-sans text-[10px] tracking-widest text-purple-600 uppercase font-bold block mt-1">
                {clinicInfo.title.split(" (")[0]}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 items-center" id="desktop-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              // If it's booking consultation, style it as the standout CTA button from the Sleek HTML
              const isBooking = item.id === "booking";
              
              if (isBooking) {
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`ml-4 px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-lg cursor-pointer ${
                      isActive
                        ? "bg-purple-700 text-white shadow-purple-700/25"
                        : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-sans font-medium transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-purple-50 text-purple-700 font-semibold"
                      : "text-slate-500 hover:text-purple-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-purple-700" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Admin button */}
            <button
              onClick={() => setActiveTab("admin")}
              title="Painel Administrativo"
              className={`ml-3 p-2.5 rounded-full border transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-purple-50 text-purple-700 border-purple-100"
                  : "text-slate-400 hover:text-purple-600 hover:bg-slate-50 border-transparent"
              }`}
              id="header-admin-btn"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-[#FCFDFD] border-b border-slate-100" id="mobile-nav">
          <div className="px-5 py-6 space-y-6">
            
            {/* Highlighted Logo Section */}
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100" id="mobile-logo-highlight">
              <div className="relative">
                {/* Visual glowing background effect */}
                <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full scale-125" />
                <img 
                  src={logoSrc || clinicInfo.clinicLogo || IMAGES.logo} 
                  alt={`Logo ${clinicInfo.therapistName}`} 
                  className="w-20 h-20 object-contain relative z-10 p-2.5 bg-white rounded-3xl border border-slate-100 shadow-md animate-fade-in image-render-crisp"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-black text-xl text-slate-900 tracking-tight leading-none">
                  {clinicInfo.therapistName}
                </h3>
                <p className="font-sans text-[11px] text-purple-600 font-extrabold tracking-wider uppercase">
                  {clinicInfo.title}
                </p>
                {clinicInfo.tagline && (
                  <p className="font-sans text-[10px] text-slate-400 max-w-xs mx-auto pt-1 italic leading-relaxed">
                    "{clinicInfo.tagline}"
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Bento Grid of Buttons */}
            <div className="grid grid-cols-2 gap-3.5" id="mobile-menu-grid">
              
              {/* Button: A Clínica */}
              <button
                key="home"
                id="mobile-nav-btn-home"
                onClick={() => {
                  setActiveTab("home");
                  setIsOpen(false);
                }}
                className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  activeTab === "home"
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/15"
                    : "bg-white border-slate-100 hover:border-purple-200 text-slate-800"
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${
                  activeTab === "home" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600"
                }`}>
                  <Heart className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <span className="font-sans font-black text-sm block leading-none">A Clínica</span>
                  <span className={`font-sans text-[9px] block mt-1.5 leading-tight ${
                    activeTab === "home" ? "text-purple-100" : "text-slate-400"
                  }`}>
                    Conheça nosso espaço e acolhimento
                  </span>
                </div>
              </button>

              {/* Button: Abordagens */}
              <button
                key="approaches"
                id="mobile-nav-btn-approaches"
                onClick={() => {
                  setActiveTab("approaches");
                  setIsOpen(false);
                }}
                className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  activeTab === "approaches"
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/15"
                    : "bg-white border-slate-100 hover:border-purple-200 text-slate-800"
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${
                  activeTab === "approaches" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600"
                }`}>
                  <HelpCircle className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <span className="font-sans font-black text-sm block leading-none">Abordagens</span>
                  <span className={`font-sans text-[9px] block mt-1.5 leading-tight ${
                    activeTab === "approaches" ? "text-purple-100" : "text-slate-400"
                  }`}>
                    Nossas especialidades de atuação
                  </span>
                </div>
              </button>

              {/* Button: Consulta Online */}
              <button
                key="online"
                id="mobile-nav-btn-online"
                onClick={() => {
                  setActiveTab("online");
                  setIsOpen(false);
                }}
                className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  activeTab === "online"
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/15"
                    : "bg-white border-slate-100 hover:border-purple-200 text-slate-800"
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${
                  activeTab === "online" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600"
                }`}>
                  <Video className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <span className="font-sans font-black text-sm block leading-none">Consulta Online</span>
                  <span className={`font-sans text-[9px] block mt-1.5 leading-tight ${
                    activeTab === "online" ? "text-purple-100" : "text-slate-400"
                  }`}>
                    Atendimento remoto com privacidade
                  </span>
                </div>
              </button>

              {/* Button: Agendar Consulta */}
              <button
                key="booking"
                id="mobile-nav-btn-booking"
                onClick={() => {
                  setActiveTab("booking");
                  setIsOpen(false);
                }}
                className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  activeTab === "booking"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/15"
                    : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-emerald-800"
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${
                  activeTab === "booking" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-600"
                }`}>
                  <Calendar className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <span className="font-sans font-black text-sm block leading-none">Agendar</span>
                  <span className={`font-sans text-[9px] block mt-1.5 leading-tight ${
                    activeTab === "booking" ? "text-emerald-100" : "text-emerald-700/90"
                  }`}>
                    Escolha seu melhor dia e horário
                  </span>
                </div>
              </button>

            </div>

            {/* Button: Acompanhar Agendamento */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveTab("tracking");
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between gap-3 w-full p-4.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  activeTab === "tracking"
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/15"
                    : "bg-white border-slate-100 hover:border-purple-200 text-slate-800"
                }`}
                id="mobile-nav-btn-tracking"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === "tracking" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600"
                  }`}>
                    <Search className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <span className="font-sans font-black text-xs block leading-none">Acompanhar Consulta</span>
                    <span className={`font-sans text-[9px] block mt-1 leading-tight ${
                      activeTab === "tracking" ? "text-purple-100" : "text-slate-400"
                    }`}>
                      Consulte seus horários pelo WhatsApp
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Mobile Admin panel button - bottom CTA */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setIsOpen(false);
                }}
                className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-xs font-sans font-extrabold tracking-wider uppercase transition-all border cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm"
                    : "bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-700"
                }`}
                id="mobile-nav-btn-admin"
              >
                <Sliders className="w-4 h-4 text-purple-600 shrink-0" />
                Acessar Painel Administrativo
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
