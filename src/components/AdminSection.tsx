import React, { useState, useEffect } from "react";
import AdminOnlineTab from "./AdminOnlineTab";
import { Booking, Approach, ActiveTab, Patient, ClinicalEvolution, HelpPsiEmergency, PlannedSession } from "../types";
import { CLINIC_INFO, APPROACHES, IMAGES } from "../data";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  getBookingsFromDb, 
  saveBookingToDb, 
  deleteBookingFromDb, 
  getClinicInfoFromDb, 
  saveClinicInfoToDb, 
  getApproachesFromDb, 
  saveApproachToDb, 
  deleteApproachFromDb,
  getPatientsFromDb,
  savePatientToDb,
  deletePatientFromDb,
  getEvolutionsFromDb,
  saveEvolutionToDb,
  deleteEvolutionFromDb,
  getHelpPsiEmergenciesFromDb,
  saveHelpPsiEmergencyToDb,
  deleteHelpPsiEmergencyFromDb,
  getPlannedSessionsFromDb,
  savePlannedSessionToDb,
  deletePlannedSessionFromDb
} from "../lib/firebaseService";
import { 
  Lock, Unlock, Calendar, FileText, Check, X, Trash2, 
  Plus, Edit3, Save, Phone, Mail, MapPin, Clock, Award, 
  HelpCircle, CheckCircle, RefreshCw, LogOut, ArrowRight, ClipboardList, Upload,
  ChevronLeft, ChevronRight, Globe, Users, Search, PlusCircle, Clipboard, Video, ShieldAlert, Sliders
} from "lucide-react";

interface AdminSectionProps {
  setActiveTab?: (tab: ActiveTab) => void;
  bookings?: Booking[];
  clinicInfo?: any;
}

