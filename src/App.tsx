/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ActiveTab, Booking } from "./types";
import AestheticHeader from "./components/AestheticHeader";
import HomeSection from "./components/HomeSection";
import ApproachesSection from "./components/ApproachesSection";
import BookingSection from "./components/BookingSection";
import OnlineConsultationSection from "./components/OnlineConsultationSection";
import AdminSection from "./components/AdminSection";
import { CLINIC_INFO, IMAGES } from "./data";
import { getClinicInfoFromDb, saveHelpPsiEmergencyToDb } from "./lib/firebaseService";
import { Phone, ShieldAlert, X, MessageSquare, Check, AlertCircle, Heart } from "lucide-react";
import { db } from "./lib/firebase";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [displayedTab, setDisplayedTab] = useState<ActiveTab>("home");
  const [clinicInfo, setClinicInfo] = useState<any>(() => {
    const saved = localStorage.getItem("serenamente_clinic_info");
    if (saved) {
      try {
        return { ...CLINIC_INFO, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Erro ao ler serenamente_clinic_info no mount:", e);
      }
    }
    return CLINIC_INFO;
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem("serenamente_bookings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao ler serenamente_bookings no mount:", e);
      }
    }
    return [];
  });
  const [pngLogo, setPngLogo] = useState<string>("");
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // HelpPsi Emergency States
  const [showHelpPsiModal, setShowHelpPsiModal] = useState(false);
  const [helpName, setHelpName] = useState("");
  const [helpWhatsapp, setHelpWhatsapp] = useState("");
  const [helpSuccess, setHelpSuccess] = useState(false);
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

  const handleHelpPsiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpName.trim() || !helpWhatsapp.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmittingHelp(true);
    const emergencyId = `helppsi-${Date.now()}`;
    const newEmergency = {
      id: emergencyId,
      patientName: helpName.trim(),
      whatsapp: helpWhatsapp.trim(),
      status: "pending" as const,
      createdAt: new Date().toLocaleString("pt-BR"),
      timestamp: Date.now()
    };

    try {
      await saveHelpPsiEmergencyToDb(newEmergency);
      setHelpSuccess(true);
    } catch (err) {
      console.error("Erro ao enviar emergência:", err);
      // Direct emergency WhatsApp fallback
      const formattedWhatsapp = clinicInfo.clinicDetails?.phone?.replace(/\D/g, "") || "5511987654321";
      const waMsg = encodeURIComponent(`🚨 *SOS HelpPsi - EMERGÊNCIA CLÍNICA*\n\nOlá, me chamo ${helpName.trim()} e acabei de acionar o HelpPsi. Preciso conversar com urgência.\nContato: ${helpWhatsapp.trim()}`);
      window.open(`https://wa.me/${formattedWhatsapp}?text=${waMsg}`, "_blank");
      setHelpSuccess(true);
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  // Splash screen duration of 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Sync displayedTab with activeTab with a 2-second transition loader when changing tabs
  useEffect(() => {
    if (isSplashLoading) {
      setDisplayedTab(activeTab);
      return;
    }

    if (activeTab !== displayedTab) {
      setIsTransitionLoading(true);
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
        setIsTransitionLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isSplashLoading, displayedTab]);

  // Handle high-precision 2-second percentage countdown indicator (from 0% to 100%)
  useEffect(() => {
    if (isSplashLoading || isTransitionLoading) {
      setProgressPercent(0);
      const interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 20); // 20ms * 100 steps = 2000ms (2 seconds)
      return () => clearInterval(interval);
    }
  }, [isSplashLoading, isTransitionLoading]);

  // Sync clinicInfo with Firestore DB in real-time
  useEffect(() => {
    console.log("[App] Inicializando listener em tempo real para clinic_info/main...");
    const docRef = doc(db, "clinic_info", "main");
    const unsubscribeClinic = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const info = docSnap.data();
        console.log("[App] Informações clínicas sincronizadas em tempo real:", info);
        setClinicInfo(info);
        localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
      } else {
        console.log("[App] Documento clinic_info/main não existe, semeando valores padrão...");
        getClinicInfoFromDb().then((info) => {
          if (info) {
            setClinicInfo(info);
            localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
          }
        }).catch((err) => console.error("[App ERROR] Falha ao semear clinic_info:", err));
      }
    }, (err) => {
      console.error("[App ERROR] Erro no real-time listener de clinic_info, usando fallback local:", err);
      const saved = localStorage.getItem("serenamente_clinic_info");
      if (saved) {
        try {
          setClinicInfo(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    });

    // Sync bookings in real-time
    console.log("[App] Inicializando listener em tempo real para bookings...");
    const bookingsQuery = query(collection(db, "bookings"), orderBy("date", "asc"));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      console.log(`[App] Agendamentos atualizados em tempo real. Total: ${snapshot.size}`);
      const bList: Booking[] = [];
      snapshot.forEach((doc) => {
        bList.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(bList);
      localStorage.setItem("serenamente_bookings", JSON.stringify(bList));
    }, (err) => {
      console.error("[App ERROR] Erro no real-time listener de bookings, usando fallback local:", err);
    });

    return () => {
      console.log("[App] Removendo listeners em tempo real do App.tsx");
      unsubscribeClinic();
      unsubscribeBookings();
    };
  }, []);

  // Convert raw logo to a high-quality crisp PNG dynamically
  useEffect(() => {
    const rawLogo = clinicInfo.clinicLogo || IMAGES.logo;
    if (rawLogo) {
      import("./utils/imageUtils").then(({ convertToPng }) => {
        convertToPng(rawLogo).then((png) => {
          setPngLogo(png);
        });
      });
    }
  }, [clinicInfo.clinicLogo]);

  // Update Document Title and Favicon
  useEffect(() => {
    // 1. Title
    const titleToSet = clinicInfo.tabTitle || clinicInfo.therapistName || "Serena Mente - Dra. Gabriela Santos";
    document.title = titleToSet;

    // 2. Favicon
    const faviconToSet = pngLogo || clinicInfo.faviconUrl || clinicInfo.clinicLogo || IMAGES.logo;
    if (faviconToSet) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconToSet;
    }
  }, [clinicInfo, pngLogo]);

  const renderActiveSection = () => {
    const handleTriggerHelpPsi = () => {
      setHelpSuccess(false);
      setHelpName("");
      setHelpWhatsapp("");
      setShowHelpPsiModal(true);
    };

    switch (displayedTab) {
      case "home":
        return <HomeSection setActiveTab={setActiveTab} logoSrc={pngLogo} clinicInfo={clinicInfo} onTriggerHelpPsi={handleTriggerHelpPsi} />;
      case "approaches":
        return <ApproachesSection />;
      case "booking":
        return <BookingSection setActiveTab={setActiveTab} bookings={bookings} clinicInfo={clinicInfo} />;
      case "online":
        return <OnlineConsultationSection />;
      case "admin":
        return <AdminSection setActiveTab={setActiveTab} bookings={bookings} clinicInfo={clinicInfo} />;
      default:
        return <HomeSection setActiveTab={setActiveTab} logoSrc={pngLogo} clinicInfo={clinicInfo} onTriggerHelpPsi={handleTriggerHelpPsi} />;
    }
  };

  return (
    <>
      {/* 1. INITIAL SPLASH SCREEN LOADER (2 SECONDS) */}
      {isSplashLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#FCFDFD] via-[#FAF9FC] to-[#F5F2FA] z-[9999] flex flex-col items-center justify-center p-6" id="splash-screen">
          <div className="flex flex-col items-center max-w-md w-full text-center">
            {/* Elegant glowing logo container */}
            <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl border border-purple-500/10 flex items-center justify-center backdrop-blur-md mb-8">
              <div className="absolute -inset-1 rounded-[2.6rem] bg-gradient-to-tr from-purple-500 to-pink-500 opacity-20 blur-lg animate-pulse" />
              <img
                src={pngLogo || clinicInfo.clinicLogo || IMAGES.logo}
                alt="Logo"
                className="w-32 h-32 object-contain rounded-2xl relative z-10 image-render-crisp"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title / Name */}
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-none mb-2">
              {clinicInfo.therapistName}
            </h1>
            
            {/* Title / CRP */}
            <p className="font-sans text-xs tracking-widest text-purple-600 uppercase font-bold mb-8">
              {clinicInfo.title}
            </p>

            {/* Premium Indicator (Progress bar and percentage) */}
            <div className="w-56 h-1.5 bg-purple-100/50 rounded-full overflow-hidden relative mb-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-75 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-600 tracking-widest uppercase">
              Carregando {progressPercent}%
            </span>
          </div>
        </div>
      )}

      {/* 2. TAB TRANSITION OVERLAY LOADER (2 SECONDS) */}
      {isTransitionLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#FCFDFD]/95 via-[#FAF9FC]/98 to-[#F5F2FA]/95 backdrop-blur-md z-[9998] flex flex-col items-center justify-center p-6 animate-fade-in" id="transition-loader">
          <div className="flex flex-col items-center max-w-md w-full text-center">
            {/* Elegant pulsing logo container */}
            <div className="relative p-5 bg-white rounded-[2rem] shadow-xl border border-purple-500/10 flex items-center justify-center mb-6">
              <div className="absolute -inset-1 rounded-[2.1rem] bg-gradient-to-tr from-purple-500 to-pink-500 opacity-15 blur-md animate-pulse" />
              <img
                src={pngLogo || clinicInfo.clinicLogo || IMAGES.logo}
                alt="Carregando..."
                className="w-20 h-20 object-contain rounded-xl relative z-10 image-render-crisp"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title / Name */}
            <h2 className="font-sans font-extrabold text-xl text-slate-900 tracking-tight leading-none mb-1">
              {clinicInfo.therapistName}
            </h2>
            <p className="font-sans text-[10px] tracking-widest text-purple-600 uppercase font-bold mb-6">
              {clinicInfo.title}
            </p>

            {/* Premium Indicator (Progress bar and percentage) */}
            <div className="w-48 h-1 bg-purple-100/50 rounded-full overflow-hidden relative mb-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-75 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-600 tracking-widest uppercase">
              Acessando {progressPercent}%
            </span>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#FCFDFD] flex flex-col font-sans selection:bg-purple-600/10 selection:text-purple-900" id="app-root">
        {/* Aesthetic Header / Navigation */}
        <AestheticHeader activeTab={activeTab} setActiveTab={setActiveTab} logoSrc={pngLogo} clinicInfo={clinicInfo} />

        {/* Main Content Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-fade-in">
            {renderActiveSection()}
          </div>
        </main>

        {/* HelpPsi Emergency Modal Overlay */}
        {showHelpPsiModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in" id="helppsi-modal">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 p-6 md:p-8 shadow-2xl space-y-6 relative animate-slide-in">
              <button
                onClick={() => setShowHelpPsiModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              {!helpSuccess ? (
                <form onSubmit={handleHelpPsiSubmit} className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shadow-inner">
                      <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-sans font-extrabold text-slate-950 text-xl tracking-tight">
                        Suporte de Urgência - HelpPsi
                      </h3>
                      <p className="font-sans text-slate-500 text-xs leading-relaxed">
                        Precisa conversar com urgência? Acione o HelpPsi. A psicóloga receberá um alerta em tempo real e entrará em contato via WhatsApp o mais rápido possível.
                      </p>
                    </div>
                  </div>

                  {clinicInfo.showPrices && (
                    <div className="bg-amber-50/70 border border-amber-100/60 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-sans font-bold text-amber-800 uppercase tracking-wider">
                        Valor do Atendimento Emergencial
                      </p>
                      <p className="text-lg font-black text-amber-950 font-sans mt-0.5">
                        {clinicInfo.priceHelpPsi || "R$ 150,00"}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-widest">
                        Seu Nome Completo
                      </label>
                      <input
                        id="helppsi-name-input"
                        type="text"
                        required
                        placeholder="Ex: Carlos Oliveira"
                        value={helpName}
                        onChange={(e) => setHelpName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-rose-600 focus:bg-white rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-widest">
                        Seu WhatsApp com DDD
                      </label>
                      <input
                        id="helppsi-phone-input"
                        type="tel"
                        required
                        placeholder="Ex: (11) 98765-4321"
                        value={helpWhatsapp}
                        onChange={(e) => setHelpWhatsapp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-rose-600 focus:bg-white rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setShowHelpPsiModal(false)}
                      className="w-full sm:w-1/3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-sans font-bold text-xs py-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition text-center cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      id="helppsi-submit-btn"
                      type="submit"
                      disabled={isSubmittingHelp}
                      className="w-full sm:w-2/3 bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold text-xs py-3 rounded-2xl shadow-lg shadow-rose-600/10 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 font-sans"
                    >
                      <Phone className="w-4 h-4" />
                      {isSubmittingHelp ? "Acionando..." : "Acionar SOS HelpPsi"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-5 py-2 animate-fade-in">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner text-emerald-600">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-extrabold text-slate-900 text-xl tracking-tight">
                      Emergência Recebida!
                    </h3>
                    <p className="font-sans text-slate-500 text-xs leading-relaxed">
                      Olá <strong>{helpName}</strong>, seu pedido de suporte HelpPsi foi transmitido com sucesso à <strong>{clinicInfo.therapistName}</strong>.
                    </p>
                    <p className="font-sans text-slate-400 text-[11px] leading-relaxed">
                      Para acelerar seu contato, você também pode clicar no botão abaixo para abrir uma conversa direta no WhatsApp agora mesmo.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => {
                        const psychologistPhone = clinicInfo.clinicDetails?.phone?.replace(/\D/g, "") || "5511987654321";
                        const text = encodeURIComponent(`🚨 *SOS HelpPsi - EMERGÊNCIA CLÍNICA*\n\nOlá Dra. Gabriela Santos, acabei de acionar o HelpPsi no site. Preciso de suporte psicológico urgente.\n\nNome: *${helpName}*\nWhatsApp: *${helpWhatsapp}*`);
                        window.open(`https://wa.me/${psychologistPhone}?text=${text}`, "_blank");
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-sans font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-green-600/10 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Falar no WhatsApp Agora
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHelpPsiModal(false)}
                      className="w-full text-slate-400 hover:text-slate-600 font-sans font-bold text-[11px] py-1 transition cursor-pointer"
                    >
                      Fechar Janela
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

