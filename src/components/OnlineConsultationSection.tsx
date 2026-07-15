import React, { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Send, MessageSquare, Shield, Clock, Users, Sparkles, CheckCircle, HelpCircle, Laptop, Camera, AlertCircle, User, Heart } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { getBookingsFromDb } from "../lib/firebaseService";
import { Booking } from "../types";

export default function OnlineConsultationSection() {
  const [roomCode, setRoomCode] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [therapistIsLive, setTherapistIsLive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingDetails, setBookingDetails] = useState<Booking | null>(null);

  // Call options
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [activeSidebar, setActiveSidebar] = useState<"chat" | "info">("chat");

  // Local camera stream
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // WebRTC States and Refs
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const candidatesAdded = useRef<Set<string>>(new Set());

  // Breathing guide states for waiting room
  const [breathState, setBreathState] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [breathCycle, setBreathCycle] = useState(0);

  // Breathing loop effect
  useEffect(() => {
    if (breathState === "idle") return;

    let timer: any;
    if (breathState === "inhale") {
      timer = setTimeout(() => {
        setBreathState("hold");
      }, 4000);
    } else if (breathState === "hold") {
      timer = setTimeout(() => {
        setBreathState("exhale");
      }, 4000);
    } else if (breathState === "exhale") {
      timer = setTimeout(() => {
        setBreathState("inhale");
        setBreathCycle((c) => c + 1);
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [breathState]);

  // Chat console
  const [messages, setMessages] = useState<Array<{ sender: "user" | "therapist", text: string, time: string }>>([
    { sender: "therapist", text: "Olá! Seja muito bem-vindo(a) à nossa sala de teleconsulta protegida. Como você está se sentindo hoje?", time: "00:01" }
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scrolling chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Firestore Room Real-time Listener
  useEffect(() => {
    if (!isInCall || !roomCode) return;
    
    const sanitizedCode = roomCode.trim().toUpperCase();
    if (sanitizedCode === "DEMO" || sanitizedCode === "TESTE") {
      setTherapistIsLive(true);
      return;
    }

    const roomRef = doc(db, "room_sessions", sanitizedCode);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTherapistIsLive(!!data.therapistIsLive);
        if (data.messages) {
          const sorted = [...data.messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(sorted);
        }
      } else {
        // Room session document doesn't exist yet, meaning therapist has not initialized or gone live yet
        setTherapistIsLive(false);
      }
    }, (err) => {
      console.error("Firestore listening error:", err);
    });

    return () => unsubscribe();
  }, [isInCall, roomCode]);

  // Session duration timer
  useEffect(() => {
    let interval: any = null;
    if (isInCall) {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const requestCameraPermission = async () => {
    if (!isInCall) return;
    try {
      setStreamError(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setStreamError(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      // Apply initial track options without tearing down connection
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      mediaStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });

      // Initialize WebRTC as the Patient
      await initializeWebRTCAsPatient(mediaStream);
    } catch (err) {
      console.warn("Camera/Microphone access was denied or unavailable:", err);
      setStreamError(true);
    }
  };

  // Handle local camera access and WebRTC initialization
  useEffect(() => {
    if (isInCall) {
      requestCameraPermission();
    } else {
      cleanupWebRTC();
    }

    return () => {
      cleanupWebRTC();
    };
  }, [isInCall]);

  // Handle live track updates on active stream
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, stream]);

  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, stream]);

  // Sync local video element with stream when element mounts or stream changes
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff, streamError]);

  // Sync remote video element with stream when element mounts or remote stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isRemoteConnected]);

  // Initialize WebRTC as Patient
  const initializeWebRTCAsPatient = async (localStream: MediaStream) => {
    const sanitizedCode = roomCode.trim().toUpperCase();
    if (!sanitizedCode || sanitizedCode === "DEMO" || sanitizedCode === "TESTE") return;

    try {
      cleanupWebRTCInstance();
      setConnectionStatus("connecting");

      console.log(`[WebRTC Patient] Iniciando conexão para a sala: ${sanitizedCode}`);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ]
      });
      pcRef.current = pc;
      candidatesAdded.current.clear();

      // Add local tracks to PeerConnection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle remote tracks from the therapist using robust stream binding
      pc.ontrack = (event) => {
        console.log("[WebRTC Patient] Recebeu track remoto do Terapeuta:", event.track.kind);
        setIsRemoteConnected(true);
        setConnectionStatus("connected");

        let streamToUse: MediaStream;
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject instanceof MediaStream) {
          streamToUse = remoteVideoRef.current.srcObject;
        } else {
          streamToUse = new MediaStream();
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = streamToUse;
          }
          setRemoteStream(streamToUse);
        }

        if (event.track) {
          streamToUse.addTrack(event.track);
        }
      };

      const updateConnectionStatus = () => {
        const state = pc.connectionState;
        const iceState = pc.iceConnectionState;
        console.log(`[WebRTC Patient] Estados de conexão atualizados - ConnectionState: ${state}, IceConnectionState: ${iceState}`);
        
        if (state === "connected" || iceState === "connected") {
          setConnectionStatus("connected");
          setIsRemoteConnected(true);
        } else if (state === "connecting" || iceState === "checking") {
          setConnectionStatus("connecting");
        } else if (
          state === "disconnected" || 
          state === "failed" || 
          state === "closed" || 
          iceState === "disconnected" || 
          iceState === "failed" || 
          iceState === "closed"
        ) {
          setConnectionStatus("disconnected");
          setIsRemoteConnected(false);
        }
      };

      pc.onconnectionstatechange = updateConnectionStatus;
      pc.oniceconnectionstatechange = updateConnectionStatus;

      // Handle local ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log("[WebRTC Patient] Novo candidato ICE local gerado:", event.candidate.candidate);
          const roomRef = doc(db, "room_sessions", sanitizedCode);
          await updateDoc(roomRef, {
            patientCandidates: arrayUnion(event.candidate.toJSON())
          }).catch((err) => {
            console.error("[WebRTC Patient ERROR] Erro ao enviar candidato ICE do paciente ao Firestore:", err);
          });
        }
      };

      // Read Offer, create Answer, subscribe to therapist ICE candidates
      const roomRef = doc(db, "room_sessions", sanitizedCode);
      
      const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        console.log(`[WebRTC Patient/Firestore] Snapshot recebido. Offer presente: ${!!data.offer}, Answer presente: ${!!data.answer}, Candidatos Terapeuta: ${data.therapistCandidates?.length || 0}`);

        // Handle Offer (only if remote description is NOT set yet to break infinite SDP loops)
        if (data.offer && !pc.remoteDescription) {
          console.log("[WebRTC Patient] Processando offer do terapeuta...");
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => console.log("[WebRTC Patient] RemoteDescription (Offer) setado com sucesso."))
            .catch(err => console.error("[WebRTC Patient ERROR] Falha ao setar RemoteDescription (Offer):", err));
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          console.log("[WebRTC Patient] Enviando answer do paciente ao Firestore...");
          await updateDoc(roomRef, {
            answer: { type: answer.type, sdp: answer.sdp }
          }).catch(err => console.error("[WebRTC Patient ERROR] Falha ao enviar Answer ao Firestore:", err));

          // Post-SDP Catch-up: Immediately process any therapist candidates that arrived before SDP negotiation
          if (data.therapistCandidates && Array.isArray(data.therapistCandidates)) {
            console.log(`[WebRTC Patient] Catch-up: Adicionando ${data.therapistCandidates.length} candidatos do terapeuta pós-SDP...`);
            for (const cand of data.therapistCandidates) {
              const candStr = JSON.stringify(cand);
              if (!candidatesAdded.current.has(candStr)) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                  candidatesAdded.current.add(candStr);
                  console.log("[WebRTC Patient] Candidato do terapeuta adicionado via catch-up.");
                } catch (e) {
                  console.error("[WebRTC Patient ERROR] Erro ao adicionar candidato via catch-up:", e);
                }
              }
            }
          }
        }

        // Handle Therapist ICE candidates only if remote description is set
        if (pc.remoteDescription && data.therapistCandidates && Array.isArray(data.therapistCandidates)) {
          for (const cand of data.therapistCandidates) {
            const candStr = JSON.stringify(cand);
            if (!candidatesAdded.current.has(candStr)) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
                candidatesAdded.current.add(candStr);
                console.log("[WebRTC Patient] Candidato do terapeuta adicionado em tempo real.");
              } catch (e) {
                console.error("[WebRTC Patient ERROR] Falha ao adicionar candidato em tempo real:", e);
              }
            }
          }
        }
      }, (err) => {
        console.error("[WebRTC Patient ERROR] Erro no onSnapshot do room_sessions:", err);
      });

      (pc as any)._unsubscribeFirestore = unsubscribe;

    } catch (err) {
      console.error("[WebRTC Patient ERROR] Erro no setup do WebRTC do paciente:", err);
      setConnectionStatus("disconnected");
    }
  };

  const cleanupWebRTCInstance = () => {
    if (pcRef.current) {
      if ((pcRef.current as any)._unsubscribeFirestore) {
        (pcRef.current as any)._unsubscribeFirestore();
      }
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
    setIsRemoteConnected(false);
    setConnectionStatus("disconnected");
  };

  const cleanupWebRTC = () => {
    cleanupWebRTCInstance();
    setRemoteStream(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Format timer seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    
    // If it's empty, clear it
    if (!val) {
      setRoomCode("");
      return;
    }

    // Allow typing DEMO or TESTE prefixes freely
    if ("DEMO".startsWith(val) || "TESTE".startsWith(val)) {
      setRoomCode(val);
      return;
    }
    
    // Clean any non-alphanumeric characters and strip any leading "SRM" or "SRM-"
    let cleaned = val.replace(/[^A-Z0-9]/g, "");
    if (cleaned.startsWith("SRM")) {
      cleaned = cleaned.slice(3);
    }
    
    // Limit to 4 alphanumeric characters for the suffix code
    cleaned = cleaned.slice(0, 4);
    
    // Auto-generate formatting with "SRM-" hyphen included automatically
    if (cleaned) {
      setRoomCode(`SRM-${cleaned}`);
    } else {
      // If the user cleared everything after SRM, let them reset to empty
      setRoomCode("");
    }
  };

  // Join video room
  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    const sanitizedCode = roomCode.trim().toUpperCase();

    if (!sanitizedCode) {
      setErrorMsg("Por favor, digite um código de consulta válido.");
      return;
    }

    try {
      // Find matching booking in database
      const bookings = await getBookingsFromDb();
      const match = bookings.find(
        (b) => b.roomCode?.toUpperCase() === sanitizedCode || b.id === roomCode
      );

      if (match) {
        setBookingDetails(match);
        setIsInCall(true);
      } else if (sanitizedCode === "DEMO" || sanitizedCode === "TESTE") {
        // Mock demo booking
        const demoBooking: Booking = {
          id: "demo-booking",
          clientName: "Paciente Demonstrativo",
          clientEmail: "demo@serenamente.com.br",
          clientPhone: "(11) 99999-9999",
          approach: "Terapia de Aceitação e Compromisso (ACT)",
          date: new Date().toLocaleDateString("pt-BR"),
          timeSlot: "Horário de Teste",
          status: "scheduled",
          roomCode: "DEMO"
        };
        setBookingDetails(demoBooking);
        setIsInCall(true);
      } else {
        setErrorMsg("Código de consulta não encontrado. Verifique seu comprovante de agendamento ou digite 'DEMO' para testar a sala.");
      }
    } catch (err) {
      console.error("Erro ao verificar sala no Firestore:", err);
      setErrorMsg("Ocorreu um erro ao conectar ao servidor. Digite 'DEMO' para entrar no modo de teste off-line.");
    }
  };

  const handleEndCall = () => {
    if (confirm("Deseja realmente encerrar esta sessão de consulta online?")) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setIsInCall(false);
      setBookingDetails(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const sanitizedCode = roomCode.trim().toUpperCase();
    if (sanitizedCode === "DEMO" || sanitizedCode === "TESTE") {
      const newMsg = {
        sender: "user" as const,
        text: inputText.trim(),
        time: formatTime(callTimer),
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, newMsg]);
      setInputText("");

      // Simulate comforting therapist answers
      setTimeout(() => {
        let responseText = "Entendo perfeitamente o que você diz. Pode detalhar um pouco mais como essa emoção se manifesta no seu corpo?";
        const msgLower = newMsg.text.toLowerCase();

        if (msgLower.includes("ansiedade") || msgLower.includes("ansioso") || msgLower.includes("ansiosa")) {
          responseText = "A ansiedade pode parecer sufocante agora, mas lembre-se de que é uma resposta protetora do seu corpo. Vamos fazer uma respiração profunda juntos?";
        } else if (msgLower.includes("triste") || msgLower.includes("tristeza") || msgLower.includes("chorar")) {
          responseText = "Sinto muito que você esteja passando por esse momento doloroso. Acolher essa tristeza sem julgamento é o primeiro passo para a cura emocional.";
        } else if (msgLower.includes("obrigado") || msgLower.includes("obrigada") || msgLower.includes("valeu")) {
          responseText = "Por nada! Fico muito contente de estarmos progredindo juntos nessa caminhada terapêutica.";
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: "therapist",
            text: responseText,
            time: formatTime(callTimer + 2),
            timestamp: Date.now()
          }
        ]);
      }, 2000);
      return;
    }

    try {
      const roomRef = doc(db, "room_sessions", sanitizedCode);
      const newMsg = {
        sender: "user" as const,
        text: inputText.trim(),
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: Date.now()
      };

      await updateDoc(roomRef, {
        messages: arrayUnion(newMsg)
      });

      setInputText("");
    } catch (err) {
      console.error("Error sending message to Firestore:", err);
    }
  };

  const generateQuickDemo = () => {
    setRoomCode("DEMO");
    handleJoinRoom();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 font-sans" id="online-consultation-tab">
      {!isInCall ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[500px]">
          {/* Left info box */}
          <div className="md:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-900 text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
              <Video className="w-4 h-4" />
              Sessões de Vídeo Protegidas
            </span>
            <h1 className="text-3.5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Teleconsulta Online de Psicologia Integrada
            </h1>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Acesse seu atendimento psicológico em vídeo no conforto da sua casa, com total segurança, sigilo clínico e criptografia de ponta a ponta. Nosso sistema gera um canal dinâmico exclusivo para cada agendamento feito.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex gap-3 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Shield className="w-8 h-8 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-sm">Privacidade Total</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Sessão em total conformidade com as diretrizes de sigilo do CFP e LGPD.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Sparkles className="w-8 h-8 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-sm">Sem Instalar Nada</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Conecte-se diretamente do seu navegador no computador ou celular.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right login container */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl space-y-6">
            <div className="space-y-1.5 text-center">
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                Entrar na Sala Virtual
              </h3>
              <p className="text-xs text-slate-500">
                Digite o código recebido no seu agendamento para iniciar.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex gap-2 items-start text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans block">
                  Código da Consulta (Ex: SRM-1234)
                </label>
                <input
                  id="input-room-code"
                  type="text"
                  placeholder="SRM-XXXX"
                  value={roomCode}
                  onChange={handleRoomCodeChange}
                  className="w-full text-center bg-slate-50 border border-slate-100 focus:border-purple-600 focus:bg-white rounded-2xl py-4 font-mono font-extrabold text-xl uppercase tracking-wider text-purple-950 placeholder:text-slate-300 outline-none transition-all"
                />
              </div>

              <button
                id="btn-join-telehealth"
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-purple-600/15 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-4.5 h-4.5" />
                Conectar por Vídeo
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-100 w-full absolute" />
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase relative tracking-wider">
                OU TESTE AGORA
              </span>
            </div>

            <button
              id="btn-demo-telehealth"
              onClick={generateQuickDemo}
              className="w-full bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-100 text-slate-600 border border-slate-100 font-bold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Laptop className="w-4 h-4 text-slate-400" />
              Testar com Código Demonstrativo ("DEMO")
            </button>
          </div>
        </div>
      ) : (
        /* Video Call active interface */
        <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-visible md:overflow-hidden shadow-2xl h-auto md:h-[650px] flex flex-col border border-slate-800 animate-fade-in relative">
          
          {/* Header Controls bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping shrink-0" />
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-200 truncate">
                  {bookingDetails?.clientName}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {bookingDetails?.approach || "Teleatendimento"} • Sala: {bookingDetails?.roomCode || "DEMO"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-wrap">
              {/* Connection Status Indicator */}
              {connectionStatus === "connected" && (
                <div className="flex items-center gap-1.5 bg-green-950/60 border border-green-800 px-3 py-1.5 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-wider" id="status-connected">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Conectado
                </div>
              )}
              {connectionStatus === "connecting" && (
                <div className="flex items-center gap-1.5 bg-yellow-950/60 border border-yellow-800 px-3 py-1.5 rounded-full text-[10px] font-bold text-yellow-400 uppercase tracking-wider" id="status-connecting">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  Conectando...
                </div>
              )}
              {connectionStatus === "disconnected" && (
                <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-800 px-3 py-1.5 rounded-full text-[10px] font-bold text-rose-400 uppercase tracking-wider" id="status-disconnected">
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                  Desconectado
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {formatTime(callTimer)}
              </div>
              <span className="text-[10px] font-extrabold tracking-widest bg-purple-900/40 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-full uppercase flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-400" />
                PROTEGIDO
              </span>
            </div>
          </div>

          {/* Main Stage Grid (Video areas & Sidebar) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-visible md:overflow-hidden relative">
            
             {/* Stage containing Video Streams */}
             <div className="flex-grow md:flex-1 bg-slate-950 p-3 md:p-4 relative flex items-center justify-center overflow-y-auto md:overflow-hidden shrink-0 md:shrink">
               <div className="w-full flex flex-col gap-4 md:block md:absolute md:inset-0 md:p-4">
                 
                 {/* 1. Remote Video Stream / Waiting Room - Full size on desktop, fluid with aspect-ratio on mobile */}
                 <div className="w-full aspect-[4/3] sm:aspect-video md:absolute md:inset-0 md:w-full md:h-full rounded-2xl bg-gradient-to-tr from-slate-900 to-purple-950/40 border border-slate-800/60 overflow-hidden relative flex flex-col items-center justify-center transition-all shadow-lg shrink-0">
                     <video
                       ref={remoteVideoRef}
                       autoPlay
                       playsInline
                       className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${therapistIsLive && isRemoteConnected ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none z-0'}`}
                     />
                    {therapistIsLive && !isRemoteConnected ? (
                      /* Simulated professional screen / connecting fallback */
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 animate-fade-in p-4 bg-slate-950/80 z-20">
                        {/* Psychologist mockup avatar */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-600/10 border-2 border-purple-500/30 flex items-center justify-center shadow-lg relative group shrink-0">
                          <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-400 animate-spin opacity-20 duration-10000" />
                          <User className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                        </div>
                        
                        <div className="text-center space-y-1 min-w-0 w-full px-2">
                          <h4 className="font-extrabold text-slate-200 text-sm sm:text-base truncate">Dra. Gabriela Santos</h4>
                          <p className="text-[10px] sm:text-xs text-slate-400 truncate">Psicóloga Clínica • CRP 06/123456</p>
                          
                          {connectionStatus === "connecting" ? (
                            <div className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-400 border border-purple-900 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              <span className="w-1.5 h-1.5 bg-purple-450 rounded-full animate-ping" />
                              Conectando ao canal de vídeo...
                            </div>
                          ) : connectionStatus === "disconnected" ? (
                            <div className="inline-flex items-center gap-1 bg-amber-950/60 text-amber-400 border border-amber-900 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                              Instabilidade detectada. Reconectando...
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-green-950/60 text-green-400 border border-green-900 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                              Conectada e Transmitindo
                            </div>
                          )}
                        </div>

                        {/* Talking feedback visualizer */}
                        <div className="flex items-center gap-0.5 h-6 shrink-0">
                          <div className="w-1 bg-purple-500 rounded-full animate-bounce h-2" style={{ animationDelay: "0.1s" }} />
                          <div className="w-1 bg-purple-500 rounded-full animate-bounce h-4" style={{ animationDelay: "0.3s" }} />
                          <div className="w-1 bg-purple-500 rounded-full animate-bounce h-5" style={{ animationDelay: "0.5s" }} />
                          <div className="w-1 bg-purple-500 rounded-full animate-bounce h-3" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1 bg-purple-500 rounded-full animate-bounce h-1" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    ) : (
                      /* Gorgeous Waiting Room with ACT breathing exercises */
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-4 sm:space-y-6 overflow-y-auto animate-fade-in bg-slate-950/40">
                        <div className="relative flex items-center justify-center shrink-0">
                          <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-500/10 animate-ping duration-[1.5s]" />
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-900 border border-purple-500/30 flex items-center justify-center shadow-inner relative">
                            <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400 animate-pulse" />
                          </div>
                        </div>

                        <div className="space-y-1 sm:space-y-2 max-w-sm">
                          <h4 className="font-extrabold text-slate-200 text-sm sm:text-base tracking-tight">Sala de Espera Ativa</h4>
                          <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed px-2">
                            Olá, <strong>{bookingDetails?.clientName || "Paciente"}</strong>! Você se conectou com sucesso. Aguardando a <strong>Dra. Gabriela Santos</strong> iniciar a transmissão ao vivo.
                          </p>
                        </div>

                        {/* Interactive ACT/Mindfulness Breathing Exercise */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 max-w-xs w-full space-y-3 shadow-xl shrink-0">
                          <div className="flex items-center gap-1.5 justify-center text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-wider">
                            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                            Respiração Guiada
                          </div>
                          
                          {breathState === "idle" ? (
                            <div className="space-y-2.5">
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                Sintonize sua atenção plena enquanto aguarda.
                              </p>
                              <button
                                type="button"
                                onClick={() => setBreathState("inhale")}
                                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-500 px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer"
                              >
                                Iniciar Exercício
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3 flex flex-col items-center">
                              {/* Pulsing Breathing Bubble */}
                              <div className="relative flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20">
                                <div 
                                  className={`absolute rounded-full bg-purple-500/10 border border-purple-500/20 transition-all duration-4000 ${
                                    breathState === "inhale" ? "scale-[1.6]" : breathState === "hold" ? "scale-[1.6] bg-purple-500/20" : "scale-[0.8]"
                                  }`} 
                                />
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-600 border border-purple-500 shadow-lg flex items-center justify-center text-white font-extrabold text-[10px] sm:text-xs">
                                  {breathState === "inhale" && "Inspirar"}
                                  {breathState === "hold" && "Segurar"}
                                  {breathState === "exhale" && "Expirar"}
                                </div>
                              </div>

                              <div className="text-center space-y-0.5">
                                <p className="text-[10px] sm:text-xs font-extrabold text-purple-300 capitalize">
                                  {breathState === "inhale" && "Puxe o ar..."}
                                  {breathState === "hold" && "Segure firme..."}
                                  {breathState === "exhale" && "Solte lentamente..."}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setBreathState("idle");
                                  setBreathCycle(0);
                                }}
                                className="text-[9px] text-slate-400 hover:text-slate-200 underline font-semibold transition cursor-pointer"
                              >
                                Parar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status overlay badge */}
                    <div className="absolute bottom-3 left-3 bg-slate-900/85 border border-slate-800 px-2.5 py-1 rounded-xl text-[10px] text-slate-200 font-bold backdrop-blur-sm tracking-wider uppercase z-40">
                      {therapistIsLive ? (isRemoteConnected ? "🔴 PSICÓLOGA (AO VIVO)" : "🔴 PSICÓLOGA") : "⏱️ AGUARDANDO"}
                    </div>
                  </div>

                  {/* 2. Patient Local Video Box - picture in picture on desktop, fluid with aspect-ratio on mobile */}
                  <div className="w-full aspect-[4/3] sm:aspect-video md:absolute md:bottom-4 md:right-4 md:w-56 md:h-32 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden relative flex items-center justify-center shadow-2xl z-20 shrink-0">
                    {!isVideoOff && !streamError ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      streamError ? (
                        <div className="text-center space-y-2.5 py-6 px-4 z-10 flex flex-col items-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-red-400 leading-tight">Acesso Negado</h4>
                            <p className="text-[10px] text-slate-400 max-w-[150px] mx-auto mb-2 leading-tight">
                              Permita a câmera e microfone no navegador.
                            </p>
                            <button
                              onClick={() => requestCameraPermission()}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg transition shadow-md cursor-pointer hover:scale-105 active:scale-95"
                            >
                              Autorizar Aparelho
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-4 space-y-2 text-center">
                          <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center mx-auto shadow-inner">
                            <VideoOff className="w-4.5 h-4.5 text-slate-500" />
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold leading-tight">Sua Câmera Desativada</span>
                        </div>
                      )
                    )}
                    {/* Floating badge */}
                    <div className="absolute bottom-3 left-3 bg-slate-900/85 border border-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-wider backdrop-blur-sm z-10">
                      VOCÊ
                    </div>
                  </div>

                </div>
              </div>

            {/* Sidebar console */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900 flex flex-col h-[450px] md:h-auto md:shrink-0 overflow-hidden">
              
              {/* Tabs selector */}
              <div className="flex border-b border-slate-800 text-xs font-bold text-slate-400">
                <button
                  onClick={() => setActiveSidebar("chat")}
                  className={`flex-1 py-3 border-b-2 text-center transition ${
                    activeSidebar === "chat" ? "border-purple-600 text-purple-400 font-extrabold bg-slate-950/20" : "border-transparent hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    Chat Terapêutico
                  </span>
                </button>
                <button
                  onClick={() => setActiveSidebar("info")}
                  className={`flex-1 py-3 border-b-2 text-center transition ${
                    activeSidebar === "info" ? "border-purple-600 text-purple-400 font-extrabold bg-slate-950/20" : "border-transparent hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Ficha / Detalhes
                  </span>
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {activeSidebar === "chat" ? (
                  <>
                    {/* Chat log list */}
                    <div className="flex-1 space-y-4 pr-1 overflow-y-auto min-h-0">
                      {messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[85%] ${
                            m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                          }`}
                        >
                          <span className="text-[9px] text-slate-400 font-bold mb-1 font-mono">
                            {m.sender === "user" ? "Você" : "Dra. Gabriela"} • {m.time}
                          </span>
                          <div
                            className={`rounded-2xl p-3 text-xs leading-relaxed ${
                              m.sender === "user"
                                ? "bg-purple-600 text-white rounded-tr-none"
                                : "bg-slate-800 text-slate-200 rounded-tl-none"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat send action */}
                    <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 pt-2 border-t border-slate-800 shrink-0">
                      <input
                        type="text"
                        placeholder="Digite sua mensagem reflexiva..."
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
                  /* Info view */
                  <div className="space-y-5 text-xs text-slate-300">
                    <div className="bg-slate-950/40 rounded-xl p-3.5 border border-slate-800/80 space-y-3">
                      <h4 className="font-bold text-slate-100 flex items-center gap-1 text-xs">
                        <Users className="w-4 h-4 text-purple-400" />
                        Paciente Identificado
                      </h4>
                      <div className="space-y-1 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
                        <p className="font-extrabold text-slate-200">{bookingDetails?.clientName}</p>
                        <p className="text-[10px] text-slate-400">{bookingDetails?.clientEmail}</p>
                        <p className="text-[10px] text-slate-400">{bookingDetails?.clientPhone}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 rounded-xl p-3.5 border border-slate-800/80 space-y-3">
                      <h4 className="font-bold text-slate-100 flex items-center gap-1 text-xs">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Abordagem Psicoterapêutica
                      </h4>
                      <p className="text-[11px] text-purple-200 font-bold bg-purple-950/50 border border-purple-900 px-2 py-1 rounded">
                        {bookingDetails?.approach}
                      </p>
                    </div>

                    <div className="bg-slate-950/40 rounded-xl p-3.5 border border-slate-800/80 space-y-2.5 text-[11px] text-slate-400 leading-relaxed">
                      <span className="font-bold text-slate-200 flex items-center gap-1 mb-1">
                        <Shield className="w-4 h-4 text-green-500" />
                        Diretrizes de Segurança
                      </span>
                      <p>🔒 Transmissão direta criptografada ponta a ponta.</p>
                      <p>👥 Apenas você e a psicóloga têm acesso a este canal.</p>
                      <p>📵 Nenhum registro de áudio ou vídeo é guardado em nossos servidores para proteger sua confidencialidade.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Bottom Video Room Control Actions */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 md:px-6 py-3.5 md:py-4 flex items-center justify-between z-10 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Camera className="w-4 h-4 text-slate-500" />
              Webcam padrão selecionada
            </div>

            {/* Main Action buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 mx-auto sm:mx-0">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition border cursor-pointer ${
                  isMuted
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-lg shadow-rose-600/10"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isMuted ? "Ativar Microfone" : "Mutar Microfone"}
              >
                {isMuted ? <MicOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition border cursor-pointer ${
                  isVideoOff
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-lg shadow-rose-600/10"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isVideoOff ? "Ligar Câmera" : "Desligar Câmera"}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Video className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
              </button>

              <button
                onClick={() => {
                  setIsScreenSharing(!isScreenSharing);
                  if (!isScreenSharing) {
                    alert("Apresentação de tela simulada com sucesso! Os outros participantes agora veriam seu compartilhamento.");
                  }
                }}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition border cursor-pointer ${
                  isScreenSharing
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title="Compartilhar Tela"
              >
                <Laptop className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              <div className="h-6 w-[1px] bg-slate-800 mx-1" />

              <button
                onClick={handleEndCall}
                className="bg-rose-600 hover:bg-rose-700 hover:scale-105 active:scale-95 text-white font-sans font-bold text-[11px] sm:text-xs px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border border-rose-500 whitespace-nowrap"
              >
                <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Desconectar
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-850 text-xs font-mono text-purple-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              128-bit AES
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
