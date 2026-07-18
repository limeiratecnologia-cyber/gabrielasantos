import React, { useState } from "react";
import { Booking } from "../types";
import { getBookingsFromDb } from "../lib/firebaseService";
import { Phone, Calendar, Clock, Video, MapPin, Search, AlertCircle, Sparkles, ArrowRight, User, Check, X } from "lucide-react";

export default function TrackingSection() {
  const [phoneQuery, setPhoneQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cleanNumber = (num: string) => {
    return num.replace(/\D/g, "");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryDigits = cleanNumber(phoneQuery);
    
    if (queryDigits.length < 8) {
      setError("Por favor, digite um número de WhatsApp válido com DDD.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Fetch latest bookings
      const allBookings = await getBookingsFromDb();
      
      // Filter in-memory by checking matching digits
      const matched = allBookings.filter((b) => {
        const dbDigits = cleanNumber(b.clientPhone || "");
        // Match if query is contained or equal to make it friendly
        return dbDigits.includes(queryDigits) || queryDigits.includes(dbDigits);
      });

      // Sort by date/time (newest or upcoming first)
      matched.sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-") + "T" + (a.timeSlot || "00:00"));
        const dateB = new Date(b.date.split("/").reverse().join("-") + "T" + (b.timeSlot || "00:00"));
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

      setResults(matched);
      setHasSearched(true);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
      setError("Ocorreu um erro ao carregar os dados. Tente novamente.");
    } finally {
      setIsLoading(false);
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
    <div className="max-w-2xl mx-auto py-4 sm:py-8 space-y-8 animate-fade-in" id="tracking-section-container">
      
      {/* Title block */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-extrabold tracking-widest text-purple-600 bg-purple-50 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Acompanhamento Online
        </div>
        <h2 className="font-sans font-black text-2xl sm:text-3.5xl text-slate-950 tracking-tight leading-none">
          Acompanhar Agendamento
        </h2>
        <p className="font-sans text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Consulte o status, data, sala de atendimento ou orientações da sua consulta a qualquer momento.
        </p>
      </div>

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
