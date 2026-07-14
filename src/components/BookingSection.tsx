import { useState, useEffect, FormEvent } from "react";
import { Booking, Patient, ActiveTab } from "../types";
import { APPROACHES } from "../data";
import { Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, Trash2, ShieldCheck, Heart, ArrowRight, ChevronLeft, ChevronRight, Lock, Video, Copy, ClipboardCheck } from "lucide-react";
import { getBookingsFromDb, saveBookingToDb, deleteBookingFromDb, getApproachesFromDb, savePatientToDb } from "../lib/firebaseService";

interface BookingSectionProps {
  setActiveTab?: (tab: ActiveTab) => void;
}

export default function BookingSection({ setActiveTab }: BookingSectionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [step, setStep] = useState(1);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [approaches, setApproaches] = useState<typeof APPROACHES>(APPROACHES);

  // Form State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [approach, setApproach] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Load approaches from Firestore
  useEffect(() => {
    getApproachesFromDb().then((apps) => {
      setApproaches(apps);
      if (apps.length > 0) {
        setApproach(apps[0].fullName);
      }
    }).catch((err) => {
      console.error("Erro ao carregar abordagens do Firestore:", err);
      // Fallback local
      const savedApps = localStorage.getItem("serenamente_approaches");
      if (savedApps) {
        try {
          const parsed = JSON.parse(savedApps);
          setApproaches(parsed);
          if (parsed.length > 0) {
            setApproach(parsed[0].fullName);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setApproach(APPROACHES[0].fullName);
      }
    });
  }, []);

  const timeSlots = [
    "08:00 - 09:00",
    "09:30 - 10:30",
    "11:00 - 12:00",
    "13:30 - 14:30",
    "15:00 - 16:00",
    "16:30 - 17:30",
    "18:00 - 19:00"
  ];

  // Load bookings from Firestore on mount
  useEffect(() => {
    getBookingsFromDb().then((list) => {
      setBookings(list);
    }).catch((err) => {
      console.error("Erro ao carregar agendamentos do Firestore:", err);
      const saved = localStorage.getItem("serenamente_bookings");
      if (saved) {
        try {
          setBookings(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, []);

  const saveBookings = async (newBookings: Booking[]) => {
    setBookings(newBookings);
    // Individual submissions are handled directly in handlers, but we update state here
  };

  const handleBookingSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!clientName || !clientEmail || !clientPhone || !date || !timeSlot) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const formattedSelectedDate = new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    const isDoubleBooked = bookings.some(
      (b) => b.status === "scheduled" && b.date === formattedSelectedDate && b.timeSlot === timeSlot
    );

    if (isDoubleBooked) {
      setErrorMsg("Este horário já foi reservado para esta data por outro paciente. Por favor, escolha outro dia ou horário.");
      return;
    }

    const generatedRoomCode = "SRM-" + Math.floor(1000 + Math.random() * 9000);

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      clientName,
      clientEmail,
      clientPhone,
      approach,
      date: formattedSelectedDate,
      timeSlot,
      notes,
      status: "scheduled",
      roomCode: generatedRoomCode
    };

    // Register patient in patient database
    const patientId = clientEmail.trim().toLowerCase();
    const newPatient: Patient = {
      id: patientId,
      name: clientName.trim(),
      email: clientEmail.trim(),
      phone: clientPhone.trim(),
      createdAt: new Date().toLocaleDateString("pt-BR")
    };

    savePatientToDb(newPatient)
      .then(() => {
        console.log("Paciente registrado/atualizado com sucesso no banco de dados.");
      })
      .catch((err) => {
        console.error("Erro ao registrar paciente no banco de dados:", err);
      });

    saveBookingToDb(newBooking).then(() => {
      const updated = [newBooking, ...bookings];
      setBookings(updated);
      setLastBooking(newBooking);
    }).catch((err) => {
      console.error("Erro ao salvar agendamento no Firestore:", err);
      const updated = [newBooking, ...bookings];
      setBookings(updated);
      setLastBooking(newBooking);
    });

    // Reset Form
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setApproach(approaches[0]?.fullName || "");
    setDate("");
    setTimeSlot("");
    setNotes("");

    setSuccessMsg("Agendamento prévio solicitado com sucesso!");
    setStep(1);

    // Auto clear success message after 10 seconds
    setTimeout(() => {
      setSuccessMsg("");
    }, 10000);
  };

  const handleCancelBooking = (id: string) => {
    if (confirm("Deseja realmente cancelar esta solicitação de consulta?")) {
      deleteBookingFromDb(id).then(() => {
        const updated = bookings.filter((b) => b.id !== id);
        setBookings(updated);
      }).catch((err) => {
        console.error("Erro ao remover agendamento do Firestore:", err);
        const updated = bookings.filter((b) => b.id !== id);
        setBookings(updated);
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6" id="booking-section">
      {/* Left Column: Booking Form Wizard */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-lg">
          <div className="border-b border-slate-100 pb-5 mb-6 space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider font-sans">
              <Calendar className="w-3.5 h-3.5" />
              Solicitação de Atendimento
            </span>
            <h3 className="font-sans font-extrabold text-slate-900 text-2xl tracking-tight">
              Agende sua consulta inicial
            </h3>
            <p className="font-sans text-slate-500 text-xs sm:text-sm leading-relaxed">
              Preencha o formulário para agendar sua primeira consulta presencial ou online com a Dra. Gabriela Santos.
            </p>
          </div>

          {/* Alert Success */}
          {successMsg && (
            <div className="bg-purple-50 text-purple-950 border border-purple-100 rounded-3xl p-6 mb-6 space-y-4 animate-fade-in shadow-sm">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-5.5 h-5.5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm font-sans space-y-1 flex-1">
                  <p className="font-bold text-purple-900 text-base">{successMsg}</p>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Entraremos em contato via WhatsApp nas próximas 2 horas comerciais para confirmar sua sessão.
                  </p>
                </div>
              </div>

              {lastBooking?.roomCode && (
                <div className="bg-white rounded-2xl p-4 border border-purple-100 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">
                        CÓDIGO DE CONSULTA VÍDEO ONLINE
                      </span>
                      <span className="font-mono font-bold text-lg text-purple-800 tracking-wider">
                        {lastBooking.roomCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(lastBooking.roomCode!);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-sans font-bold px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-100 flex-1 sm:flex-none"
                      >
                        {copiedCode ? (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            Copiar Código
                          </>
                        )}
                      </button>
                      
                      {setActiveTab && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("online")}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-sans font-bold px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Acessar Sala
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    💡 <strong>Como funciona?</strong> Guarde este código. No dia e horário da consulta agendada, acesse a aba <strong>Consulta Online</strong> no menu superior, insira o código acima e ative sua chamada de vídeo instantaneamente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error feedback */}
          {errorMsg && (
            <div className="bg-rose-50 text-rose-800 rounded-2xl p-4 mb-6 text-xs font-sans border border-rose-100">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form Progress Indicator */}
          <div className="flex items-center justify-between mb-8 text-xs font-sans font-bold text-slate-400">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-all cursor-pointer ${
                step === 1 ? "border-purple-600 text-purple-700 font-extrabold" : "border-transparent hover:text-slate-600"
              }`}
            >
              1. Identificação
            </button>
            <div className="h-[1px] bg-slate-100 flex-1 mx-4" />
            <button
              onClick={() => {
                if (clientName && clientEmail && clientPhone) setStep(2);
              }}
              className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-all cursor-pointer ${
                step === 2 ? "border-purple-600 text-purple-700 font-extrabold" : "border-transparent hover:text-slate-600"
              }`}
            >
              2. Abordagem & Horário
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                    Seu Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    <input
                      id="input-booking-name"
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-sans outline-none text-slate-800 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                      E-mail de Contato *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                      <input
                        id="input-booking-email"
                        type="email"
                        required
                        placeholder="Ex: joao@email.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-sans outline-none text-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                      Telefone / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                      <input
                        id="input-booking-phone"
                        type="tel"
                        required
                        placeholder="Ex: (11) 98765-4321"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-sans outline-none text-slate-800 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    id="btn-next-step-booking"
                    type="button"
                    disabled={!clientName || !clientEmail || !clientPhone}
                    onClick={() => setStep(2)}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-sans font-bold text-xs px-6 py-3.5 rounded-full shadow-lg shadow-purple-600/10 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    Prosseguir
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                    Abordagem de Preferência *
                  </label>
                  <select
                    id="select-booking-approach"
                    value={approach}
                    onChange={(e) => setApproach(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl px-4 py-3.5 text-sm font-sans outline-none text-slate-800 transition-all cursor-pointer"
                  >
                    {approaches.map((appr, idx) => (
                      <option key={idx} value={appr.fullName}>
                        {appr.fullName}
                      </option>
                    ))}
                    <option value="Ainda não sei (Decidir em consulta)">
                      Ainda não sei (Decidir com a doutora)
                    </option>
                  </select>
                </div>

                {/* Calendário Interativo Completo */}
                <div className="space-y-4 border border-slate-100 rounded-3xl p-5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                      Selecione o Dia no Calendário *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentMonth === 0) {
                            setCurrentMonth(11);
                            setCurrentYear(currentYear - 1);
                          } else {
                            setCurrentMonth(currentMonth - 1);
                          }
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold font-sans text-slate-800 min-w-[100px] text-center">
                        {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][currentMonth]} {currentYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentMonth === 11) {
                            setCurrentMonth(0);
                            setCurrentYear(currentYear + 1);
                          } else {
                            setCurrentMonth(currentMonth + 1);
                          }
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Week days header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold font-sans text-slate-400 border-b border-slate-100 pb-2">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((wd) => (
                      <div key={wd}>{wd}</div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {/* Padding cells */}
                    {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="aspect-square" />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const yStr = currentYear;
                      const mStr = String(currentMonth + 1).padStart(2, "0");
                      const dStr = String(dayNum).padStart(2, "0");
                      const cellDateString = `${yStr}-${mStr}-${dStr}`;
                      const cellPtBR = `${dStr}/${mStr}/${yStr}`;

                      // Check if in the past
                      const cellDateObj = new Date(currentYear, currentMonth, dayNum, 23, 59, 59);
                      const isPast = cellDateObj < new Date();

                      // Count bookings on this day
                      const dayBookings = bookings.filter((b) => b.date === cellPtBR && b.status === "scheduled");

                      const isSelected = date === cellDateString;

                      return (
                        <button
                          key={`day-${dayNum}`}
                          type="button"
                          disabled={isPast}
                          onClick={() => {
                            setDate(cellDateString);
                            setTimeSlot(""); // Force re-selection
                          }}
                          className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-sans transition-all relative cursor-pointer ${
                            isPast 
                              ? "text-slate-300 bg-transparent cursor-not-allowed" 
                              : isSelected
                                ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20"
                                : "hover:bg-purple-50 hover:text-purple-700 bg-white border border-slate-100 text-slate-700"
                          }`}
                        >
                          <span>{dayNum}</span>
                          
                          {/* Visual bullets for appointments */}
                          {!isPast && dayBookings.length > 0 && (
                            <span className="absolute bottom-1 flex gap-0.5 justify-center">
                              {dayBookings.slice(0, 3).map((_, bIdx) => (
                                <span 
                                  key={bIdx} 
                                  className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-purple-500"}`} 
                                />
                              ))}
                              {dayBookings.length > 3 && (
                                <span className={`text-[7px] leading-none ${isSelected ? "text-white" : "text-purple-500"}`}>+</span>
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horários para o Dia Selecionado */}
                {date && (
                  <div className="space-y-3 animate-fade-in border border-slate-100 rounded-3xl p-5 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                        Horários para {new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })} *
                      </label>
                      <span className="text-[11px] font-sans text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full font-bold">
                        {bookings.filter(b => b.date === new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" }) && b.status === "scheduled").length} ocupado(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {timeSlots.map((ts, idx) => {
                        const formattedSelectedDate = new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
                        const isBooked = bookings.some(
                          (b) => b.status === "scheduled" && b.date === formattedSelectedDate && b.timeSlot === ts
                        );
                        const isSelected = timeSlot === ts;

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setTimeSlot(ts)}
                            className={`px-3 py-3 rounded-2xl text-xs font-sans font-medium transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                              isBooked
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                : isSelected
                                  ? "bg-purple-600 border-purple-600 text-white font-bold shadow-md shadow-purple-600/10"
                                  : "bg-white border-slate-100 hover:border-purple-300 hover:bg-purple-50/30 text-slate-700"
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1">
                              {ts}
                            </span>
                            <span className={`text-[10px] ${isBooked ? "text-slate-400" : isSelected ? "text-purple-200" : "text-slate-500"}`}>
                              {isBooked ? "🔒 Ocupado" : "🟢 Livre"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                    Observações Adicionais (Opcional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    <textarea
                      id="input-booking-notes"
                      rows={3}
                      placeholder="Ex: Prefiro atendimento por videoconferência / Tenho crises de pânico..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-sans outline-none text-slate-800 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    id="btn-back-step-booking"
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-800 font-sans font-bold text-sm transition cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    id="btn-submit-booking"
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs px-6 py-3.5 rounded-full shadow-lg shadow-purple-600/15 transition cursor-pointer"
                  >
                    Solicitar Agendamento
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Protection disclaimer */}
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex gap-3.5 items-center shadow-xs">
          <ShieldCheck className="w-8 h-8 text-purple-600 shrink-0" />
          <p className="font-sans text-slate-500 text-[11px] sm:text-xs leading-relaxed">
            Seus dados pessoais fornecidos acima são confidenciais e estão seguros de acordo com as normas do Conselho Federal de Psicologia (CFP) e da Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>
      </div>

      {/* Right Column: User's requested appointments list */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg flex flex-col h-[520px]">
          <div className="border-b border-slate-100 pb-4 shrink-0">
            <h4 className="font-sans font-extrabold text-slate-900 text-sm">Suas Consultas Solicitadas</h4>
            <p className="font-sans text-slate-500 text-[11px] font-semibold mt-0.5">Gerenciamento de solicitações de terapia</p>
          </div>

          {/* Scrollable Bookings list */}
          <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
            {bookings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                  <Heart className="w-5 h-5 text-purple-700" />
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-bold text-slate-700 text-sm">Nenhuma Consulta Solicitada</p>
                  <p className="font-sans text-slate-400 text-xs leading-relaxed max-w-xs">
                    Suas solicitações de sessões enviadas pelo formulário aparecerão registradas aqui para seu controle pessoal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-[#FCFDFD] rounded-2xl p-4 border border-slate-100 shadow-xs relative group hover:border-purple-500/15 transition-all duration-300"
                  >
                    {/* Delete booking request */}
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Cancelar Solicitação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-sans font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                          Aguardando Confirmação
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-sans font-bold text-slate-900 text-xs sm:text-sm">
                          {b.approach}
                        </h5>
                        <p className="font-sans text-slate-500 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" /> {b.date}
                        </p>
                        <p className="font-sans text-slate-500 text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-600" /> {b.timeSlot}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="block text-[10px] font-sans text-slate-500">
                          <strong>Paciente:</strong> {b.clientName}
                        </span>
                        <span className="block text-[10px] font-sans text-slate-500 mt-0.5">
                          <strong>WhatsApp:</strong> {b.clientPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
