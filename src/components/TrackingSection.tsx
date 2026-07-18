import React, { useState, useEffect, useRef } from "react";
import { Booking } from "../types";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Phone, Calendar, Clock, Video, MapPin, Search, AlertCircle, Sparkles, ArrowRight, User, Check, X, Bell, Volume2 } from "lucide-react";

interface AlertNotification {
  id: string;
  bookingId: string;
  date: string;
  timeSlot: string;
  oldStatus: string;
  newStatus: string;
  patientName: string;
  timestamp: Date;
}

export default function TrackingSection() {
  const [phoneQuery, setPhoneQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time tracking and notifications state
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const prevBookingsRef = useRef<Booking[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const cleanNumber = (num: string) => {
    return num.replace(/\D/g, "");
  };

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // First chime (C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);

      // Second chime (E5) slightly delayed
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.45);
      }, 120);
    } catch (e) {
      console.warn("Audio context fallback error:", e);
    }
  };

  const translateStatus = (status: Booking["status"]) => {
    switch (status) {
      case "scheduled": return "Confirmado";
      case "completed": return "Realizado";
      case "cancelled": return "Cancelado";
      default: return status || "Em análise";
    }
  };

  const requestBellPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        new Notification("Notificações Ativas!", {
          body: "Você será avisado aqui quando o status da sua consulta mudar.",
          silent: false
        });
        playNotificationSound();
      }
    }
  };

  // Setup Real-time listener when user submits the WhatsApp number
  useEffect(() => {
    if (!activePhone) return;

    setIsLoading(true);
    const queryDigits = cleanNumber(activePhone);
    const q = query(collection(db, "bookings"), orderBy("date", "asc"));

    // Prevent notifications on initial data fetch
    let isFirstSnapshot = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Booking[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Booking);
      });

      // Filter in-memory using matching digits
      const matched = fetched.filter((b) => {
        const dbDigits = cleanNumber(b.clientPhone || "");
        return dbDigits.includes(queryDigits) || queryDigits.includes(dbDigits);
      });

      // Sort by date/time (newest first)
      matched.sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-") + "T" + (a.timeSlot || "00:00"));
        const dateB = new Date(b.date.split("/").reverse().join("-") + "T" + (b.timeSlot || "00:00"));
        return dateB.getTime() - dateA.getTime();
      });

      // Verify if any booking has status changed
      if (!isFirstSnapshot) {
        matched.forEach((newBooking) => {
          const oldBooking = prevBookingsRef.current.find((b) => b.id === newBooking.id);
          // If booking previously existed and its status changed
          if (oldBooking && oldBooking.status !== newBooking.status) {
            const translatedOld = translateStatus(oldBooking.status);
            const translatedNew = translateStatus(newBooking.status);

            // 1. Play alert chime
            playNotificationSound();

            // 2. Add visual alert to list
            const alertId = Math.random().toString(36).substring(2, 9);
            const newAlert: AlertNotification = {
              id: alertId,
              bookingId: newBooking.id,
              date: newBooking.date,
              timeSlot: newBooking.timeSlot,
              oldStatus: translatedOld,
              newStatus: translatedNew,
              patientName: newBooking.clientName,
              timestamp: new Date(),
            };
            setAlerts((prev) => [newAlert, ...prev]);

            // 3. Browser Push Notification
            if (Notification.permission === "granted") {
              try {
                new Notification("Alteração no seu Agendamento!", {
                  body: `Olá ${newBooking.clientName}, sua consulta de ${newBooking.date} às ${newBooking.timeSlot} foi alterada de "${translatedOld}" para "${translatedNew}".`,
                  requireInteraction: true,
                });
              } catch (e) {
                console.error("Erro ao disparar notificação do navegador:", e);
              }
            }
          }
        });
      }

      setResults(matched);
      prevBookingsRef.current = matched;
      isFirstSnapshot = false;
      setIsLoading(false);
      setHasSearched(true);
    }, (err) => {
      console.error("Erro ao escutar agendamentos em tempo real:", err);
      setError("Ocorreu um erro na conexão em tempo real. Tentando reconectar...");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activePhone]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryDigits = cleanNumber(phoneQuery);
    
    if (queryDigits.length < 8) {
      setError("Por favor, digite um número de WhatsApp válido com DDD.");
      return;
    }

    setError(null);
    setActivePhone(phoneQuery);

    // Prompt for web notification permission gently if default
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      requestBellPermission();
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 uppercase tracking-wider font-sans">
            ● Confirmado
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider font-sans">
            ● Realizado
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 uppercase tracking-wider font-sans">
            ● Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const renderTimeline = (booking: Booking) => {
    const status = booking.status;
    
    // Four steps as requested: 'Recebido', 'Em análise', 'Confirmado' and 'Concluído'
    const steps = [
      {
        key: "recebido",
        label: "Recebido",
        description: "Pedido recebido com sucesso",
        isCompleted: true,
        isActive: false,
      },
      {
        key: "analise",
        label: "Em análise",
        description: "Verificando dados do paciente",
        isCompleted: status !== "cancelled",
        isActive: false,
      },
      {
        key: "confirmado",
        label: status === "cancelled" ? "Cancelado" : "Confirmado",
        description: status === "cancelled" ? "Sessão cancelada" : "Confirmado na agenda",
        isCompleted: status === "scheduled" || status === "completed",
        isActive: status === "scheduled",
        isCancelled: status === "cancelled",
      },
      {
        key: "concluido",
        label: "Concluído",
        description: "Sessão realizada",
        isCompleted: status === "completed",
        isActive: status === "completed",
      }
    ];

    // Connect line width percentage
    let lineWidth = "0%";
    if (status === "completed") {
      lineWidth = "100%";
    } else if (status === "scheduled") {
      lineWidth = "66%";
    } else if (status === "cancelled") {
      lineWidth = "66%";
    }

    return (
      <div className="pt-2 pb-1 border-t border-b border-slate-50 my-2" id={`timeline-${booking.id}`}>
        <span className="text-[10px] text-slate-400 font-sans tracking-wider uppercase font-extrabold block mb-4">
          Etapas do Agendamento
        </span>
        
        {/* Visual Timeline Stepper */}
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4 pb-2">
          
          {/* Desktop connecting line */}
          <div className="absolute hidden md:block top-5 left-10 right-10 h-0.5 bg-slate-100 z-0">
            <div 
              className={`h-full transition-all duration-500 ${status === "cancelled" ? "bg-rose-500" : "bg-purple-600"}`}
              style={{ width: lineWidth }} 
            />
          </div>

          {/* Mobile connecting line */}
          <div className="absolute md:hidden left-5 top-5 bottom-5 w-0.5 bg-slate-100 z-0">
            <div 
              className={`w-full transition-all duration-500 ${status === "cancelled" ? "bg-rose-500" : "bg-purple-600"}`}
              style={{ height: lineWidth }} 
            />
          </div>

          {steps.map((step, idx) => {
            // Determine active, completed or cancelled status
            let circleStyle = "bg-slate-50 text-slate-400 border-slate-200";
            let textStyle = "text-slate-400 font-bold";
            let descStyle = "text-slate-400";
            
            if (step.isCancelled) {
              circleStyle = "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200 z-10 scale-110";
              textStyle = "text-rose-600 font-black";
              descStyle = "text-rose-400";
            } else if (step.isCompleted) {
              circleStyle = "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100 z-10";
              textStyle = "text-slate-800 font-extrabold";
              descStyle = "text-slate-500";
            } else if (step.isActive) {
              circleStyle = "bg-purple-50 text-purple-600 border-purple-300 animate-pulse z-10 scale-105";
              textStyle = "text-purple-700 font-black";
              descStyle = "text-purple-500";
            }

            return (
              <div 
                key={step.key} 
                className="relative z-10 flex md:flex-col items-center md:text-center gap-4 md:gap-1.5 flex-1 w-full"
              >
                {/* Stepper Circle */}
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-sans font-black text-xs sm:text-sm shrink-0 transition-all duration-300 ${circleStyle}`}>
                  {step.isCancelled ? (
                    <X className="w-4 h-4" />
                  ) : step.isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>0{idx + 1}</span>
                  )}
                </div>

                {/* Stepper Labels */}
                <div className="space-y-0.5 text-left md:text-center">
                  <span className={`font-sans text-xs block leading-none ${textStyle}`}>
                    {step.label}
                  </span>
                  <span className={`font-sans text-[9px] block leading-tight max-w-[150px] ${descStyle}`}>
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 space-y-8 animate-fade-in relative" id="tracking-section-container">
      
      {/* Floating In-App Notifications / Real-time Toast Alerts Container */}
      {alerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full px-4 sm:px-0" id="realtime-alerts-container">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-white border-2 border-purple-500 rounded-3xl p-4.5 shadow-2xl shadow-purple-900/10 flex items-start gap-3.5 relative overflow-hidden animate-slide-in-up"
              style={{
                boxShadow: "0 20px 25px -5px rgb(107 33 168 / 0.1), 0 8px 10px -6px rgb(107 33 168 / 0.1)"
              }}
            >
              {/* Highlight bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-600 animate-pulse" />
              
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 shrink-0 mt-0.5">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>

              <div className="space-y-1 pr-6 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-black text-xs text-purple-900 uppercase tracking-wider block">
                    Atualização em Tempo Real!
                  </span>
                  <span className="text-[9px] font-sans text-slate-400">
                    agora mesmo
                  </span>
                </div>
                <p className="font-sans text-[11px] leading-relaxed text-slate-600">
                  Olá <strong>{alert.patientName}</strong>, o status da sua consulta em <strong>{alert.date} ({alert.timeSlot})</strong> mudou:
                </p>
                <div className="flex items-center gap-2 pt-1 font-sans text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 line-through">
                    {alert.oldStatus}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-extrabold shadow-sm">
                    {alert.newStatus}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Fechar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Title block */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-extrabold tracking-widest text-purple-600 bg-purple-50 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Acompanhamento em Tempo Real
        </div>
        <h2 className="font-sans font-black text-2xl sm:text-3.5xl text-slate-950 tracking-tight leading-none">
          Acompanhar Agendamento
        </h2>
        <p className="font-sans text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Consulte o status, data, sala de atendimento ou orientações da sua consulta a qualquer momento com sincronização instantânea.
        </p>
      </div>

      {/* Browser Notification Consent Bar */}
      {notificationPermission !== "granted" && (
        <div className="bg-purple-50/70 border border-purple-100/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Bell className="w-4 h-4 shrink-0" />
            </div>
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="font-sans font-extrabold text-xs text-purple-950">
                Deseja receber avisos de status?
              </h4>
              <p className="font-sans text-[10px] text-purple-700/80 leading-normal">
                Ative as notificações do navegador para receber alertas sonoros e visuais caso seu status mude.
              </p>
            </div>
          </div>
          <button
            onClick={requestBellPermission}
            className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-extrabold text-[10px] tracking-wider uppercase px-4 py-2 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Ativar Alertas
          </button>
        </div>
      )}

      {/* Search Box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
              Digite seu WhatsApp cadastrado *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                required
                placeholder="Ex: (11) 98765-4321"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-sm font-sans outline-none text-slate-800 transition-all shadow-inner"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-normal">
              Utilize o mesmo número informado no formulário de agendamento.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-sans font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !phoneQuery.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-sans font-extrabold text-xs tracking-wider uppercase py-4 rounded-2xl transition shadow-lg shadow-purple-600/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                Buscando...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Search className="w-4 h-4 shrink-0" />
                Buscar Agendamentos
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Results Block */}
      {hasSearched && (
        <div className="space-y-4" id="tracking-results">
          <h3 className="font-sans font-bold text-slate-800 text-sm tracking-wide uppercase px-1">
            Resultados Encontrados ({results.length})
          </h3>

          {results.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-sans font-bold text-slate-900 text-sm">Nenhum agendamento localizado</p>
                <p className="font-sans text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Não encontramos consultas para o número <span className="font-mono text-purple-600 font-bold">{phoneQuery}</span>. Verifique se o DDD foi inserido e se é o mesmo número usado no agendamento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((b) => (
                <div 
                  key={b.id} 
                  className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm transition-all hover:border-purple-100 space-y-4"
                >
                  {/* Status header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-50">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans tracking-wider uppercase font-bold">Paciente</div>
                      <div className="font-sans font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        {b.clientName}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(b.status)}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Date */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-sans tracking-wider uppercase font-bold block">Data</span>
                      <div className="font-sans font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                        {b.date}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-sans tracking-wider uppercase font-bold block">Horário</span>
                      <div className="font-sans font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                        {b.timeSlot}
                      </div>
                    </div>

                    {/* Modality / Type */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-sans tracking-wider uppercase font-bold block">Modalidade</span>
                      <div className="font-sans font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                        {b.consultationType === "presencial" ? (
                          <>
                            <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                            Presencial (Clínica)
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 text-purple-500 shrink-0" />
                            Online (Vídeo)
                          </>
                        )}
                      </div>
                    </div>

                    {/* Approach */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-sans tracking-wider uppercase font-bold block">Abordagem</span>
                      <div className="font-sans font-bold text-xs sm:text-sm text-slate-700 truncate">
                        {b.approach}
                      </div>
                    </div>
                  </div>

                  {/* Booking Status Timeline */}
                  {renderTimeline(b)}

                  {/* Online links/instructions */}
                  {b.consultationType !== "presencial" && b.status === "scheduled" && (
                    <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-2xl space-y-2 mt-2">
                      <h4 className="font-sans font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        Sala de Atendimento Virtual
                      </h4>
                      <p className="font-sans text-[11px] text-slate-500 leading-relaxed">
                        Sua sessão de terapia online será realizada via videochamada. Acesse o link ou use o código da sala no horário agendado.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        <span className="bg-white px-3 py-1.5 rounded-xl border border-purple-100 text-[10px] font-mono font-bold text-purple-800">
                          Código: {b.roomCode || `SALA-${b.id.substring(0, 5).toUpperCase()}`}
                        </span>
                        <button
                          onClick={() => {
                            const code = b.roomCode || `SALA-${b.id.substring(0, 5).toUpperCase()}`;
                            const path = `/online-room/${code}`;
                            // Since we have an OnlineConsultationSection, let's open or point to online tab
                            alert(`Para acessar a sala de consulta, selecione a aba 'Consulta Online' e digite o código de acesso: ${code}`);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          Acessar Sala
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {b.notes && (
                    <div className="p-3.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-sans leading-relaxed">
                      <strong>Observações:</strong> {b.notes}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
