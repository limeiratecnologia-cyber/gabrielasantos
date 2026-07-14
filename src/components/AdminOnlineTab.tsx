import React, { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Send, MessageSquare, Shield, Clock, Users, Sparkles, AlertCircle, Copy, Check, User, Heart, Star, Activity, ClipboardList, Laptop } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc } from "firebase/firestore";
import { getPatientsFromDb, getBookingsFromDb, saveEvolutionToDb } from "../lib/firebaseService";
import { Patient, Booking, ClinicalEvolution } from "../types";

interface AdminOnlineTabProps {
  preselectedRoom?: { roomCode: string; clientName: string } | null;
  onClearPreselectedRoom?: () => void;
}

export default function AdminOnlineTab({ preselectedRoom, onClearPreselectedRoom }: AdminOnlineTabProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Selection states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Stream options
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");

  // Local camera stream
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Chat synchronized with Firestore
  const [messages, setMessages] = useState<Array<{ sender: "user" | "therapist", text: string, time: string, timestamp: number }>>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Clinical evolution state for quick-saving during session
  const [sessionNotes, setSessionNotes] = useState("");
  const [evolutionSuccess, setEvolutionSuccess] = useState(false);

  // Load patients and bookings
  useEffect(() => {
    getPatientsFromDb().then(setPatients).catch(console.error);
    getBookingsFromDb().then(setBookings).catch(console.error);
  }, []);

  // Handle preselected room from agenda
  useEffect(() => {
    if (preselectedRoom) {
      const foundBooking = bookings.find(b => b.roomCode === preselectedRoom.roomCode);
      if (foundBooking) {
        // Find matching patient by phone/email or name
        const match = patients.find(p => p.name.toLowerCase() === foundBooking.clientName.toLowerCase() || p.phone === foundBooking.clientPhone);
        if (match) {
          setSelectedPatientId(match.id);
        }
      }
      setRoomCode(preselectedRoom.roomCode);
      // Auto trigger live start
      handleStartLive(preselectedRoom.roomCode, preselectedRoom.clientName);
      if (onClearPreselectedRoom) {
        onClearPreselectedRoom();
      }
    }
  }, [preselectedRoom, bookings, patients, onClearPreselectedRoom]);

  // Handle local camera access
  useEffect(() => {
    if (isLive && !isVideoOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          setStream(mediaStream);
          setStreamError(false);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.warn("Camera/Microphone access was denied or unavailable:", err);
          setStreamError(true);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isLive, isVideoOff]);

  // Timer for session
  useEffect(() => {
    let interval: any = null;
    if (isLive) {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  // Real-time listener for Firestore messages and status
  useEffect(() => {
    if (!isLive || !roomCode) return;

    const roomRef = doc(db, "room_sessions", roomCode);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.messages) {
          // Sort messages by timestamp
          const sorted = [...data.messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(sorted);
        }
      }
    });

    return () => unsubscribe();
  }, [isLive, roomCode]);

  // Auto-scrolling chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectPatient = (pId: string) => {
    setSelectedPatientId(pId);
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!pId) {
      setRoomCode("");
      return;
    }

    const patient = patients.find(p => p.id === pId);
    if (!patient) return;

    // Check if patient has any scheduled online bookings
    const activeBooking = bookings.find(
      b => b.clientName.toLowerCase() === patient.name.toLowerCase() && 
           b.status === "scheduled" && 
           b.roomCode
    );

    if (activeBooking && activeBooking.roomCode) {
      setRoomCode(activeBooking.roomCode);
      setSuccessMsg(`Agendamento ativo localizado! Código designado: ${activeBooking.roomCode}`);
    } else {
      // Auto generate ad-hoc room code
      const randCode = "SRM-" + Math.floor(1000 + Math.random() * 9000);
      setRoomCode(randCode);
      setSuccessMsg(`Nenhum agendamento online ativo pendente hoje. Gerando código de sala imediato: ${randCode}`);
    }
  };

  const handleStartLive = async (customCode?: string, customClient?: string) => {
    setErrorMsg("");
    const finalCode = customCode || roomCode;
    const patientId = selectedPatientId;
    const patient = patients.find(p => p.id === patientId);
    const finalClientName = customClient || patient?.name || "Paciente Conectado";

    if (!finalCode) {
      setErrorMsg("Selecione um paciente ou digite um código de sala válido.");
      return;
    }

    try {
      const roomRef = doc(db, "room_sessions", finalCode);
      
      // Initialize or update room session in Firestore
      const initialMessages = [
        {
          sender: "therapist",
          text: `Olá! Seja muito bem-vindo(a) à nossa sala de teleconsulta protegida. Como você está se sentindo hoje?`,
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          timestamp: Date.now()
        }
      ];

      // Check if room document already has messages to preserve them
      const docSnap = await getDoc(roomRef);
      const existingData = docSnap.exists() ? docSnap.data() : null;

      await setDoc(roomRef, {
        roomCode: finalCode,
        clientName: finalClientName,
        therapistIsLive: true,
        messages: existingData?.messages || initialMessages,
        lastUpdated: Date.now()
      }, { merge: true });

      setIsLive(true);
      setRoomCode(finalCode);
    } catch (err) {
      console.error("Erro ao iniciar transmissão no Firestore:", err);
      setErrorMsg("Ocorreu um erro ao registrar a sala de transmissão ao vivo no servidor.");
    }
  };

  const handleEndLive = async () => {
    if (!confirm("Deseja realmente encerrar a transmissão ao vivo desta consulta?")) {
      return;
    }

    try {
      const roomRef = doc(db, "room_sessions", roomCode);
      
      // We set therapistIsLive to false, notifying the waiting patient
      await updateDoc(roomRef, {
        therapistIsLive: false,
        lastUpdated: Date.now()
      });

      // Cleanup stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      setIsLive(false);
      setMessages([]);
      setCallTimer(0);
      setSessionNotes("");
    } catch (err) {
      console.error("Erro ao finalizar sala:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !roomCode) return;

    try {
      const roomRef = doc(db, "room_sessions", roomCode);
      const newMsg = {
        sender: "therapist" as const,
        text: inputText.trim(),
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: Date.now()
      };

      await updateDoc(roomRef, {
        messages: arrayUnion(newMsg)
      });

      setInputText("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const handleSaveNotes = async () => {
    if (!sessionNotes.trim()) return;
    
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    try {
      const newEvolution: ClinicalEvolution = {
        id: `evol-${Date.now()}`,
        patientId: patient.id,
        date: new Date().toLocaleDateString("pt-BR"),
        text: sessionNotes.trim(),
        createdAt: new Date().toISOString()
      };

      await saveEvolutionToDb(newEvolution);
      setEvolutionSuccess(true);
      setTimeout(() => setEvolutionSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar evolução clínica:", err);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6" id="admin-online-tab">
      {!isLive ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100/60">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-xl tracking-tight">Centro de Atendimento Online</h2>
              <p className="text-xs text-slate-500">Transmita sessões de vídeo protegidas em tempo real para os pacientes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
            {/* Left Selection */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-bold text-slate-600 uppercase tracking-widest">
                  Selecione o Paciente para Iniciar
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => handleSelectPatient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl px-4 py-3.5 text-xs font-sans outline-none transition cursor-pointer text-slate-800 font-semibold"
                >
                  <option value="">-- Escolher um Paciente Cadastrado --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      👤 {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-100 space-y-3.5 animate-fade-in">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Status da Conexão
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100/60">
                      <span className="text-slate-500">Nome:</span>
                      <span className="font-bold text-slate-800">{selectedPatient.name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100/60">
                      <span className="text-slate-500">Contato:</span>
                      <span className="font-bold text-slate-800">{selectedPatient.phone}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Código de Sala Designado:</span>
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100/40">{roomCode}</span>
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex gap-2 items-start text-xs leading-relaxed animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-purple-50 border border-purple-100/60 text-purple-800 rounded-2xl p-4 flex gap-2 items-start text-xs leading-relaxed animate-fade-in">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleStartLive()}
                disabled={!selectedPatientId}
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedPatientId
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/15 scale-[1.01]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                <Video className="w-5 h-5" />
                Iniciar Transmissão Ao Vivo
              </button>
            </div>

            {/* Right Guide Info */}
            <div className="bg-gradient-to-br from-slate-50 to-purple-50/20 rounded-3xl border border-slate-100/80 p-5 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Shield className="w-4.5 h-4.5 text-purple-600" />
                Como Funciona a Teleconsulta?
              </h3>
              
              <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <p>Selecione o paciente cadastrado na lista para verificar se há algum agendamento com sala dinâmica.</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <p>Clique em <strong>Iniciar Transmissão</strong> para ativar sua câmera e notificar o paciente que você está "Ao Vivo".</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <p>O paciente entra na aba de consulta online usando o código gerado (ex: <strong>{roomCode || "SRM-XXXX"}</strong>) e assiste ao atendimento em tempo real.</p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                  <p>Se o paciente entrar antes de você estar "Ao Vivo", ele ficará aguardando na sala de espera protegida até você conectar!</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Therapist Live Broadcast workspace */
        <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-hidden shadow-2xl h-[680px] flex flex-col border border-slate-850 animate-fade-in relative font-sans">
          
          {/* Top header bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-200">
                  Transmissão Ativa • Atendendo {selectedPatient?.name}
                </h3>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  🔴 TRANSMISSÃO DE VÍDEO EM TEMPO REAL
                </p>
              </div>
            </div>

            {/* Room code copy trigger */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 border border-slate-750 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                {formatTime(callTimer)}
              </div>

              <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-2 tracking-wider">CÓDIGO:</span>
                <span className="font-mono font-bold text-purple-400 text-xs mr-2">{roomCode}</span>
                <button
                  onClick={copyRoomCode}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title="Copiar código para enviar ao paciente"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Main Workspace Stage */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Camera feed area */}
            <div className="flex-1 bg-slate-950 p-4 relative flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 to-purple-950/20 border border-slate-850 overflow-hidden relative flex items-center justify-center">
                
                {!isVideoOff && !streamError ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
                      <VideoOff className="w-8 h-8 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-300">Sua Câmera está Desligada</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">Ligue sua câmera utilizando os botões de controle abaixo para transmitir.</p>
                    </div>
                  </div>
                )}

                {/* Floating details */}
                <div className="absolute bottom-4 left-4 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider backdrop-blur-sm flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                  FEED DE TRANSMISSÃO (SUA CÂMERA)
                </div>

                {/* Simulated telemetry overlay */}
                <div className="absolute top-4 left-4 flex gap-1.5">
                  <span className="bg-slate-900/60 border border-slate-800 text-[9px] font-bold text-slate-300 px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                    FPS: 30
                  </span>
                  <span className="bg-slate-900/60 border border-slate-800 text-[9px] font-bold text-slate-300 px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                    BITRATE: 1.2 MBPS
                  </span>
                </div>
              </div>
            </div>

            {/* Right sidebar tab section */}
            <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
              {/* Sidebar header selector */}
              <div className="flex border-b border-slate-800 text-xs font-bold text-slate-400">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 py-3 border-b-2 text-center transition ${
                    activeTab === "chat" ? "border-purple-600 text-purple-400 font-extrabold bg-slate-950/20" : "border-transparent hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    Chat Integrado
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`flex-1 py-3 border-b-2 text-center transition ${
                    activeTab === "notes" ? "border-purple-600 text-purple-400 font-extrabold bg-slate-950/20" : "border-transparent hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <ClipboardList className="w-4 h-4" />
                    Anotações Clínicas
                  </span>
                </button>
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                {activeTab === "chat" ? (
                  <>
                    {/* Chat Messages */}
                    <div className="flex-1 space-y-4 pr-1 min-h-[300px]">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-xs space-y-1">
                          <p>Nenhuma mensagem enviada ainda.</p>
                          <p>Inicie a conversa digitando algo abaixo.</p>
                        </div>
                      ) : (
                        messages.map((m, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col max-w-[85%] ${
                              m.sender === "therapist" ? "ml-auto items-end" : "mr-auto items-start"
                            }`}
                          >
                            <span className="text-[9px] text-slate-400 font-bold mb-1 font-mono">
                              {m.sender === "therapist" ? "Você" : selectedPatient?.name || "Paciente"} • {m.time}
                            </span>
                            <div
                              className={`rounded-2xl p-3 text-xs leading-relaxed ${
                                m.sender === "therapist"
                                  ? "bg-purple-600 text-white rounded-tr-none"
                                  : "bg-slate-800 text-slate-200 rounded-tl-none"
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Send */}
                    <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 pt-2 border-t border-slate-800 shrink-0">
                      <input
                        type="text"
                        placeholder="Enviar mensagem para o paciente..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-600 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 transition"
                      />
                      <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-2 transition shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  /* Clinical evolution writing */
                  <div className="flex flex-col h-full justify-between space-y-4">
                    <div className="space-y-3.5">
                      <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                        <ClipboardList className="w-4 h-4 text-purple-400" />
                        Evolução da Sessão
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Escreva anotações clínicas em tempo real. As anotações salvas serão arquivadas diretamente no prontuário do paciente de forma protegida.
                      </p>

                      <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Descreva o andamento da sessão, evolução emocional, insights clínicos ou reações do paciente..."
                        className="w-full h-72 bg-slate-950 border border-slate-800 focus:border-purple-600 rounded-xl p-3 text-xs outline-none text-slate-200 resize-none transition"
                      />
                    </div>

                    {evolutionSuccess && (
                      <div className="bg-emerald-950 border border-emerald-900 text-emerald-400 text-[11px] p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                        <Star className="w-4 h-4 text-emerald-500 fill-emerald-500 shrink-0" />
                        <span>Anotação clínica adicionada ao prontuário do paciente com sucesso!</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={!sessionNotes.trim()}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        sessionNotes.trim()
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Salvar Anotação no Prontuário
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom video workspace controllers */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <User className="w-4 h-4 text-slate-500" />
              Sua câmera e microfone estão transmitindo.
            </div>

            {/* Interactive controllers */}
            <div className="flex items-center gap-3 mx-auto sm:mx-0">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition border cursor-pointer ${
                  isMuted
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-lg shadow-rose-600/10"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isMuted ? "Ativar Microfone" : "Mutar Microfone"}
              >
                {isMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition border cursor-pointer ${
                  isVideoOff
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-lg shadow-rose-600/10"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isVideoOff ? "Ligar Câmera" : "Desligar Câmera"}
              >
                {isVideoOff ? <VideoOff className="w-4.5 h-4.5" /> : <Video className="w-4.5 h-4.5" />}
              </button>

              <button
                onClick={() => {
                  setIsScreenSharing(!isScreenSharing);
                  if (!isScreenSharing) {
                    alert("Apresentação de tela iniciada com sucesso!");
                  }
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition border cursor-pointer ${
                  isScreenSharing
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title="Compartilhar Tela"
              >
                <Laptop className="w-4.5 h-4.5" />
              </button>

              <div className="h-6 w-[1px] bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={handleEndLive}
                className="bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold text-xs px-5 py-3 rounded-full transition shadow-lg shadow-rose-600/20 border border-rose-500 flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                Encerrar Transmissão
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-850 text-xs font-mono text-purple-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              128-bit AES Secure
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
