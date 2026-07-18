import React from "react";
import { ActiveTab } from "../types";
import { Heart, HelpCircle, Video, Calendar, Sliders, Search } from "lucide-react";
import { IMAGES } from "../data";

interface MobileHubProps {
  setActiveTab: (tab: ActiveTab) => void;
  logoSrc?: string;
  clinicInfo: any;
}

export default function MobileHub({ setActiveTab, logoSrc, clinicInfo }: MobileHubProps) {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-140px)] py-6 px-4 animate-fade-in" id="mobile-hub-container">
      
      {/* Highlighted Logo Section */}
      <div className="flex flex-col items-center text-center space-y-3.5 pb-8 w-full max-w-sm" id="mobile-hub-logo-highlight">
        <div className="relative">
          {/* Visual glowing background effect */}
          <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full scale-125 animate-pulse" />
          <img 
            src={logoSrc || clinicInfo.clinicLogo || IMAGES.logo} 
            alt={`Logo ${clinicInfo.therapistName}`} 
            className="w-24 h-24 object-contain relative z-10 p-3 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl animate-fade-in image-render-crisp"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="space-y-1.5">
          <h1 className="font-sans font-black text-2xl text-slate-900 tracking-tight leading-none">
            {clinicInfo.therapistName}
          </h1>
          <p className="font-sans text-xs text-purple-600 font-black tracking-widest uppercase">
            {clinicInfo.title}
          </p>
          {clinicInfo.tagline && (
            <p className="font-sans text-xs text-slate-400 max-w-xs mx-auto pt-1 italic leading-relaxed">
              "{clinicInfo.tagline}"
            </p>
          )}
        </div>
      </div>

      <div className="w-full border-t border-slate-100/70 my-2 max-w-sm" />

      {/* Interactive Bento Grid of Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4" id="mobile-hub-grid">
        
        {/* Button: A Clínica */}
        <button
          onClick={() => setActiveTab("home")}
          className="flex flex-col items-start justify-between gap-6 p-5 rounded-3xl border text-left transition-all relative overflow-hidden bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/15 active:scale-[0.98] cursor-pointer min-h-[145px]"
          id="mobile-hub-btn-home"
        >
          <div className="p-2.5 rounded-2xl bg-white/15 text-white">
            <Heart className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="font-sans font-black text-[15px] block leading-none">A Clínica</span>
            <span className="font-sans text-[10px] block mt-1.5 leading-tight text-purple-100">
              Conheça nosso espaço e acolhimento
            </span>
          </div>
        </button>

        {/* Button: Abordagens */}
        <button
          onClick={() => setActiveTab("approaches")}
          className="flex flex-col items-start justify-between gap-6 p-5 rounded-3xl border text-left transition-all relative overflow-hidden bg-white border-slate-100/80 hover:border-purple-200 text-slate-800 active:scale-[0.98] shadow-sm cursor-pointer min-h-[145px]"
          id="mobile-hub-btn-approaches"
        >
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
            <HelpCircle className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="font-sans font-black text-[15px] block leading-none">Abordagens</span>
            <span className="font-sans text-[10px] block mt-1.5 leading-tight text-slate-400">
              Nossas especialidades de atuação
            </span>
          </div>
        </button>

        {/* Button: Consulta Online */}
        <button
          onClick={() => setActiveTab("online")}
          className="flex flex-col items-start justify-between gap-6 p-5 rounded-3xl border text-left transition-all relative overflow-hidden bg-white border-slate-100/80 hover:border-purple-200 text-slate-800 active:scale-[0.98] shadow-sm cursor-pointer min-h-[145px]"
          id="mobile-hub-btn-online"
        >
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
            <Video className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="font-sans font-black text-[15px] block leading-none">Consulta Online</span>
            <span className="font-sans text-[10px] block mt-1.5 leading-tight text-slate-400">
              Atendimento remoto com privacidade
            </span>
          </div>
        </button>

        {/* Button: Agendar */}
        <button
          onClick={() => setActiveTab("booking")}
          className="flex flex-col items-start justify-between gap-6 p-5 rounded-3xl border text-left transition-all relative overflow-hidden bg-emerald-50/50 border-emerald-100 text-emerald-800 hover:bg-emerald-100 active:scale-[0.98] shadow-sm cursor-pointer min-h-[145px]"
          id="mobile-hub-btn-booking"
        >
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600">
            <Calendar className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="font-sans font-black text-[15px] block leading-none">Agendar</span>
            <span className="font-sans text-[10px] block mt-1.5 leading-tight text-emerald-700/90">
              Escolha seu melhor dia e horário
            </span>
          </div>
        </button>

      </div>

      {/* Button: Acompanhar Agendamento */}
      <div className="w-full max-w-sm pt-4" id="mobile-hub-tracking-container">
        <button
          onClick={() => setActiveTab("tracking")}
          className="flex items-center justify-between gap-3 w-full p-4.5 rounded-3xl border text-left transition-all relative overflow-hidden bg-white border-slate-100 hover:border-purple-200 text-slate-800 active:scale-[0.98] shadow-sm cursor-pointer"
          id="mobile-hub-btn-tracking"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <Search className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className="font-sans font-black text-[15px] block leading-none">Acompanhar Consulta</span>
              <span className="font-sans text-[10px] block mt-1 leading-tight text-slate-400">
                Consulte data, horário e sala pelo WhatsApp
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Mobile Admin panel button - bottom CTA */}
      <div className="w-full max-w-sm pt-6" id="mobile-hub-admin-cta">
        <button
          onClick={() => setActiveTab("admin")}
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-xs font-sans font-extrabold tracking-wider uppercase transition-all border border-slate-100 bg-slate-50/80 text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 cursor-pointer shadow-sm active:scale-[0.99]"
          id="mobile-hub-btn-admin"
        >
          <Sliders className="w-4 h-4 text-purple-500 shrink-0" />
          Acessar Painel Administrativo
        </button>
      </div>

    </div>
  );
}