export default function AdminSection({ setActiveTab, bookings, clinicInfo }: AdminSectionProps) {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [adminTab, setAdminTab] = useState<"agenda" | "patients" | "online" | "website" | "approaches" | "helppsi">("agenda");
  const [preselectedPatient, setPreselectedPatient] = useState<Patient | null>(null);
  const [preselectedRoom, setPreselectedRoom] = useState<{ roomCode: string; clientName: string } | null>(null);

  // Authorized state persistence during session
  useEffect(() => {
    const auth = sessionStorage.getItem("serenamente_admin_auth");
    if (auth === "true") {
      setIsAuthorized(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "7984") {
      setIsAuthorized(true);
      setErrorMsg("");
      sessionStorage.setItem("serenamente_admin_auth", "true");
    } else {
      setErrorMsg("Senha incorreta. Tente novamente.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword("");
    sessionStorage.removeItem("serenamente_admin_auth");
    if (setActiveTab) {
      setActiveTab("home");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12" id="admin-login-card">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 shadow-inner">
            <Lock className="w-6 h-6 text-purple-600 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-sans font-extrabold text-slate-950 text-2xl tracking-tight">
              Área Administrativa
            </h3>
            <p className="font-sans text-slate-500 text-sm">
              Digite a senha de acesso para gerenciar o site, ver a agenda e editar informações.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-widest">
                Senha de Acesso
              </label>
              <input
                id="admin-password-input"
                type="password"
                required
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-center bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl px-4 py-3.5 text-lg font-mono outline-none text-slate-800 transition-all tracking-widest"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium font-sans">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-sm py-4 rounded-2xl shadow-lg shadow-purple-600/10 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Entrar no Painel
            </button>

            {setActiveTab && (
              <button
                id="admin-login-cancel"
                type="button"
                onClick={() => setActiveTab("home")}
                className="w-full bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-500 font-sans font-bold text-xs py-3.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-100 hover:border-rose-100"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                Sair / Voltar ao Site
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 animate-fade-in" id="admin-panel">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-md">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider font-sans">
            <Unlock className="w-3 h-3" />
            Sessão Administrativa Ativa
          </span>
          <h2 className="font-sans font-extrabold text-slate-900 text-2xl tracking-tight">
            Painel de Controle do Consultório
          </h2>
          <p className="font-sans text-slate-500 text-xs sm:text-sm">
            Gerencie suas consultas, atualize textos, abordagens e dados de contato do site em tempo real.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-sans font-bold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-2 cursor-pointer border border-slate-100 hover:border-rose-100"
          id="btn-admin-logout"
        >
          <LogOut className="w-4 h-4" />
          Sair do Painel
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto pb-px">
        <button
          onClick={() => setAdminTab("agenda")}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-sm font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
            adminTab === "agenda"
              ? "border-purple-600 text-purple-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-admin-agenda"
        >
          <Calendar className="w-4.5 h-4.5" />
          Agenda e Marcações
        </button>
        <button
          onClick={() => setAdminTab("patients")}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-sm font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
            adminTab === "patients"
              ? "border-purple-600 text-purple-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-admin-patients"
        >
          <Users className="w-4.5 h-4.5" />
          Pacientes e Prontuários
        </button>
        <button
          onClick={() => setAdminTab("online")}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-sm font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
            adminTab === "online"
              ? "border-purple-600 text-purple-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-admin-online"
        >
          <Video className="w-4.5 h-4.5" />
          Atendimento Ao Vivo
        </button>
        <button
          onClick={() => setAdminTab("website")}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-sm font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
            adminTab === "website"
              ? "border-purple-600 text-purple-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-admin-website"
        >
          <Edit3 className="w-4.5 h-4.5" />
          Conteúdo do Site
        </button>
        <button
          onClick={() => setAdminTab("approaches")}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-sm font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
            adminTab === "approaches"
              ? "border-purple-600 text-purple-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-admin-approaches"
        >
          <HelpCircle className="w-4.5 h-4.5" />
          Abordagens Clínicas
        </button>
        <button
          onClick={() => setAdminTab("helppsi")}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 text-sm font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
            adminTab === "helppsi"
              ? "border-rose-600 text-rose-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-rose-600"
          }`}
          id="tab-admin-helppsi"
        >
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
          Emergências HelpPsi
        </button>
      </div>

      {/* Tab Contents */}
      <div className="animate-fade-in">
        {adminTab === "agenda" && (
          <AdminAgendaTab 
            preselectedPatient={preselectedPatient}
            onClearPreselectedPatient={() => setPreselectedPatient(null)}
            onSelectLiveRoom={(roomCode, clientName) => {
              setPreselectedRoom({ roomCode, clientName });
              setAdminTab("online");
            }}
            bookings={bookings}
            clinicInfo={clinicInfo}
          />
        )}
        {adminTab === "patients" && (
          <AdminPatientsTab 
            onScheduleConsultation={(patient) => {
              setPreselectedPatient(patient);
              setAdminTab("agenda");
            }}
          />
        )}
        {adminTab === "online" && (
          <AdminOnlineTab 
            preselectedRoom={preselectedRoom}
            onClearPreselectedRoom={() => setPreselectedRoom(null)}
          />
        )}
        {adminTab === "website" && <AdminWebsiteTab clinicInfo={clinicInfo} />}
        {adminTab === "approaches" && <AdminApproachesTab />}
        {adminTab === "helppsi" && <AdminHelpPsiTab />}
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: ADMIN AGENDA TAB
   ========================================================================== */
interface AdminAgendaTabProps {
  preselectedPatient?: Patient | null;
  onClearPreselectedPatient?: () => void;
  onSelectLiveRoom?: (roomCode: string, clientName: string) => void;
  bookings?: Booking[];
  clinicInfo?: any;
}

function AdminAgendaTab({ 
  preselectedPatient, 
  onClearPreselectedPatient, 
  onSelectLiveRoom,
  bookings: propBookings,
  clinicInfo: propClinicInfo
}: AdminAgendaTabProps) {
  const [bookings, setBookings] = useState<Booking[]>(propBookings || []);
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");
  
  // Manual booking form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [approach, setApproach] = useState("Terapia Cognitivo-Comportamental");
  const [consultationType, setConsultationType] = useState<"online" | "presencial">("online");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Registered patients selection state
  const [registeredPatients, setRegisteredPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [clinicInfo, setClinicInfo] = useState<any>(propClinicInfo || null);

  // General Calendar States
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [selectedViewDate, setSelectedViewDate] = useState<string>("");

  // Manual Form Calendar States
  const [formMonth, setFormMonth] = useState(new Date().getMonth());
  const [formYear, setFormYear] = useState(new Date().getFullYear());

  const timeSlots = [
    "08:00 - 09:00", "09:30 - 10:30", "11:00 - 12:00",
    "13:30 - 14:30", "15:00 - 16:00", "16:30 - 17:30", "18:00 - 19:00"
  ];

  useEffect(() => {
    let unsubscribeBookings = () => {};
    
    if (propBookings) {
      setBookings(propBookings);
    } else {
      // Real-time listener for bookings
      const bookingsQuery = query(collection(db, "bookings"), orderBy("date", "asc"));
      unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
        console.log(`[Firestore] Bookings atualizados em tempo real. Documentos: ${snapshot.size}. Origem: ${snapshot.metadata.fromCache ? 'CACHE LOCAL' : 'SERVIDOR'} (Sincronizado across devices)`);
        const list: Booking[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Booking);
        });
        setBookings(list);
        localStorage.setItem("serenamente_bookings", JSON.stringify(list));
      }, (err) => {
        console.error("[Firestore ERROR] Falha na subscrição em tempo real de bookings:", err);
        getBookingsFromDb().then(setBookings).catch(console.error);
      });
    }

    // Real-time listener for registered patients
    const patientsQuery = query(collection(db, "patients"), orderBy("name", "asc"));
    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      console.log(`[Firestore] Pacientes registrados atualizados em tempo real. Documentos: ${snapshot.size}. Origem: ${snapshot.metadata.fromCache ? 'CACHE LOCAL' : 'SERVIDOR'} (Sincronizado across devices)`);
      const list: Patient[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Patient);
      });
      setRegisteredPatients(list);
      localStorage.setItem("serenamente_patients", JSON.stringify(list));
    }, (err) => {
      console.error("[Firestore ERROR] Falha na subscrição em tempo real de pacientes:", err);
      getPatientsFromDb().then(setRegisteredPatients).catch(console.error);
    });

    if (propClinicInfo) {
      setClinicInfo(propClinicInfo);
    } else {
      getClinicInfoFromDb().then((info) => {
        setClinicInfo(info);
      }).catch((err) => {
        console.error("Erro ao carregar informações da clínica:", err);
        const saved = localStorage.getItem("serenamente_clinic_info");
        if (saved) {
          try {
            setClinicInfo(JSON.parse(saved));
          } catch (e) {
            setClinicInfo(CLINIC_INFO);
          }
        } else {
          setClinicInfo(CLINIC_INFO);
        }
      });
    }

    return () => {
      unsubscribeBookings();
      unsubscribePatients();
    };
  }, [propBookings, propClinicInfo]);

  useEffect(() => {
    if (preselectedPatient) {
      setShowAddForm(true);
      setName(preselectedPatient.name);
      setEmail(preselectedPatient.email && preselectedPatient.email !== "Não informado" ? preselectedPatient.email : "");
      setPhone(preselectedPatient.phone);
      setSelectedPatientId(preselectedPatient.id);
      
      if (onClearPreselectedPatient) {
        onClearPreselectedPatient();
      }
    }
  }, [preselectedPatient, onClearPreselectedPatient]);

  const handleStatusChange = (id: string, newStatus: "scheduled" | "completed" | "cancelled") => {
    const found = bookings.find(b => b.id === id);
    if (found) {
      const updatedBooking = { ...found, status: newStatus };
      saveBookingToDb(updatedBooking).catch((err) => {
        console.error("Erro ao alterar status no Firestore:", err);
      });
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (confirm("Tem certeza de que deseja apagar permanentemente este registro de agendamento?")) {
      deleteBookingFromDb(id).catch((err) => {
        console.error("Erro ao excluir agendamento do Firestore:", err);
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !date || !time) {
      alert("Por favor preencha nome, telefone, data e horário.");
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });

    const isDoubleBooked = bookings.some(
      (b) => b.status === "scheduled" && b.date === formattedDate && b.timeSlot === time
    );

    if (isDoubleBooked) {
      alert("⚠️ Erro: Este horário já está reservado por outro paciente neste dia! Escolha outra opção.");
      return;
    }

    const generatedRoomCode = consultationType === "online" ? "SRM-" + Math.floor(1000 + Math.random() * 9000) : undefined;

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      clientName: name,
      clientEmail: email || "Não informado",
      clientPhone: phone,
      approach,
      date: formattedDate,
      timeSlot: time,
      notes,
      status: "scheduled",
      roomCode: generatedRoomCode,
      consultationType
    };

    saveBookingToDb(newBooking).catch((err) => {
      console.error("Erro ao salvar agendamento manual:", err);
    });

    // Auto-save/register the patient in the patient database if needed
    const patientId = selectedPatientId || `patient-${email ? email.replace(/[^a-zA-Z0-9]/g, "_") : Date.now()}`;
    const patientObj: Patient = {
      id: patientId,
      name,
      email: email || "Não informado",
      phone,
      createdAt: new Date().toLocaleDateString("pt-BR")
    };
    savePatientToDb(patientObj).then(() => {
      getPatientsFromDb().then(setRegisteredPatients).catch(console.error);
    }).catch(err => console.error("Erro ao registrar paciente:", err));

    setName("");
    setEmail("");
    setPhone("");
    setApproach("Terapia Cognitivo-Comportamental");
    setConsultationType("online");
    setDate("");
    setTime("");
    setNotes("");
    setSelectedPatientId("");
    setShowAddForm(false);
    
    setSuccessMsg("Novo agendamento inserido diretamente com sucesso!");
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (selectedViewDate) {
      const formattedSelected = new Date(selectedViewDate).toLocaleDateString("pt-BR", { timeZone: "UTC" });
      return b.date === formattedSelected;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top action and filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "scheduled", "completed", "cancelled"] as const).map((status) => {
            const labels = {
              all: "Todos",
              scheduled: "Aguardando / Confirmados",
              completed: "Realizados",
              cancelled: "Cancelados"
            };
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer border ${
                  filter === status
                    ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/10"
                    : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {labels[status]} ({status === "all" ? bookings.length : bookings.filter(b => b.status === status).length})
              </button>
            );
          })}
        </div>

        {/* Action button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs px-5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-md shadow-purple-600/10 cursor-pointer self-start sm:self-auto"
          id="btn-show-add-booking"
        >
          <Plus className="w-4 h-4" />
          Marcar Consulta Manual
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 text-green-800 border border-green-100 rounded-2xl p-4 text-xs font-sans flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Manual Booking Form */}
      {showAddForm && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
            <h4 className="font-sans font-extrabold text-slate-950 text-sm">Agendar diretamente no sistema</h4>
            <button 
              onClick={() => setShowAddForm(false)} 
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {registeredPatients.length > 0 && (
              <div className="md:col-span-3 space-y-1.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60 mb-2">
                <label className="block text-[11px] font-sans font-bold text-purple-800 uppercase tracking-wider">
                  Vincular Paciente Já Cadastrado (Opcional)
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setSelectedPatientId(pId);
                    if (pId) {
                      const p = registeredPatients.find((item) => item.id === pId);
                      if (p) {
                        setName(p.name);
                        setEmail(p.email && p.email !== "Não informado" ? p.email : "");
                        setPhone(p.phone);
                      }
                    } else {
                      setName("");
                      setEmail("");
                      setPhone("");
                    }
                  }}
                  className="w-full bg-white border border-purple-200/60 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none focus:border-purple-600 transition cursor-pointer text-slate-800 font-medium"
                >
                  <option value="">-- Preencher Manualmente / Novo Paciente --</option>
                  {registeredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      👤 {p.name} ({p.phone}) {p.email && p.email !== "Não informado" ? ` - ${p.email}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-purple-600 font-sans font-medium">
                  💡 Selecionar um paciente cadastrado preencherá os dados de contato automaticamente.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Nome do Paciente *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clara Maria"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">WhatsApp/Telefone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 99999-8888"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">E-mail (Opcional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: paciente@email.com"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Abordagem Clínicas</label>
              <select
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition cursor-pointer"
              >
                <option value="Terapia Cognitivo-Comportamental">Terapia Cognitivo-Comportamental (TCC)</option>
                <option value="Psicanálise Contemporânea">Psicanálise Contemporânea</option>
                <option value="Abordagem Humanista">Abordagem Humanista</option>
                <option value="Terapia Sistêmica">Terapia Sistêmica</option>
                <option value="Consulta Geral / Primeira Entrevista">Consulta Geral / Primeira Entrevista</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Formato de Atendimento *</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setConsultationType("online")}
                  className={`py-1.5 rounded-lg text-[11px] font-sans font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    consultationType === "online"
                      ? "bg-white text-purple-700 shadow-sm border border-slate-100"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-purple-500" />
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setConsultationType("presencial")}
                  className={`py-1.5 rounded-lg text-[11px] font-sans font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    consultationType === "presencial"
                      ? "bg-white text-emerald-700 shadow-sm border border-slate-100"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  Presencial
                </button>
              </div>
            </div>

            {/* Dynamic Price Indicator Block */}
            <div className="space-y-1">
              <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Preço da Sessão</label>
              <div className="bg-slate-50 border border-slate-100/80 rounded-xl px-3.5 py-2.5 text-xs font-sans text-slate-700 flex items-center justify-between h-[42px]">
                <span className="font-semibold text-slate-500">Valor Cobrado:</span>
                <span className="text-purple-700 font-black text-sm">
                  {clinicInfo?.showPrices ? (
                    consultationType === "online" 
                      ? (clinicInfo?.priceOnline || "R$ 150,00") 
                      : (clinicInfo?.pricePresencial || "R$ 180,00")
                  ) : (
                    <span className="text-slate-400 font-medium text-xs">Ocultado (Exibição inativa)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Calendário e Horários Interativos no Formulário */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-100/80 p-5 rounded-2xl">
              {/* Calendário */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Data do Atendimento *</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (formMonth === 0) {
                          setFormMonth(11);
                          setFormYear(formYear - 1);
                        } else {
                          setFormMonth(formMonth - 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-bold font-sans text-slate-800 min-w-[85px] text-center">
                      {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][formMonth]} {formYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (formMonth === 11) {
                          setFormMonth(0);
                          setFormYear(formYear + 1);
                        } else {
                          setFormMonth(formMonth + 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dias da semana */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold font-sans text-slate-400 border-b border-slate-100 pb-1.5">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((wd, i) => (
                    <div key={i}>{wd}</div>
                  ))}
                </div>

                {/* Grid de Dias */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: new Date(formYear, formMonth, 1).getDay() }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square" />
                  ))}

                  {Array.from({ length: new Date(formYear, formMonth + 1, 0).getDate() }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const yStr = formYear;
                    const mStr = String(formMonth + 1).padStart(2, "0");
                    const dStr = String(dayNum).padStart(2, "0");
                    const cellDateString = `${yStr}-${mStr}-${dStr}`;
                    const cellPtBR = `${dStr}/${mStr}/${yStr}`;

                    const isSelected = date === cellDateString;
                    const dayBookings = bookings.filter((b) => b.date === cellPtBR && b.status === "scheduled");

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => {
                          setDate(cellDateString);
                          setTime(""); // reset time
                        }}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-sans transition-all relative cursor-pointer border ${
                          isSelected
                            ? "bg-purple-600 border-purple-600 text-white font-bold shadow-sm"
                            : "hover:bg-purple-50 hover:text-purple-700 bg-white border-slate-100 text-slate-700"
                        }`}
                      >
                        <span>{dayNum}</span>
                        {dayBookings.length > 0 && (
                          <span className="absolute bottom-0.5 flex gap-0.5 justify-center">
                            {dayBookings.slice(0, 3).map((_, bIdx) => (
                              <span 
                                key={bIdx} 
                                className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-purple-500"}`} 
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horários */}
              <div className="space-y-3 flex flex-col justify-center">
                <div>
                  <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">Escolha o Horário *</label>
                  {date ? (
                    <p className="text-[10px] text-slate-400 font-sans">
                      Horários disponíveis para {new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                    </p>
                  ) : (
                    <p className="text-[10px] text-rose-500 font-medium font-sans animate-pulse">
                      ⚠️ Selecione um dia no calendário ao lado primeiro
                    </p>
                  )}
                </div>

                {date && (
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((ts, idx) => {
                      const formattedSelectedDate = new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
                      const isBooked = bookings.some(
                        (b) => b.status === "scheduled" && b.date === formattedSelectedDate && b.timeSlot === ts
                      );
                      const isSelected = time === ts;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setTime(ts)}
                          className={`px-3 py-2 rounded-xl text-xs font-sans font-medium transition-all flex items-center justify-between cursor-pointer border ${
                            isBooked
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : isSelected
                                ? "bg-purple-600 border-purple-600 text-white font-bold shadow-sm"
                                : "bg-white border-slate-100 hover:border-purple-300 hover:bg-purple-50/30 text-slate-700"
                          }`}
                        >
                          <span className="font-bold">{ts}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            isBooked 
                              ? "bg-slate-200 text-slate-500" 
                              : isSelected 
                                ? "bg-purple-500 text-white" 
                                : "bg-green-50 text-green-700 border border-green-100"
                          }`}>
                            {isBooked ? "Ocupado" : "Livre"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Anotações Internas de Prontuário</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Insira detalhes sobre as queixas principais, histórico clínico ou formato acordado"
                rows={2}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-sans font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer border border-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow"
              >
                Confirmar Agendamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendário Mensal Completo da Clínica */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-md space-y-4 max-w-2xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-sans font-extrabold text-slate-950 text-sm flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-purple-600" />
              Calendário Mensal Completo da Clínica
            </h4>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Visualize a distribuição de consultas. Clique em um dia para filtrar a lista abaixo ou limpar o filtro.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {selectedViewDate && (
              <button
                onClick={() => setSelectedViewDate("")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition cursor-pointer border border-slate-200 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Limpar Filtro ({new Date(selectedViewDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })})
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear(viewYear - 1);
                  } else {
                    setViewMonth(viewMonth - 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold font-sans text-slate-800 min-w-[85px] text-center">
                {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear(viewYear + 1);
                  } else {
                    setViewMonth(viewMonth + 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold font-sans text-slate-400 border-b border-slate-100 pb-2">
          {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((wd) => (
            <div key={wd} className="hidden sm:block">{wd}</div>
          ))}
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((wd) => (
            <div key={wd} className="sm:hidden">{wd}</div>
          ))}
        </div>

        {/* Grid do Calendário */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 rounded-xl" />
          ))}

          {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, idx) => {
            const dayNum = idx + 1;
            const yStr = viewYear;
            const mStr = String(viewMonth + 1).padStart(2, "0");
            const dStr = String(dayNum).padStart(2, "0");
            const cellDateString = `${yStr}-${mStr}-${dStr}`;
            const cellPtBR = `${dStr}/${mStr}/${yStr}`;

            const isSelected = selectedViewDate === cellDateString;

            // Get bookings for this day
            const dayBookings = bookings.filter((b) => b.date === cellPtBR);
            const scheduledCount = dayBookings.filter((b) => b.status === "scheduled").length;
            const completedCount = dayBookings.filter((b) => b.status === "completed").length;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedViewDate("");
                  } else {
                    setSelectedViewDate(cellDateString);
                  }
                }}
                className={`min-h-[44px] sm:min-h-[50px] aspect-square flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-2xl text-[10px] font-sans transition-all relative border cursor-pointer ${
                  isSelected
                    ? "bg-purple-600 border-purple-600 text-white font-bold shadow-md"
                    : "hover:bg-purple-50 hover:border-purple-200 bg-white border-slate-100 text-slate-700"
                }`}
              >
                <span className="self-start text-[10px] sm:text-[11px] font-semibold">{dayNum}</span>
                
                {dayBookings.length > 0 && (
                  <div className="w-full flex flex-col gap-0.5 items-center mt-1">
                    {scheduledCount > 0 && (
                      <span className={`w-full text-[7px] sm:text-[8px] leading-tight py-0.5 px-0.5 rounded font-bold truncate text-center ${
                        isSelected 
                          ? "bg-purple-500 text-white" 
                          : "bg-amber-50 text-amber-700 border border-amber-100/50"
                      }`}>
                        {scheduledCount} ag.
                      </span>
                    )}
                    {completedCount > 0 && (
                      <span className={`w-full text-[7px] sm:text-[8px] leading-tight py-0.5 px-0.5 rounded font-bold truncate text-center ${
                        isSelected 
                          ? "bg-purple-500/50 text-white" 
                          : "bg-green-50 text-green-700 border border-green-100/50"
                      }`}>
                        {completedCount} ok
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings List / Agenda representation */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center p-12 space-y-4">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="font-sans font-bold text-slate-700 text-sm">Nenhuma consulta cadastrada nesta categoria</p>
              <p className="font-sans text-slate-400 text-xs max-w-sm mx-auto">
                As consultas solicitadas pelos clientes ou agendadas manualmente por você aparecerão listadas de acordo com os filtros selecionados.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop View Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-4 pl-6">Data & Horário</th>
                    <th className="p-4">Paciente</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4">Abordagem de Escolha</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-4 pl-6 font-semibold text-slate-900">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                            {b.date}
                          </span>
                          <span className="text-slate-400 text-[11px] font-normal flex items-center gap-1.5 ml-5">
                            <Clock className="w-3 h-3" />
                            {b.timeSlot}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{b.clientName}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(b.consultationType || (b.roomCode ? "online" : "presencial")) === "presencial" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-sans font-bold text-[10px] border border-emerald-100">
                              📍 Presencial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-sans font-bold text-[10px] border border-purple-100">
                              💻 Online
                            </span>
                          )}
                          {b.roomCode && (b.consultationType || (b.roomCode ? "online" : "presencial")) !== "presencial" && (
                            <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-bold text-[10px] border border-purple-100">
                              <Video className="w-3 h-3 text-purple-500" />
                              SALA: {b.roomCode}
                            </div>
                          )}
                        </div>
                        {b.notes && (
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate" title={b.notes}>
                            Obs: {b.notes}
                          </p>
                        )}
                      </td>
                      <td className="p-4 space-y-0.5 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{b.clientPhone}</span>
                        </div>
                        {b.clientEmail && b.clientEmail !== "Não informado" && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{b.clientEmail}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100 font-semibold text-[11px]">
                          {b.approach}
                        </span>
                      </td>
                      <td className="p-4">
                        {b.status === "scheduled" && (
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100 font-bold text-[10px] uppercase">
                            Aguardando
                          </span>
                        )}
                        {b.status === "completed" && (
                          <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100 font-bold text-[10px] uppercase">
                            Realizada
                          </span>
                        )}
                        {b.status === "cancelled" && (
                          <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100 font-bold text-[10px] uppercase">
                            Cancelada
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right pr-6 space-x-1 whitespace-nowrap">
                        {b.status === "scheduled" && (
                          <>
                            {b.roomCode && (b.consultationType || "online") !== "presencial" && (
                              <button
                                onClick={() => {
                                  if (onSelectLiveRoom) {
                                    onSelectLiveRoom(b.roomCode!, b.clientName);
                                  }
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-sm flex items-center gap-1 inline-flex mr-1"
                                title="Iniciar Transmissão Ao Vivo para esta consulta"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Atender
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(b.id, "completed")}
                              className="bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer border border-green-100"
                              title="Marcar como realizada"
                            >
                              Concluir
                            </button>
                            <button
                              onClick={() => handleStatusChange(b.id, "cancelled")}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer border border-rose-100"
                              title="Cancelar consulta"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {b.status !== "scheduled" && (
                          <button
                            onClick={() => handleStatusChange(b.id, "scheduled")}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer border border-slate-100"
                            title="Mudar status para pendente"
                          >
                            Reabrir
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          className="bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-all cursor-pointer border border-slate-100 hover:border-rose-100"
                          title="Apagar permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card List */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <div key={b.id} className="p-5 space-y-4 hover:bg-slate-50/20 transition">
                  {/* Header: Date, Time & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-bold text-slate-950 text-sm">
                        <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                        {b.date}
                      </span>
                      <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5 ml-5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {b.timeSlot}
                      </span>
                    </div>
                    <div>
                      {b.status === "scheduled" && (
                        <span className="bg-amber-50 text-amber-850 px-3 py-1 rounded-full border border-amber-200 font-extrabold text-[10px] uppercase tracking-wider">
                          Aguardando
                        </span>
                      )}
                      {b.status === "completed" && (
                        <span className="bg-green-50 text-green-850 px-3 py-1 rounded-full border border-green-200 font-extrabold text-[10px] uppercase tracking-wider">
                          Realizada
                        </span>
                      )}
                      {b.status === "cancelled" && (
                        <span className="bg-rose-50 text-rose-850 px-3 py-1 rounded-full border border-rose-200 font-extrabold text-[10px] uppercase tracking-wider">
                          Cancelada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Patient Information */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-900 text-base">{b.clientName}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(b.consultationType || (b.roomCode ? "online" : "presencial")) === "presencial" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl font-sans font-bold text-[10px] border border-emerald-100">
                          📍 Presencial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-850 px-2.5 py-1 rounded-xl font-sans font-bold text-[10px] border border-purple-100">
                          💻 Online
                        </span>
                      )}
                      {b.roomCode && (b.consultationType || (b.roomCode ? "online" : "presencial")) !== "presencial" && (
                        <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-850 px-2.5 py-1 rounded-xl font-mono font-bold text-[10px] border border-purple-100">
                          <Video className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          SALA: {b.roomCode}
                        </div>
                      )}
                      <span className="bg-purple-50/50 text-purple-850 px-2.5 py-1 rounded-xl font-bold text-[10px] border border-purple-100/40">
                        {b.approach}
                      </span>
                    </div>
                    
                    {/* Contacts info with proper tap guidelines */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1.5 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{b.clientPhone}</span>
                      </div>
                      {b.clientEmail && b.clientEmail !== "Não informado" && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{b.clientEmail}</span>
                        </div>
                      )}
                    </div>

                    {b.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-2xl mt-2 border border-slate-100/50 leading-relaxed">
                        <strong>Obs:</strong> {b.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Row with beautiful touch targets */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100/50">
                    {b.status === "scheduled" && (
                      <>
                        {b.roomCode && (b.consultationType || "online") !== "presencial" && (
                          <button
                            onClick={() => {
                              if (onSelectLiveRoom) {
                                onSelectLiveRoom(b.roomCode!, b.clientName);
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <Video className="w-4 h-4 shrink-0" />
                            Atender
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(b.id, "completed")}
                          className="bg-green-50 hover:bg-green-100 text-green-850 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer border border-green-200"
                        >
                          Concluir
                        </button>
                        <button
                          onClick={() => handleStatusChange(b.id, "cancelled")}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-850 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer border border-rose-200"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {b.status !== "scheduled" && (
                      <button
                        onClick={() => handleStatusChange(b.id, "scheduled")}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer border border-slate-200"
                      >
                        Reabrir
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBooking(b.id)}
                      className="bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-2.5 rounded-2xl transition-all cursor-pointer border border-slate-200 hover:border-rose-200 flex items-center justify-center min-w-[40px] min-h-[40px]"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: ADMIN PATIENTS TAB (CLINICAL CHART & EVOLUTIONS)
   ========================================================================== */
interface AdminPatientsTabProps {
  onScheduleConsultation?: (patient: Patient) => void;
}

function AdminPatientsTab({ onScheduleConsultation }: AdminPatientsTabProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [evolutions, setEvolutions] = useState<ClinicalEvolution[]>([]);
  const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Patient Sub-tab navigation
  const [patientSubTab, setPatientSubTab] = useState<"evolutions" | "chronogram">("evolutions");

  // Patient manual creation & edit states
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

  // Evolution notes states
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [editingEvolution, setEditingEvolution] = useState<ClinicalEvolution | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formText, setFormText] = useState("");

  // Chronogram (Planned sessions) states
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<PlannedSession | null>(null);
  const [formSessionNumber, setFormSessionNumber] = useState(1);
  const [formSessionTitle, setFormSessionTitle] = useState("");
  const [formSessionGoal, setFormSessionGoal] = useState("");
  const [formSessionNotes, setFormSessionNotes] = useState("");

  const [savingState, setSavingState] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    // Real-time listener for patients
    const patientsQuery = query(collection(db, "patients"));
    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      console.log(`[Firestore] Patients (Clinical) atualizados. Total: ${snapshot.size}. Origem: ${snapshot.metadata.fromCache ? 'CACHE LOCAL' : 'SERVIDOR'} (Sincronizado across devices)`);
      const list: Patient[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Patient);
      });
      setPatients(list);
      localStorage.setItem("serenamente_patients", JSON.stringify(list));
      setIsLoading(false);
    }, (err) => {
      console.error("[Firestore ERROR] Falha na subscrição em tempo real de patients (Clinical):", err);
      getPatientsFromDb().then(setPatients).catch(console.error);
    });

    // Real-time listener for evolutions
    const evolutionsQuery = query(collection(db, "evolutions"));
    const unsubscribeEvolutions = onSnapshot(evolutionsQuery, (snapshot) => {
      console.log(`[Firestore] Evolutions atualizados. Total: ${snapshot.size}. Origem: ${snapshot.metadata.fromCache ? 'CACHE LOCAL' : 'SERVIDOR'} (Sincronizado across devices)`);
      const list: ClinicalEvolution[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ClinicalEvolution);
      });
      setEvolutions(list);
      localStorage.setItem("serenamente_evolutions", JSON.stringify(list));
    }, (err) => {
      console.error("[Firestore ERROR] Falha na subscrição em tempo real de evolutions:", err);
      getEvolutionsFromDb().then(setEvolutions).catch(console.error);
    });

    // Real-time listener for planned sessions
    const plannedSessionsQuery = query(collection(db, "planned_sessions"));
    const unsubscribePlannedSessions = onSnapshot(plannedSessionsQuery, (snapshot) => {
      console.log(`[Firestore] Planned Sessions atualizados. Total: ${snapshot.size}. Origem: ${snapshot.metadata.fromCache ? 'CACHE LOCAL' : 'SERVIDOR'} (Sincronizado across devices)`);
      const list: PlannedSession[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PlannedSession);
      });
      setPlannedSessions(list);
      localStorage.setItem("serenamente_planned_sessions", JSON.stringify(list));
    }, (err) => {
      console.error("[Firestore ERROR] Falha na subscrição em tempo real de planned_sessions:", err);
      getPlannedSessionsFromDb().then(setPlannedSessions).catch(console.error);
    });

    return () => {
      unsubscribePatients();
      unsubscribeEvolutions();
      unsubscribePlannedSessions();
    };
  }, []);

  const fetchClinicalData = async () => {
    setIsLoading(true);
    try {
      const pData = await getPatientsFromDb();
      const eData = await getEvolutionsFromDb();
      const sData = await getPlannedSessionsFromDb();
      setPatients(pData);
      setEvolutions(eData);
      setPlannedSessions(sData);
    } catch (err) {
      console.error("Erro ao carregar prontuários do Firestore:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual patient upsert
  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      alert("Por favor, preencha todos os campos cadastrais.");
      return;
    }

    setSavingState(true);
    const targetId = editingPatient ? editingPatient.id : formEmail.trim().toLowerCase();
    const newPatient: Patient = {
      id: targetId,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      phone: formPhone.trim(),
      createdAt: editingPatient ? editingPatient.createdAt : new Date().toLocaleDateString("pt-BR")
    };

    try {
      await savePatientToDb(newPatient);
      
      // Reset form
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setShowPatientForm(false);
      setEditingPatient(null);

      // If we are editing the currently selected patient, update its header info
      if (selectedPatient && selectedPatient.id === targetId) {
        setSelectedPatient(newPatient);
      }
    } catch (err) {
      console.error("Erro ao gravar cadastro do paciente:", err);
      alert("Ocorreu um erro ao salvar o prontuário. Tente novamente.");
    } finally {
      setSavingState(false);
    }
  };

  const handleEditPatientInit = (p: Patient) => {
    setEditingPatient(p);
    setFormName(p.name);
    setFormEmail(p.email);
    setFormPhone(p.phone);
    setShowPatientForm(true);
  };

  const handleDeletePatient = async (pId: string) => {
    if (confirm("⚠️ ATENÇÃO: Deseja realmente excluir este paciente de forma permanente? Esta ação apagará todos os seus prontuários e evoluções clínicas do banco de dados, sem possibilidade de recuperação!")) {
      try {
        await deletePatientFromDb(pId);
        
        // Clean related evolutions in cascade
        const related = evolutions.filter((e) => e.patientId === pId);
        for (const ev of related) {
          await deleteEvolutionFromDb(ev.id);
        }

        if (selectedPatient?.id === pId) {
          setSelectedPatient(null);
        }
      } catch (err) {
        console.error("Erro ao excluir paciente:", err);
      }
    }
  };

  // Handle clinical evolution notes upsert
  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!formText.trim()) {
      alert("Por favor, digite os apontamentos de evolução clínica.");
      return;
    }

    setSavingState(true);
    
    // Split dates correctly to prevent timezone conversion shifts
    const parts = formDate.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : new Date().toLocaleDateString("pt-BR");

    const newEvolution: ClinicalEvolution = {
      id: editingEvolution ? editingEvolution.id : `ev-${Date.now()}`,
      patientId: selectedPatient.id,
      date: formattedDate,
      text: formText.trim(),
      createdAt: editingEvolution ? editingEvolution.createdAt : new Date().toISOString()
    };

    try {
      await saveEvolutionToDb(newEvolution);
      await fetchClinicalData();

      // Reset form
      setFormText("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setShowEvolutionForm(false);
      setEditingEvolution(null);
    } catch (err) {
      console.error("Erro ao salvar evolução clínica:", err);
      alert("Falha ao salvar a evolução terapêutica.");
    } finally {
      setSavingState(false);
    }
  };

  const handleEditEvolutionInit = (ev: ClinicalEvolution) => {
    setEditingEvolution(ev);
    setFormText(ev.text);
    
    // Convert date back to YYYY-MM-DD for form date-picker
    const dateParts = ev.date.split("/");
    if (dateParts.length === 3) {
      const formatted = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      setFormDate(formatted);
    }
    setShowEvolutionForm(true);
  };

  const handleDeleteEvolution = async (evId: string) => {
    if (confirm("Deseja realmente remover permanentemente este registro de evolução clínica?")) {
      try {
        await deleteEvolutionFromDb(evId);
        await fetchClinicalData();
      } catch (err) {
        console.error("Erro ao remover registro:", err);
      }
    }
  };

  // ==========================================================================
  // Chronogram / Planned sessions CRUD Handlers
  // ==========================================================================
  const handleSavePlannedSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!formSessionTitle.trim() || !formSessionGoal.trim()) {
      alert("Por favor, preencha o título e as evoluções/metas previstas para a sessão.");
      return;
    }

    setSavingState(true);
    const newSession: PlannedSession = {
      id: editingSession ? editingSession.id : `session-${Date.now()}`,
      patientId: selectedPatient.id,
      sessionNumber: formSessionNumber,
      title: formSessionTitle.trim(),
      expectedGoal: formSessionGoal.trim(),
      status: editingSession ? editingSession.status : "pending",
      notes: formSessionNotes.trim() || undefined
    };

    try {
      await savePlannedSessionToDb(newSession);
      await fetchClinicalData();

      // Reset form state
      setFormSessionTitle("");
      setFormSessionGoal("");
      setFormSessionNotes("");
      setFormSessionNumber(1);
      setShowSessionForm(false);
      setEditingSession(null);
    } catch (err) {
      console.error("Erro ao salvar sessão planejada:", err);
      alert("Ocorreu um erro ao salvar o planejamento de sessão.");
    } finally {
      setSavingState(false);
    }
  };

  const handleEditSessionInit = (session: PlannedSession) => {
    setEditingSession(session);
    setFormSessionNumber(session.sessionNumber);
    setFormSessionTitle(session.title);
    setFormSessionGoal(session.expectedGoal);
    setFormSessionNotes(session.notes || "");
    setShowSessionForm(true);
  };

  const handleToggleSessionStatus = async (session: PlannedSession) => {
    const updated: PlannedSession = {
      ...session,
      status: session.status === "completed" ? "pending" : "completed"
    };
    try {
      await savePlannedSessionToDb(updated);
      await fetchClinicalData();
    } catch (err) {
      console.error("Erro ao alterar status da sessão planejada:", err);
    }
  };

  const handleDeletePlannedSession = async (sessionId: string) => {
    if (confirm("Deseja realmente remover esta sessão planejada do cronograma de tratamento?")) {
      try {
        await deletePlannedSessionFromDb(sessionId);
        await fetchClinicalData();
      } catch (err) {
        console.error("Erro ao excluir sessão planejada:", err);
      }
    }
  };

  // Filters
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  const selectedPatientEvs = evolutions
    .filter((e) => e.patientId === selectedPatient?.id)
    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());

  const selectedPatientSessions = plannedSessions
    .filter((s) => s.patientId === selectedPatient?.id)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        <span className="font-medium text-xs">Sincronizando prontuários médicos...</span>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      
      {/* Upper overview stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-purple-50 text-purple-600 rounded-xl p-3">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total de Pacientes</span>
            <span className="text-2xl font-black text-slate-800">{patients.length}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-indigo-50 text-indigo-600 rounded-xl p-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Notas Clínicas</span>
            <span className="text-2xl font-black text-slate-800">{evolutions.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ativos em Terapia</span>
            <span className="text-2xl font-black text-slate-800">{patients.filter(p => p.createdAt).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Patient List (6 cols if patient selected, 12 if none) */}
        <div className={`${selectedPatient ? "lg:col-span-5" : "lg:col-span-12"} space-y-4`}>
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Base de Pacientes</h3>
                <p className="text-xs text-slate-500">Prontuários e fichas de evolução de pacientes ativos.</p>
              </div>

              {!showPatientForm && (
                <button
                  onClick={() => {
                    setEditingPatient(null);
                    setFormName("");
                    setFormEmail("");
                    setFormPhone("");
                    setShowPatientForm(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/10"
                >
                  <PlusCircle className="w-4 h-4" />
                  Novo Paciente
                </button>
              )}
            </div>

            {/* Manual patient upsert form */}
            {showPatientForm && (
              <form onSubmit={handleSavePatient} className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-purple-900 uppercase tracking-wider">
                    {editingPatient ? "Editar Cadastro de Paciente" : "Adicionar Paciente Manualmente"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPatientForm(false);
                      setEditingPatient(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label>
                    <input
                      type="text"
                      placeholder="Ex: João da Silva"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 transition"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail</label>
                    <input
                      type="email"
                      placeholder="joao@gmail.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 transition"
                      required
                      disabled={!!editingPatient} // Primary key remains email if creating from scratch
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp / Celular</label>
                    <input
                      type="text"
                      placeholder="(11) 98888-7777"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPatientForm(false);
                      setEditingPatient(null);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-2 rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingState}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
                  >
                    {savingState ? "Gravando..." : "Salvar Prontuário"}
                  </button>
                </div>
              </form>
            )}

            {/* Filter / Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar paciente por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl pl-10 pr-4 py-3 text-xs outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Table of patients */}
            <div className="overflow-x-auto">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Nenhum paciente cadastrado correspondente encontrado.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Identificação / Contato</th>
                      {!selectedPatient && <th className="pb-3 font-semibold hidden sm:table-cell">Cadastro</th>}
                      <th className="pb-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p) => {
                      const isCurrentlySelected = selectedPatient?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-slate-50 hover:bg-slate-50/80 transition-all ${
                            isCurrentlySelected ? "bg-purple-50/50" : ""
                          }`}
                        >
                          <td className="py-3.5 pr-2">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 mt-0.5 font-sans">
                              <span>{p.email}</span>
                              <span>{p.phone}</span>
                            </div>
                          </td>
                          {!selectedPatient && (
                            <td className="py-3.5 text-slate-500 hidden sm:table-cell">
                              <span>{p.createdAt || "Paciente"}</span>
                            </td>
                          )}
                          <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedPatient(p)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                isCurrentlySelected
                                  ? "bg-purple-600 text-white"
                                  : "bg-purple-50 hover:bg-purple-100 text-purple-700"
                              }`}
                            >
                              Ver Prontuário
                            </button>
                            <button
                              type="button"
                              onClick={() => onScheduleConsultation?.(p)}
                              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/60 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Marcar / Remarcar Consulta para este Paciente"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Agendar
                            </button>
                            <button
                              onClick={() => handleEditPatientInit(p)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-slate-500 p-1.5 rounded-lg transition cursor-pointer inline-flex items-center"
                              title="Editar Informações Cadastrais"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePatient(p.id)}
                              className="bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer inline-flex items-center"
                              title="Excluir Registro Clínico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Patient Clinical History / Evolutions Timeline (7 cols) */}
        {selectedPatient ? (
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 animate-slide-in">
            
            {/* Header patient profile box */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full block w-fit">
                  Prontuário Médico Digital
                </span>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">
                  {selectedPatient.name}
                </h3>
                <div className="text-xs text-slate-500 space-x-3 flex items-center font-sans">
                  <span>📧 {selectedPatient.email}</span>
                  <span>📱 {selectedPatient.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onScheduleConsultation?.(selectedPatient)}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/60 text-indigo-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Marcar ou Remarcar Consulta para este Paciente"
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Agendar / Remarcar
                </button>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-100 transition cursor-pointer"
                  title="Fechar Prontuário"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Double Sub-Tab Panel Selection */}
            <div className="flex border-b border-slate-100 pb-1 gap-4" id="patient-record-subtabs">
              <button
                type="button"
                onClick={() => setPatientSubTab("evolutions")}
                className={`pb-2.5 font-sans font-bold text-xs transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  patientSubTab === "evolutions"
                    ? "text-purple-700 font-black border-b-2 border-purple-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Histórico de Evoluções ({selectedPatientEvs.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientSubTab("chronogram");
                  setFormSessionNumber(selectedPatientSessions.length + 1);
                }}
                className={`pb-2.5 font-sans font-bold text-xs transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  patientSubTab === "chronogram"
                    ? "text-purple-700 font-black border-b-2 border-purple-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Cronograma de Sessões ({selectedPatientSessions.length})
              </button>
            </div>

            {/* Subtab Content: Evolutions */}
            {patientSubTab === "evolutions" && (
              <div className="space-y-6 animate-fade-in" id="subtab-evolutions">
                {/* Action buttons header for timeline notes */}
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Clipboard className="w-4 h-4 text-purple-600" />
                    Histórico de Evolução Terapêutica
                  </h4>

                  {!showEvolutionForm && (
                    <button
                      onClick={() => {
                        setEditingEvolution(null);
                        setFormText("");
                        setFormDate(new Date().toISOString().split("T")[0]);
                        setShowEvolutionForm(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova Evolução
                    </button>
                  )}
                </div>

                {/* Note addition/editing form */}
                {showEvolutionForm && (
                  <form onSubmit={handleSaveEvolution} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-900 uppercase tracking-wider">
                        {editingEvolution ? "✏️ Editar Evolução Clínica" : "📝 Nova Evolução Clínica"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEvolutionForm(false);
                          setEditingEvolution(null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Data da Consulta</label>
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs outline-none focus:border-purple-600 transition"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Apontamentos Clínicos (Evolução / Observações)</label>
                        <textarea
                          placeholder="Descreva a evolução do paciente nesta sessão, técnicas aplicadas, bem-estar relatado, metas e compromissos acordados..."
                          rows={4}
                          value={formText}
                          onChange={(e) => setFormText(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 transition leading-relaxed placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEvolutionForm(false);
                          setEditingEvolution(null);
                        }}
                        className="bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-2 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingState}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        {savingState ? "Gravando..." : "Registrar Sessão"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Evolutions Timeline rendering */}
                <div className="space-y-4">
                  {selectedPatientEvs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-150">
                      Nenhum registro de evolução adicionado a este prontuário ainda. Comece clicando em "Nova Evolução".
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-150 pl-5 space-y-6">
                      {selectedPatientEvs.map((ev) => (
                        <div key={ev.id} className="relative group animate-fade-in">
                          {/* Timeline dot */}
                          <span className="absolute -left-[26px] top-1 bg-white border-2 border-purple-500 rounded-full w-3 h-3 block group-hover:bg-purple-600 transition" />
                          
                          <div className="bg-slate-50 hover:bg-slate-100/50 rounded-2xl p-4 border border-slate-150/60 shadow-sm transition space-y-2 relative">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-purple-700 font-extrabold text-[11px] bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full uppercase">
                                Sessão de {ev.date}
                              </span>
                              
                              <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  onClick={() => handleEditEvolutionInit(ev)}
                                  className="text-slate-400 hover:text-purple-600 p-1 rounded hover:bg-white transition cursor-pointer"
                                  title="Editar anotação clínica"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvolution(ev.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white transition cursor-pointer"
                                  title="Excluir anotação clínica"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-slate-600 leading-relaxed font-sans text-xs whitespace-pre-line">
                              {ev.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subtab Content: Treatment Chronogram */}
            {patientSubTab === "chronogram" && (
              <div className="space-y-6 animate-fade-in" id="subtab-chronogram">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                    Cronograma de Sessões e Evoluções Planejadas
                  </h4>

                  {!showSessionForm && (
                    <button
                      onClick={() => {
                        setEditingSession(null);
                        setFormSessionTitle("");
                        setFormSessionGoal("");
                        setFormSessionNotes("");
                        setFormSessionNumber(selectedPatientSessions.length + 1);
                        setShowSessionForm(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo Encontro
                    </button>
                  )}
                </div>

                {/* Session addition/editing form */}
                {showSessionForm && (
                  <form onSubmit={handleSavePlannedSession} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-900 uppercase tracking-wider">
                        {editingSession ? "✏️ Editar Planejamento de Sessão" : "📝 Planejar Nova Sessão"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSessionForm(false);
                          setEditingSession(null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Número da Sessão</label>
                        <input
                          type="number"
                          min={1}
                          value={formSessionNumber}
                          onChange={(e) => setFormSessionNumber(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs outline-none focus:border-purple-600 transition"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Título do Encontro / Foco Principal</label>
                        <input
                          type="text"
                          placeholder="Ex: Sessão 1 - Psicoeducação e Aliança Terapêutica"
                          value={formSessionTitle}
                          onChange={(e) => setFormSessionTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 transition"
                          required
                        />
                      </div>
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Evoluções e Metas Planejadas a Serem Feitas</label>
                        <textarea
                          placeholder="Descreva as técnicas a aplicar e o progresso clínico planejado para esta sessão (ex: reestruturação de pensamentos automáticos, exposição gradual)..."
                          rows={3}
                          value={formSessionGoal}
                          onChange={(e) => setFormSessionGoal(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 transition leading-relaxed placeholder:text-slate-400"
                          required
                        />
                      </div>
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Observações Complementares (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Observações sobre tarefas de casa ou recursos a fornecer..."
                          value={formSessionNotes}
                          onChange={(e) => setFormSessionNotes(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 transition"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSessionForm(false);
                          setEditingSession(null);
                        }}
                        className="bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-2 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingState}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        {savingState ? "Gravando..." : "Salvar no Cronograma"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Sessions Chronogram list */}
                <div className="space-y-4">
                  {selectedPatientSessions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-150">
                      Nenhuma sessão adicionada ao cronograma terapêutico ainda. Defina os encontros clicando em "Novo Encontro".
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPatientSessions.map((session) => {
                        const isCompleted = session.status === "completed";
                        return (
                          <div 
                            key={session.id} 
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                              isCompleted 
                                ? "bg-emerald-50/20 border-emerald-100/50" 
                                : "bg-slate-50 border-slate-150"
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              {/* Toggle Checkbox Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleSessionStatus(session)}
                                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                                  isCompleted 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                                    : "border-slate-300 hover:border-purple-600 bg-white"
                                }`}
                                title={isCompleted ? "Marcar como pendente" : "Marcar como realizada"}
                              >
                                {isCompleted && <Check className="w-3.5 h-3.5" />}
                              </button>
                              
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full uppercase">
                                    Encontro #{session.sessionNumber}
                                  </span>
                                  <h5 className={`font-bold text-xs sm:text-sm font-sans ${isCompleted ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                    {session.title}
                                  </h5>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                    isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {isCompleted ? "Concluída" : "Planejada"}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Evoluções & Metas Clínicas:</span>
                                  <p className={`text-xs leading-relaxed font-sans ${isCompleted ? "text-slate-400" : "text-slate-600"}`}>
                                    {session.expectedGoal}
                                  </p>
                                </div>
                                
                                {session.notes && (
                                  <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100 text-[11px] font-sans text-slate-500 italic mt-1">
                                    📌 {session.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex sm:flex-col gap-1.5 self-end sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditSessionInit(session)}
                                className="text-slate-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition cursor-pointer flex items-center justify-center"
                                title="Editar planejamento de sessão"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePlannedSession(session.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition cursor-pointer flex items-center justify-center"
                                title="Excluir do cronograma"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="hidden lg:block lg:col-span-12">
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-150 p-16 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">Nenhum Paciente Selecionado</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Selecione um paciente na lista à esquerda clicando em <strong>"Ver Prontuário"</strong> para gerenciar suas anotações clínicas e evoluções de consulta.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: ADMIN WEBSITE TAB
   ========================================================================== */
interface AdminWebsiteTabProps {
  clinicInfo?: any;
}

function AdminWebsiteTab({ clinicInfo: propClinicInfo }: AdminWebsiteTabProps) {
  const [info, setInfo] = useState<any>(propClinicInfo || null);
  const [credentialsText, setCredentialsText] = useState("");
  const [newCred, setNewCred] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Header banner states
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Logo states
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoFileChange = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Por favor, selecione apenas arquivos de imagem (JPEG, PNG, WEBP, ICO).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("A logo deve ter no máximo 2MB.");
      return;
    }

    setLogoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const rawResult = event.target.result as string;
        // Transform the uploaded image to PNG format dynamically for premium crisp quality
        import("../utils/imageUtils").then(({ convertToPng }) => {
          convertToPng(rawResult).then((png) => {
            setInfo((prev: any) => ({ ...prev, clinicLogo: png }));
          });
        }).catch((err) => {
          console.error("Error converting logo to PNG:", err);
          setInfo((prev: any) => ({ ...prev, clinicLogo: rawResult }));
        });
      }
    };
    reader.onerror = () => {
      setLogoError("Ocorreu um erro ao carregar o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (propClinicInfo) {
      setInfo(propClinicInfo);
      return;
    }
    getClinicInfoFromDb().then((dbInfo) => {
      setInfo(dbInfo);
    }).catch((err) => {
      console.error("Erro ao carregar informações da clínica:", err);
      const saved = localStorage.getItem("serenamente_clinic_info");
      if (saved) {
        try {
          setInfo(JSON.parse(saved));
        } catch (e) {
          setInfo(CLINIC_INFO);
        }
      } else {
        setInfo(CLINIC_INFO);
      }
    });
  }, [propClinicInfo]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveClinicInfoToDb(info).then(() => {
      setSuccessMsg("Alterações no site salvas com sucesso! Suas atualizações já estão visíveis na página clínica e armazenadas no banco de dados.");
    }).catch((err) => {
      console.error("Erro ao salvar informações da clínica no Firestore:", err);
      localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
      setSuccessMsg("Alterações salvas localmente devido a um erro de conexão com o banco.");
    });
    setTimeout(() => setSuccessMsg(""), 6000);
  };

  const updateField = (field: string, value: any) => {
    setInfo({ ...info, [field]: value });
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      setImageError("Por favor, selecione apenas arquivos de imagem (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setImageError("A imagem deve ter no máximo 3MB.");
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateField("therapistImage", event.target.result as string);
      }
    };
    reader.onerror = () => {
      setImageError("Ocorreu um erro ao carregar o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFilesChange = (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setBannerError(null);
    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setBannerError("Por favor, selecione apenas arquivos de imagem (JPEG, PNG, WEBP).");
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setBannerError("Cada imagem de banner deve ter no máximo 4MB.");
        return;
      }
      validFiles.push(file);
    }

    const currentBanners = info.bannerImages || [];
    let loadedCount = 0;
    const newBanners = [...currentBanners];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newBanners.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setInfo({ ...info, bannerImages: newBanners });
        }
      };
      reader.onerror = () => {
        setBannerError("Ocorreu um erro ao carregar um dos arquivos.");
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveBanner = (index: number) => {
    const currentBanners = info.bannerImages || [];
    const updated = currentBanners.filter((_: any, idx: number) => idx !== index);
    setInfo({ ...info, bannerImages: updated });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const updateNestedField = (parent: string, child: string, value: any) => {
    setInfo({
      ...info,
      [parent]: {
        ...info[parent],
        [child]: value
      }
    });
  };

  const updateServiceField = (index: number, field: string, value: string) => {
    const services = [...info.services];
    services[index] = { ...services[index], [field]: value };
    setInfo({ ...info, services });
  };

  const handleAddCredential = () => {
    if (!newCred) return;
    const credentials = [...info.credentials, newCred];
    setInfo({ ...info, credentials });
    setNewCred("");
  };

  const handleRemoveCredential = (index: number) => {
    const credentials = info.credentials.filter((_: any, idx: number) => idx !== index);
    setInfo({ ...info, credentials });
  };

  if (!info) return <div className="text-center py-6 text-slate-500 font-sans">Carregando dados...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {successMsg && (
        <div className="bg-purple-50 text-purple-950 border border-purple-100 rounded-2xl p-4 text-xs font-sans flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-purple-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Configuração da Guia do Navegador (Favicon & Título) */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6">
        <h4 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
          <Globe className="w-5 h-5 text-purple-600" />
          Configurações de Identidade Visual e Guia do Navegador (Favicon)
        </h4>
        <p className="text-xs text-slate-500 font-sans -mt-3">
          Personalize como sua clínica aparece no topo das abas do navegador e destaque sua marca em todo o site.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs & Upload Form (Left) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Tab Title Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">
                Título da Guia do Navegador (Tab Title)
              </label>
              <input
                type="text"
                value={info.tabTitle || ""}
                onChange={(e) => updateField("tabTitle", e.target.value)}
                placeholder="Ex: Serena Mente - Dra. Gabriela Santos"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
              />
              <p className="text-[10px] text-slate-400 font-sans">
                Este é o título que os usuários verão na aba do navegador ao acessar o seu site.
              </p>
            </div>

            {/* Favicon / Logo Upload Field */}
            <div className="space-y-2">
              <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">
                Logomarca da Clínica (Favicon / Logo Principal)
              </label>
              
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleLogoFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById("logo-file-input")?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                  isDraggingLogo
                    ? "border-purple-600 bg-purple-50/50"
                    : "border-slate-200 bg-slate-50 hover:border-purple-400 hover:bg-slate-50/80"
                }`}
              >
                <input
                  type="file"
                  id="logo-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleLogoFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-2.5 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-purple-600 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-sans font-bold text-slate-700">
                    Arraste a sua logomarca aqui ou <span className="text-purple-600 underline">procure no computador</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                    Formatos recomendados: PNG, JPG ou ICO. Tamanho sugerido: Quadrado (512x512px). Máx: 2MB.
                  </p>
                </div>
              </div>

              {logoError && (
                <p className="text-[10px] text-rose-500 font-sans font-semibold flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {logoError}
                </p>
              )}
            </div>
          </div>

          {/* Real-time Previews (Right) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            {/* Browser Tab Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2.5">
              <span className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest">
                Prévia da Guia do Navegador
              </span>
              
              {/* Mock Browser Header */}
              <div className="bg-slate-200/50 rounded-t-xl px-3 py-2 flex items-center gap-2 border-b border-slate-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
                
                {/* Active Tab */}
                <div className="bg-white rounded-md px-3 py-1 flex items-center gap-1.5 shadow-sm text-[10px] font-sans font-semibold text-slate-700 max-w-[180px] border border-slate-100 ml-3 truncate">
                  <img
                    src={info.clinicLogo || IMAGES.logo}
                    alt="Favicon"
                    className="w-4.5 h-4.5 object-contain shrink-0 image-render-crisp"
                  />
                  <span className="truncate">{info.tabTitle || info.therapistName || "Serena Mente"}</span>
                </div>
                <div className="w-4 h-4 rounded-full hover:bg-slate-300 flex items-center justify-center text-[10px] text-slate-500 cursor-pointer font-bold leading-none">
                  +
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                *O ícone (Favicon) e o título serão aplicados no topo real do navegador assim que clicar em salvar.
              </p>
            </div>

            {/* Current Brand Logo Highlight Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2.5">
              <span className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest">
                Logomarca Ativa (Destaques)
              </span>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-100 shadow-md flex items-center justify-center p-2 shrink-0">
                  <img
                    src={info.clinicLogo || IMAGES.logo}
                    alt="Logo ativa"
                    className="w-full h-full object-contain image-render-crisp"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-sans font-bold text-purple-600 block">Destaques ativados:</span>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    Aparece no cabeçalho, no banner de boas-vindas, na tela de carregamento, no bloco de serviços e no rodapé do consultório.
                  </p>
                  {info.clinicLogo && (
                    <button
                      type="button"
                      onClick={() => updateField("clinicLogo", "")}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-sans font-bold underline mt-1 block cursor-pointer"
                    >
                      Restaurar Logomarca Padrão
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Therapist Profile Header and Tagline */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6">
        <h4 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
          <Award className="w-5 h-5 text-purple-600" />
          Identidade e Apresentação do Terapeuta
        </h4>

        {/* Upload da Imagem do Terapeuta */}
        <div className="space-y-2 border-b border-slate-100/50 pb-6">
          <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">
            Imagem de Perfil da Terapeuta
          </label>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Live Preview */}
            <div className="md:col-span-4 flex flex-col items-center justify-center">
              <div className="w-32 h-44 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative group shadow-sm">
                <img
                  src={info.therapistImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"}
                  alt="Prévia da foto"
                  className="w-full h-full object-cover"
                />
                {info.therapistImage && (
                  <button
                    type="button"
                    onClick={() => updateField("therapistImage", "")}
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-sans font-bold gap-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Remover
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-2">Prévia da imagem na biografia</p>
            </div>

            {/* Drag & Drop Box */}
            <div className="md:col-span-8">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("therapist-file-input")?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                  isDragging 
                    ? "border-purple-600 bg-purple-50/50" 
                    : "border-slate-200 bg-slate-50 hover:border-purple-400 hover:bg-slate-50/80"
                }`}
              >
                <input
                  type="file"
                  id="therapist-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-purple-600 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-sans font-bold text-slate-700">
                    Arraste sua foto aqui ou <span className="text-purple-600 underline">procure no computador</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans mt-1">
                    Formatos recomendados: JPG, PNG ou WEBP. Tamanho máximo: 3MB.
                  </p>
                </div>
              </div>
              {imageError && (
                <p className="text-[11px] text-rose-500 font-sans mt-1.5 font-semibold flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  {imageError}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Nome da Terapeuta *</label>
            <input
              type="text"
              required
              value={info.therapistName}
              onChange={(e) => updateField("therapistName", e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Subtítulo Profissional e Registro (CRP) *</label>
            <input
              type="text"
              required
              value={info.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Slogan / Frase de Impacto da Clínica *</label>
          <input
            type="text"
            required
            value={info.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Biografia Profissional Completa *</label>
          <textarea
            required
            rows={5}
            value={info.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition leading-relaxed"
          />
        </div>
      </div>

      {/* Imagens do Banner do Cabeçalho (Hero) */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6">
        <div>
          <h4 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
            <Upload className="w-5 h-5 text-purple-600" />
            Imagens do Banner do Cabeçalho (Hero)
          </h4>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Faça upload de uma ou várias imagens para personalizar o topo do site. Se carregar mais de uma imagem, o site exibirá um carrossel de transição automática.
          </p>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingBanner(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingBanner(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingBanner(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleBannerFilesChange(e.dataTransfer.files);
            }
          }}
          onClick={() => document.getElementById("banner-file-input")?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
            isDraggingBanner
              ? "border-purple-600 bg-purple-50/50"
              : "border-slate-200 bg-slate-50 hover:border-purple-400 hover:bg-slate-50/80"
          }`}
        >
          <input
            type="file"
            id="banner-file-input"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleBannerFilesChange(e.target.files);
              }
            }}
          />
          <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-purple-600 transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-sans font-bold text-slate-700">
              Arraste um ou mais arquivos de imagem aqui ou <span className="text-purple-600 underline">procure no computador</span>
            </p>
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              Formatos recomendados: JPG, PNG ou WEBP. Tamanho máximo por foto: 4MB.
            </p>
          </div>
        </div>

        {bannerError && (
          <p className="text-[11px] text-rose-500 font-sans font-semibold flex items-center gap-1">
            <X className="w-3.5 h-3.5" />
            {bannerError}
          </p>
        )}

        {/* Banners List / Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">
            Imagens Ativas no Banner ({ (info.bannerImages || []).length })
          </label>
          
          {(info.bannerImages && info.bannerImages.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {info.bannerImages.map((imgUrl: string, bIdx: number) => (
                <div key={bIdx} className="relative aspect-[16/9] rounded-xl overflow-hidden border border-slate-100 bg-slate-50 group shadow-sm">
                  <img
                    src={imgUrl}
                    alt={`Banner ${bIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBanner(bIdx)}
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-sans font-bold gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    Excluir
                  </button>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-950/60 rounded text-[9px] text-white font-sans font-bold">
                    #{bIdx + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100/50">
              <p className="text-xs font-sans text-slate-500 font-medium">Utilizando a foto padrão do consultório (Serena Mente)</p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Faça upload de fotos acima para substituir o banner.</p>
            </div>
          )}
        </div>
      </div>

      {/* Academic Credentials & Memberships */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-5">
        <h4 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
          <Award className="w-5 h-5 text-purple-600" />
          Formações Acadêmicas e Credenciais
        </h4>

        <div className="space-y-3">
          {info.credentials.map((cred: string, index: number) => (
            <div key={index} className="flex gap-2 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-100 justify-between">
              <span className="text-xs font-sans text-slate-700">{cred}</span>
              <button
                type="button"
                onClick={() => handleRemoveCredential(index)}
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Pós-Graduação em Neuropsicologia"
            value={newCred}
            onChange={(e) => setNewCred(e.target.value)}
            className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
          />
          <button
            type="button"
            onClick={handleAddCredential}
            className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer shadow"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6">
        <h4 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
          <ClipboardList className="w-5 h-5 text-purple-600" />
          Lista de Serviços Prestados
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {info.services.map((srv: any, index: number) => (
            <div key={index} className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-purple-700">Serviço #{index+1}</span>
              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Título do Serviço</label>
                <input
                  type="text"
                  required
                  value={srv.title}
                  onChange={(e) => updateServiceField(index, "title", e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none text-slate-800 focus:border-purple-600 transition font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Descrição Detalhada</label>
                <textarea
                  required
                  rows={4}
                  value={srv.description}
                  onChange={(e) => updateServiceField(index, "description", e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-sans outline-none text-slate-800 focus:border-purple-600 transition leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Hours */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6">
        <h4 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
          <MapPin className="w-5 h-5 text-purple-600" />
          Contatos e Informações Físicas da Clínica
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Endereço Completo de Atendimento *</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={info.clinicDetails.address}
                onChange={(e) => updateNestedField("clinicDetails", "address", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-purple-600 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Telefone Comercial / WhatsApp *</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={info.clinicDetails.phone}
                onChange={(e) => updateNestedField("clinicDetails", "phone", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-purple-600 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">E-mail Profissional *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={info.clinicDetails.email}
                onChange={(e) => updateNestedField("clinicDetails", "email", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-purple-600 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Horários de Atendimento *</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={info.clinicDetails.hours}
                onChange={(e) => updateNestedField("clinicDetails", "hours", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-purple-600 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Configuration Block */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6">
        <div>
          <h4 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
            <Sliders className="w-5 h-5 text-purple-600" />
            Configuração de Preços de Consulta
          </h4>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Defina os valores cobrados para cada modalidade de atendimento. Você pode optar por exibir ou ocultar os valores nas telas de agendamento e acionamento de emergências.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Atendimento Online *</label>
            <input
              type="text"
              required
              placeholder="Ex: R$ 150,00"
              value={info.priceOnline || ""}
              onChange={(e) => updateField("priceOnline", e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Atendimento Presencial *</label>
            <input
              type="text"
              required
              placeholder="Ex: R$ 180,00"
              value={info.pricePresencial || ""}
              onChange={(e) => updateField("pricePresencial", e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider font-sans">Canal de Emergência HelpPsi *</label>
            <input
              type="text"
              required
              placeholder="Ex: R$ 150,00"
              value={info.priceHelpPsi || ""}
              onChange={(e) => updateField("priceHelpPsi", e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition font-sans"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/40 mt-4">
          <input
            id="checkbox-show-prices"
            type="checkbox"
            checked={!!info.showPrices}
            onChange={(e) => updateField("showPrices", e.target.checked)}
            className="w-5 h-5 accent-purple-600 cursor-pointer rounded"
          />
          <div className="space-y-0.5">
            <label htmlFor="checkbox-show-prices" className="block text-xs font-sans font-extrabold text-purple-900 cursor-pointer">
              Exibir valores nas telas de agendamento e SOS HelpPsi
            </label>
            <p className="text-[10px] text-purple-600/80 font-sans">
              Se desmarcado, os preços não serão exibidos e o agendamento mostrará as modalidades sem custo visível direto.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button Floating/Sticky bar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-purple-600/15 transition flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Salvar Alterações do Website
        </button>
      </div>
    </form>
  );
}

/* ==========================================================================
   SUB-COMPONENT: ADMIN APPROACHES TAB
   ========================================================================== */
function AdminApproachesTab() {
  const [apps, setApps] = useState<Approach[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [newPrinciple, setNewPrinciple] = useState("");

  useEffect(() => {
    getApproachesFromDb().then((dbApps) => {
      setApps(dbApps);
    }).catch((err) => {
      console.error("Erro ao carregar abordagens:", err);
      const saved = localStorage.getItem("serenamente_approaches");
      if (saved) {
        try {
          setApps(JSON.parse(saved));
        } catch (e) {
          setApps(APPROACHES);
        }
      } else {
        setApps(APPROACHES);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      for (const app of apps) {
        await saveApproachToDb(app);
      }
      setSuccessMsg("Configurações das abordagens teóricas atualizadas com sucesso no banco de dados!");
    } catch (err) {
      console.error("Erro ao salvar abordagens no Firestore:", err);
      localStorage.setItem("serenamente_approaches", JSON.stringify(apps));
      setSuccessMsg("Alterações salvas localmente devido a um erro de conexão.");
    }
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const updateSelectedField = (field: keyof Approach, value: any) => {
    const updated = apps.map((app, idx) => {
      if (idx === selectedIdx) {
        return { ...app, [field]: value };
      }
      return app;
    });
    setApps(updated);
  };

  const updateReframingField = (field: string, value: string) => {
    const updated = apps.map((app, idx) => {
      if (idx === selectedIdx) {
        return {
          ...app,
          reframingExample: {
            ...app.reframingExample,
            [field]: value
          }
        };
      }
      return app;
    });
    setApps(updated);
  };

  const handleAddPrinciple = () => {
    if (!newPrinciple) return;
    const currentPrinciples = apps[selectedIdx].corePrinciples;
    const updatedPrinciples = [...currentPrinciples, newPrinciple];
    updateSelectedField("corePrinciples", updatedPrinciples);
    setNewPrinciple("");
  };

  const handleRemovePrinciple = (index: number) => {
    const currentPrinciples = apps[selectedIdx].corePrinciples;
    const updatedPrinciples = currentPrinciples.filter((_, idx) => idx !== index);
    updateSelectedField("corePrinciples", updatedPrinciples);
  };

  if (apps.length === 0) return <div className="text-center py-6 text-slate-500 font-sans">Carregando abordagens...</div>;

  const currentApp = apps[selectedIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar Approaches Selector */}
      <div className="lg:col-span-3 space-y-2">
        <span className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest pl-2">Escolha uma abordagem</span>
        <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {apps.map((app, idx) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`text-left px-4 py-3 rounded-2xl text-xs font-sans font-bold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal w-full border ${
                selectedIdx === idx
                  ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/10"
                  : "bg-white border-slate-50 text-slate-700 hover:bg-slate-50 hover:border-slate-100"
              }`}
            >
              <div className="text-sm font-black">{app.name}</div>
              <div className={`text-[10px] font-normal truncate opacity-80 ${selectedIdx === idx ? "text-slate-100" : "text-slate-400"}`}>
                {app.fullName}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editing Form Area */}
      <div className="lg:col-span-9">
        <form onSubmit={handleSave} className="space-y-6">
          {successMsg && (
            <div className="bg-purple-50 text-purple-950 border border-purple-100 rounded-2xl p-4 text-xs font-sans flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-purple-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <span className="text-[10px] font-sans font-bold uppercase text-purple-600 tracking-wider">Abordagem ativa para edição</span>
              <h3 className="font-sans font-extrabold text-slate-900 text-lg mt-0.5">{currentApp.fullName} ({currentApp.name})</h3>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Título Completo da Abordagem *</label>
              <input
                type="text"
                required
                value={currentApp.fullName}
                onChange={(e) => updateSelectedField("fullName", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Descrição Curta (Exibida em cards de visão rápida) *</label>
              <textarea
                required
                rows={2}
                value={currentApp.shortDescription}
                onChange={(e) => updateSelectedField("shortDescription", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Frase / Citação Ilustrativa (Quote) *</label>
              <input
                type="text"
                required
                value={currentApp.quote}
                onChange={(e) => updateSelectedField("quote", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition italic text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">Descrição Detalhada e Ampla da Abordagem *</label>
              <textarea
                required
                rows={6}
                value={currentApp.longDescription}
                onChange={(e) => updateSelectedField("longDescription", e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition leading-relaxed"
              />
            </div>
          </div>

          {/* Core Principles */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-4">
            <h4 className="font-sans font-extrabold text-slate-900 text-sm border-b border-slate-50 pb-2">Princípios de Trabalho Principais</h4>
            <div className="space-y-2">
              {currentApp.corePrinciples.map((pr: string, index: number) => (
                <div key={index} className="flex gap-2 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-100 justify-between">
                  <span className="text-xs font-sans text-slate-700">{pr}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrinciple(index)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Escuta clínica ativa e sem julgamentos"
                value={newPrinciple}
                onChange={(e) => setNewPrinciple(e.target.value)}
                className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
              />
              <button
                type="button"
                onClick={handleAddPrinciple}
                className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer shadow"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Reframing Example */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-4">
            <h4 className="font-sans font-extrabold text-slate-900 text-sm border-b border-slate-50 pb-2">Exemplo Clínico Ilustrativo (Reestruturação de Pensamento)</h4>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Pensamento / Padrão Inicial do Paciente *</label>
                <textarea
                  required
                  rows={2}
                  value={currentApp.reframingExample.original}
                  onChange={(e) => updateReframingField("original", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Distorção / Interpretação Clínica da Queixa *</label>
                <input
                  type="text"
                  required
                  value={currentApp.reframingExample.distortion}
                  onChange={(e) => updateReframingField("distortion", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Pensamento Resignificado de Equilíbrio *</label>
                <textarea
                  required
                  rows={2}
                  value={currentApp.reframingExample.reframed}
                  onChange={(e) => updateReframingField("reframed", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider">Explicação Terapêutica Adicional *</label>
                <textarea
                  required
                  rows={2}
                  value={currentApp.reframingExample.explanation}
                  onChange={(e) => updateReframingField("explanation", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-sans outline-none text-slate-800 focus:bg-white focus:border-purple-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-purple-600/15 transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Salvar Configurações Teóricas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: ADMIN HELPPSI TAB (EMERGENCY REQUESTS)
   ========================================================================== */
function AdminHelpPsiTab() {
  const [emergencies, setEmergencies] = useState<HelpPsiEmergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  const loadEmergencies = () => {
    setLoading(true);
    getHelpPsiEmergenciesFromDb().then((list) => {
      setEmergencies(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    const qEmergencies = query(collection(db, "helppsi_emergencies"));
    const unsubscribeEmergencies = onSnapshot(qEmergencies, (snapshot) => {
      const list: HelpPsiEmergency[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as HelpPsiEmergency);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      setEmergencies(list);
      localStorage.setItem("serenamente_helppsi", JSON.stringify(list));
      setLoading(false);
    }, (err) => {
      console.error("Erro no onSnapshot de helppsi_emergencies:", err);
      getHelpPsiEmergenciesFromDb().then(setEmergencies).catch(console.error).finally(() => setLoading(false));
    });

    return () => {
      unsubscribeEmergencies();
    };
  }, []);

  const handleToggleStatus = async (item: HelpPsiEmergency) => {
    const updatedStatus: "pending" | "resolved" = item.status === "pending" ? "resolved" : "pending";
    const updatedItem: HelpPsiEmergency = { ...item, status: updatedStatus };
    try {
      await saveHelpPsiEmergencyToDb(updatedItem);
      setSuccessMsg("Status de emergência atualizado!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadEmergencies();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status da emergência.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro de emergência permanentemente?")) {
      try {
        await deleteHelpPsiEmergencyFromDb(id);
        setSuccessMsg("Registro de emergência excluído!");
        setTimeout(() => setSuccessMsg(""), 3000);
        loadEmergencies();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir emergência.");
      }
    }
  };

  const pendingCount = emergencies.filter(e => e.status === "pending").length;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-md space-y-6" id="admin-helppsi-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h3 className="font-sans font-extrabold text-slate-900 text-xl tracking-tight">
            🚑 Emergências SOS HelpPsi
          </h3>
          <p className="font-sans text-slate-500 text-xs sm:text-sm">
            Visualize e faça o acompanhamento em tempo real dos pacientes que acionaram o suporte de urgência no site.
          </p>
        </div>

        <button
          onClick={loadEmergencies}
          className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-4 py-2 rounded-xl border border-purple-100 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar Lista
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 flex gap-2 items-center text-xs font-sans">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats counter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-rose-50/70 border border-rose-100/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100/60 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-sans font-bold text-rose-800 uppercase tracking-wider">Pendentes de Retorno</p>
            <p className="text-2xl font-black text-rose-950 font-sans">{pendingCount} urgências</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider font-sans">Histórico Total</p>
            <p className="text-2xl font-black text-slate-800 font-sans">{emergencies.length} chamados</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-sans">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
          Buscando registros de emergência no Firestore...
        </div>
      ) : emergencies.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm font-bold text-slate-500 font-sans">Nenhuma emergência registrada</p>
          <p className="text-xs text-slate-400 font-sans mt-1">Os pacientes que usarem o botão SOS HelpPsi aparecerão listados aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                <th className="py-4">Paciente</th>
                <th className="py-4">Contato / WhatsApp</th>
                <th className="py-4">Data do Chamado</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {emergencies.map((e) => (
                <tr key={e.id} className={`hover:bg-slate-50/50 transition ${e.status === 'pending' ? 'bg-rose-50/10' : ''}`}>
                  <td className="py-4 pr-3 font-bold text-slate-900 font-sans">{e.patientName}</td>
                  <td className="py-4 pr-3 font-mono font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {e.whatsapp}
                    </span>
                  </td>
                  <td className="py-4 pr-3 font-sans text-slate-500">{e.createdAt}</td>
                  <td className="py-4 pr-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-sans ${
                      e.status === "pending"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {e.status === "pending" ? "Pendente" : "Resolvido"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => {
                          const formattedWhatsapp = e.whatsapp.replace(/\D/g, "");
                          const text = encodeURIComponent(`Olá ${e.patientName}, sou a Dra. Gabriela. Recebi o seu chamado de SOS HelpPsi no site. Estou entrando em contato para conversarmos imediatamente.`);
                          window.open(`https://wa.me/${formattedWhatsapp}?text=${text}`, "_blank");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                        title="Entrar em contato via WhatsApp"
                      >
                        <Phone className="w-3 h-3" />
                        Chamar
                      </button>

                      <button
                        onClick={() => handleToggleStatus(e)}
                        className={`font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          e.status === "pending"
                            ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                        title={e.status === "pending" ? "Marcar como Resolvido" : "Reabrir Chamado"}
                      >
                        {e.status === "pending" ? "Resolver" : "Reabrir"}
                      </button>

                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

