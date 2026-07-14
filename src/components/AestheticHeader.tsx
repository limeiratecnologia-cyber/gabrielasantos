import { ActiveTab } from "../types";
import { Sparkles, Heart, HelpCircle, Calendar, BookOpen, Menu, X, Sliders, Video } from "lucide-react";
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
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isBooking = item.id === "booking";

              return (
                <button
                  key={item.id}
                  id={`mobile-nav-btn-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-sans font-medium transition-all ${
                    isBooking
                      ? "bg-purple-600 text-white"
                      : isActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isBooking || isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Mobile Admin button */}
            <button
              onClick={() => {
                setActiveTab("admin");
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-sans font-medium transition-all ${
                activeTab === "admin"
                  ? "bg-purple-50 text-purple-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
              }`}
              id="mobile-nav-btn-admin"
            >
              <Sliders className="w-5 h-5 text-purple-600" />
              Painel Administrativo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
