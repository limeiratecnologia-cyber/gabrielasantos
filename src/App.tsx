/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ActiveTab } from "./types";
import AestheticHeader from "./components/AestheticHeader";
import HomeSection from "./components/HomeSection";
import ApproachesSection from "./components/ApproachesSection";
import BookingSection from "./components/BookingSection";
import OnlineConsultationSection from "./components/OnlineConsultationSection";
import AdminSection from "./components/AdminSection";
import { CLINIC_INFO, IMAGES } from "./data";
import { getClinicInfoFromDb } from "./lib/firebaseService";

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
  const [pngLogo, setPngLogo] = useState<string>("");
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

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

  // Sync clinicInfo with Firestore DB
  useEffect(() => {
    getClinicInfoFromDb().then((info) => {
      if (info) {
        setClinicInfo(info);
        localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
      }
    }).catch((err) => {
      console.error("Erro ao carregar clinicInfo do Firestore:", err);
      const saved = localStorage.getItem("serenamente_clinic_info");
      if (saved) {
        try {
          setClinicInfo(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, [activeTab]);

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
    switch (displayedTab) {
      case "home":
        return <HomeSection setActiveTab={setActiveTab} logoSrc={pngLogo} clinicInfo={clinicInfo} />;
      case "approaches":
        return <ApproachesSection />;
      case "booking":
        return <BookingSection setActiveTab={setActiveTab} />;
      case "online":
        return <OnlineConsultationSection />;
      case "admin":
        return <AdminSection setActiveTab={setActiveTab} />;
      default:
        return <HomeSection setActiveTab={setActiveTab} logoSrc={pngLogo} clinicInfo={clinicInfo} />;
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
      </div>
    </>
  );
}

