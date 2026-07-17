import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query,
  orderBy 
} from "firebase/firestore";
import { Booking, Approach, Patient, ClinicalEvolution, HelpPsiEmergency, PlannedSession } from "../types";
import { CLINIC_INFO, APPROACHES } from "../data";

// ==========================================================================
// DB OPERATION DIAGNOSTICS & TELEMETRY
// ==========================================================================
export interface DiagnosticLog {
  timestamp: string;
  operation: string;
  status: "success" | "error";
  details?: any;
  error?: string;
  env: {
    userAgent: string;
    isOnline: boolean;
    localStorageAvailable: boolean;
    platform: string;
  };
}

const MAX_DIAGNOSTIC_LOGS = 100;

function logDbOperation(operation: string, status: "success" | "error", details?: any, err?: any) {
  const envInfo = {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    localStorageAvailable: (() => {
      try {
        if (typeof localStorage === "undefined") return false;
        localStorage.setItem("__db_test__", "1");
        localStorage.removeItem("__db_test__");
        return true;
      } catch (e) {
        return false;
      }
    })(),
    platform: typeof navigator !== "undefined" ? (navigator.platform || "") : "Unknown"
  };

  const logEntry: DiagnosticLog = {
    timestamp: new Date().toISOString(),
    operation,
    status,
    details: details ? JSON.parse(JSON.stringify(details)) : undefined,
    error: err ? (err.message || String(err)) : undefined,
    env: envInfo
  };

  // Colorful logs to console for browser & mobile remote debugging
  const color = status === "success" ? "#10B981" : "#EF4444";
  console.log(
    `%c[Firestore DB] %c${operation} -> ${status.toUpperCase()}`,
    `color: ${color}; font-weight: bold; font-size: 11px;`,
    "color: inherit;",
    { details, error: err, env: envInfo }
  );

  try {
    if (typeof localStorage !== "undefined") {
      const existing = localStorage.getItem("serenamente_db_logs");
      const logs: DiagnosticLog[] = existing ? JSON.parse(existing) : [];
      logs.unshift(logEntry);
      if (logs.length > MAX_DIAGNOSTIC_LOGS) {
        logs.pop();
      }
      localStorage.setItem("serenamente_db_logs", JSON.stringify(logs));
    }
  } catch (e) {
    console.warn("[Firestore DB] Cache save for logs failed:", e);
  }
}

export function getDbDiagnosticLogs(): DiagnosticLog[] {
  try {
    if (typeof localStorage !== "undefined") {
      const existing = localStorage.getItem("serenamente_db_logs");
      return existing ? JSON.parse(existing) : [];
    }
  } catch (e) {}
  return [];
}

export function clearDbDiagnosticLogs(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("serenamente_db_logs");
    }
  } catch (e) {}
}

// ==========================================================================
// Clinic Info Helpers
// ==========================================================================
export async function getClinicInfoFromDb(): Promise<any> {
  try {
    const docRef = doc(db, "clinic_info", "main");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      logDbOperation("getClinicInfoFromDb", "success", { source: "firestore", data });
      return data;
    } else {
      // Seed initial clinic info to database
      await setDoc(docRef, CLINIC_INFO);
      logDbOperation("getClinicInfoFromDb", "success", { source: "firestore-seeded", data: CLINIC_INFO });
      return CLINIC_INFO;
    }
  } catch (error) {
    logDbOperation("getClinicInfoFromDb", "error", null, error);
    // Fallback to localStorage or default static info
    const saved = localStorage.getItem("serenamente_clinic_info");
    return saved ? JSON.parse(saved) : CLINIC_INFO;
  }
}

export async function saveClinicInfoToDb(info: any): Promise<void> {
  try {
    const docRef = doc(db, "clinic_info", "main");
    await setDoc(docRef, info, { merge: true });
    logDbOperation("saveClinicInfoToDb", "success", { info });
    // Also update local cache
    localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
  } catch (error) {
    logDbOperation("saveClinicInfoToDb", "error", { info }, error);
    // Fallback save to localStorage
    localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
  }
}

// ==========================================================================
// Booking Helpers
// ==========================================================================
export async function getBookingsFromDb(): Promise<Booking[]> {
  try {
    const q = query(collection(db, "bookings"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    const firestoreBookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      firestoreBookings.push({ id: doc.id, ...doc.data() } as Booking);
    });

    logDbOperation("getBookingsFromDb", "success", { count: firestoreBookings.length });
    localStorage.setItem("serenamente_bookings", JSON.stringify(firestoreBookings));
    return firestoreBookings;
  } catch (error) {
    logDbOperation("getBookingsFromDb", "error", null, error);
    const saved = localStorage.getItem("serenamente_bookings");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveBookingToDb(booking: Booking): Promise<void> {
  try {
    const docRef = doc(db, "bookings", booking.id);
    await setDoc(docRef, booking);
    logDbOperation("saveBookingToDb", "success", { bookingId: booking.id, booking });
    
    // Update local cache
    const saved = localStorage.getItem("serenamente_bookings");
    const currentList: Booking[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(b => b.id === booking.id);
    if (index >= 0) {
      currentList[index] = booking;
    } else {
      currentList.push(booking);
    }
    localStorage.setItem("serenamente_bookings", JSON.stringify(currentList));
  } catch (error) {
    logDbOperation("saveBookingToDb", "error", { bookingId: booking.id, booking }, error);
    // Save locally
    const saved = localStorage.getItem("serenamente_bookings");
    const currentList: Booking[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(b => b.id === booking.id);
    if (index >= 0) {
      currentList[index] = booking;
    } else {
      currentList.push(booking);
    }
    localStorage.setItem("serenamente_bookings", JSON.stringify(currentList));
  }
}

export async function deleteBookingFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, "bookings", id);
    await deleteDoc(docRef);
    logDbOperation("deleteBookingFromDb", "success", { id });

    // Update local cache
    const saved = localStorage.getItem("serenamente_bookings");
    if (saved) {
      const currentList: Booking[] = JSON.parse(saved);
      const filtered = currentList.filter(b => b.id !== id);
      localStorage.setItem("serenamente_bookings", JSON.stringify(filtered));
    }
  } catch (error) {
    logDbOperation("deleteBookingFromDb", "error", { id }, error);
    // Update local cache
    const saved = localStorage.getItem("serenamente_bookings");
    if (saved) {
      const currentList: Booking[] = JSON.parse(saved);
      const filtered = currentList.filter(b => b.id !== id);
      localStorage.setItem("serenamente_bookings", JSON.stringify(filtered));
    }
  }
}

// ==========================================================================
// Therapeutic Approaches Helpers
// ==========================================================================
export async function getApproachesFromDb(): Promise<Approach[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "approaches"));
    const approaches: Approach[] = [];
    querySnapshot.forEach((doc) => {
      approaches.push({ id: doc.id, ...doc.data() } as Approach);
    });

    if (approaches.length > 0) {
      logDbOperation("getApproachesFromDb", "success", { count: approaches.length });
      localStorage.setItem("serenamente_approaches", JSON.stringify(approaches));
      return approaches;
    } else {
      // Seed with default APPROACHES from data.ts
      for (const app of APPROACHES) {
        const docRef = doc(db, "approaches", app.id);
        await setDoc(docRef, app);
      }
      logDbOperation("getApproachesFromDb", "success", { source: "seeded", count: APPROACHES.length });
      localStorage.setItem("serenamente_approaches", JSON.stringify(APPROACHES));
      return APPROACHES;
    }
  } catch (error) {
    logDbOperation("getApproachesFromDb", "error", null, error);
    const saved = localStorage.getItem("serenamente_approaches");
    return saved ? JSON.parse(saved) : APPROACHES;
  }
}

export async function saveApproachToDb(approach: Approach): Promise<void> {
  try {
    const docRef = doc(db, "approaches", approach.id);
    await setDoc(docRef, approach);
    logDbOperation("saveApproachToDb", "success", { approachId: approach.id, approach });

    // Update local cache
    const saved = localStorage.getItem("serenamente_approaches");
    const currentList: Approach[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(a => a.id === approach.id);
    if (index >= 0) {
      currentList[index] = approach;
    } else {
      currentList.push(approach);
    }
    localStorage.setItem("serenamente_approaches", JSON.stringify(currentList));
  } catch (error) {
    logDbOperation("saveApproachToDb", "error", { approachId: approach.id, approach }, error);
    // Save locally
    const saved = localStorage.getItem("serenamente_approaches");
    const currentList: Approach[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(a => a.id === approach.id);
    if (index >= 0) {
      currentList[index] = approach;
    } else {
      currentList.push(approach);
    }
    localStorage.setItem("serenamente_approaches", JSON.stringify(currentList));
  }
}

export async function deleteApproachFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, "approaches", id);
    await deleteDoc(docRef);
    logDbOperation("deleteApproachFromDb", "success", { id });

    // Update local cache
    const saved = localStorage.getItem("serenamente_approaches");
    if (saved) {
      const currentList: Approach[] = JSON.parse(saved);
      const filtered = currentList.filter(a => a.id !== id);
      localStorage.setItem("serenamente_approaches", JSON.stringify(filtered));
    }
  } catch (error) {
    logDbOperation("deleteApproachFromDb", "error", { id }, error);
    // Update local cache
    const saved = localStorage.getItem("serenamente_approaches");
    if (saved) {
      const currentList: Approach[] = JSON.parse(saved);
      const filtered = currentList.filter(a => a.id !== id);
      localStorage.setItem("serenamente_approaches", JSON.stringify(filtered));
    }
  }
}

// ==========================================================================
// Patient Database Helpers
// ==========================================================================
export async function getPatientsFromDb(): Promise<Patient[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "patients"));
    const firestorePatients: Patient[] = [];
    querySnapshot.forEach((doc) => {
      firestorePatients.push({ id: doc.id, ...doc.data() } as Patient);
    });

    logDbOperation("getPatientsFromDb", "success", { count: firestorePatients.length });
    localStorage.setItem("serenamente_patients", JSON.stringify(firestorePatients));
    return firestorePatients;
  } catch (error) {
    logDbOperation("getPatientsFromDb", "error", null, error);
    const saved = localStorage.getItem("serenamente_patients");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function savePatientToDb(patient: Patient): Promise<void> {
  try {
    const docRef = doc(db, "patients", patient.id);
    await setDoc(docRef, patient, { merge: true });
    logDbOperation("savePatientToDb", "success", { patientId: patient.id, patient });

    // Update local cache
    const saved = localStorage.getItem("serenamente_patients");
    const currentList: Patient[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(p => p.id === patient.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...patient };
    } else {
      currentList.push(patient);
    }
    localStorage.setItem("serenamente_patients", JSON.stringify(currentList));
  } catch (error) {
    logDbOperation("savePatientToDb", "error", { patientId: patient.id, patient }, error);
    const saved = localStorage.getItem("serenamente_patients");
    const currentList: Patient[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(p => p.id === patient.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...patient };
    } else {
      currentList.push(patient);
    }
    localStorage.setItem("serenamente_patients", JSON.stringify(currentList));
  }
}

export async function deletePatientFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, "patients", id);
    await deleteDoc(docRef);
    logDbOperation("deletePatientFromDb", "success", { id });

    // Update local cache
    const saved = localStorage.getItem("serenamente_patients");
    if (saved) {
      const currentList: Patient[] = JSON.parse(saved);
      const filtered = currentList.filter(p => p.id !== id);
      localStorage.setItem("serenamente_patients", JSON.stringify(filtered));
    }
  } catch (error) {
    logDbOperation("deletePatientFromDb", "error", { id }, error);
    const saved = localStorage.getItem("serenamente_patients");
    if (saved) {
      const currentList: Patient[] = JSON.parse(saved);
      const filtered = currentList.filter(p => p.id !== id);
      localStorage.setItem("serenamente_patients", JSON.stringify(filtered));
    }
  }
}

// ==========================================================================
// Clinical Evolutions Helpers
// ==========================================================================
export async function getEvolutionsFromDb(): Promise<ClinicalEvolution[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "evolutions"));
    const firestoreEvolutions: ClinicalEvolution[] = [];
    querySnapshot.forEach((doc) => {
      firestoreEvolutions.push({ id: doc.id, ...doc.data() } as ClinicalEvolution);
    });

    logDbOperation("getEvolutionsFromDb", "success", { count: firestoreEvolutions.length });
    localStorage.setItem("serenamente_evolutions", JSON.stringify(firestoreEvolutions));
    return firestoreEvolutions;
  } catch (error) {
    logDbOperation("getEvolutionsFromDb", "error", null, error);
    const saved = localStorage.getItem("serenamente_evolutions");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveEvolutionToDb(evolution: ClinicalEvolution): Promise<void> {
  try {
    const docRef = doc(db, "evolutions", evolution.id);
    await setDoc(docRef, evolution, { merge: true });
    logDbOperation("saveEvolutionToDb", "success", { evolutionId: evolution.id, evolution });

    // Update local cache
    const saved = localStorage.getItem("serenamente_evolutions");
    const currentList: ClinicalEvolution[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(e => e.id === evolution.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...evolution };
    } else {
      currentList.push(evolution);
    }
    localStorage.setItem("serenamente_evolutions", JSON.stringify(currentList));
  } catch (error) {
    logDbOperation("saveEvolutionToDb", "error", { evolutionId: evolution.id, evolution }, error);
    const saved = localStorage.getItem("serenamente_evolutions");
    const currentList: ClinicalEvolution[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(e => e.id === evolution.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...evolution };
    } else {
      currentList.push(evolution);
    }
    localStorage.setItem("serenamente_evolutions", JSON.stringify(currentList));
  }
}

export async function deleteEvolutionFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, "evolutions", id);
    await deleteDoc(docRef);
    logDbOperation("deleteEvolutionFromDb", "success", { id });

    // Update local cache
    const saved = localStorage.getItem("serenamente_evolutions");
    if (saved) {
      const currentList: ClinicalEvolution[] = JSON.parse(saved);
      const filtered = currentList.filter(e => e.id !== id);
      localStorage.setItem("serenamente_evolutions", JSON.stringify(filtered));
    }
  } catch (error) {
    logDbOperation("deleteEvolutionFromDb", "error", { id }, error);
    const saved = localStorage.getItem("serenamente_evolutions");
    if (saved) {
      const currentList: ClinicalEvolution[] = JSON.parse(saved);
      const filtered = currentList.filter(e => e.id !== id);
      localStorage.setItem("serenamente_evolutions", JSON.stringify(filtered));
    }
  }
}

// ==========================================================================
// HelpPsi Emergencies Database Helpers
// ==========================================================================
export async function getHelpPsiEmergenciesFromDb(): Promise<HelpPsiEmergency[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "helppsi_emergencies"));
    const firestoreEmergencies: HelpPsiEmergency[] = [];
    querySnapshot.forEach((doc) => {
      firestoreEmergencies.push({ id: doc.id, ...doc.data() } as HelpPsiEmergency);
    });

    firestoreEmergencies.sort((a, b) => b.timestamp - a.timestamp);
    logDbOperation("getHelpPsiEmergenciesFromDb", "success", { count: firestoreEmergencies.length });
    localStorage.setItem("serenamente_helppsi", JSON.stringify(firestoreEmergencies));
    return firestoreEmergencies;
  } catch (error) {
    logDbOperation("getHelpPsiEmergenciesFromDb", "error", null, error);
    const saved = localStorage.getItem("serenamente_helppsi");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveHelpPsiEmergencyToDb(emergency: HelpPsiEmergency): Promise<void> {
  try {
    const docRef = doc(db, "helppsi_emergencies", emergency.id);
    await setDoc(docRef, emergency, { merge: true });
    logDbOperation("saveHelpPsiEmergencyToDb", "success", { emergencyId: emergency.id, emergency });

    // Cache locally
    const saved = localStorage.getItem("serenamente_helppsi");
    const currentList: HelpPsiEmergency[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(e => e.id === emergency.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...emergency };
    } else {
      currentList.push(emergency);
    }
    currentList.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem("serenamente_helppsi", JSON.stringify(currentList));
  } catch (error) {
    logDbOperation("saveHelpPsiEmergencyToDb", "error", { emergencyId: emergency.id, emergency }, error);
    const saved = localStorage.getItem("serenamente_helppsi");
    const currentList: HelpPsiEmergency[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(e => e.id === emergency.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...emergency };
    } else {
      currentList.push(emergency);
    }
    currentList.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem("serenamente_helppsi", JSON.stringify(currentList));
  }
}

export async function deleteHelpPsiEmergencyFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, "helppsi_emergencies", id);
    await deleteDoc(docRef);
    logDbOperation("deleteHelpPsiEmergencyFromDb", "success", { id });

    // Cache update
    const saved = localStorage.getItem("serenamente_helppsi");
    if (saved) {
      const currentList: HelpPsiEmergency[] = JSON.parse(saved);
      const filtered = currentList.filter(e => e.id !== id);
      localStorage.setItem("serenamente_helppsi", JSON.stringify(filtered));
    }
  } catch (error) {
    logDbOperation("deleteHelpPsiEmergencyFromDb", "error", { id }, error);
    const saved = localStorage.getItem("serenamente_helppsi");
    if (saved) {
      const currentList: HelpPsiEmergency[] = JSON.parse(saved);
      const filtered = currentList.filter(e => e.id !== id);
      localStorage.setItem("serenamente_helppsi", JSON.stringify(filtered));
    }
  }
}

// ==========================================================================
// Planned Sessions (Treatment Chronogram) Database Helpers
// ==========================================================================
export async function getPlannedSessionsFromDb(): Promise<PlannedSession[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "planned_sessions"));
    const firestoreSessions: PlannedSession[] = [];
    querySnapshot.forEach((doc) => {
      firestoreSessions.push({ id: doc.id, ...doc.data() } as PlannedSession);
    });

    logDbOperation("getPlannedSessionsFromDb", "success", { count: firestoreSessions.length });
    localStorage.setItem("serenamente_planned_sessions", JSON.stringify(firestoreSessions));
    return firestoreSessions;
  } catch (error) {
    logDbOperation("getPlannedSessionsFromDb", "error", null, error);
    const saved = localStorage.getItem("serenamente_planned_sessions");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function savePlannedSessionToDb(session: PlannedSession): Promise<void> {
  try {
    const docRef = doc(db, "planned_sessions", session.id);
    await setDoc(docRef, session, { merge: true });
    logDbOperation("savePlannedSessionToDb", "success", { sessionId: session.id, session });

    // Update local cache
    const saved = localStorage.getItem("serenamente_planned_sessions");
    const currentList: PlannedSession[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(s => s.id === session.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...session };
    } else {
      currentList.push(session);
    }
    localStorage.setItem("serenamente_planned_sessions", JSON.stringify(currentList));
  } catch (error) {
    logDbOperation("savePlannedSessionToDb", "error", { sessionId: session.id, session }, error);
    const saved = localStorage.getItem("serenamente_planned_sessions");
    const currentList: PlannedSession[] = saved ? JSON.parse(saved) : [];
    const index = currentList.findIndex(s => s.id === session.id);
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...session };
    } else {
      currentList.push(session);
    }
    localStorage.setItem("serenamente_planned_sessions", JSON.stringify(currentList));
  }
}

export async function deletePlannedSessionFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, "planned_sessions", id);
    await deleteDoc(docRef);
    logDbOperation("deletePlannedSessionFromDb", "success", { id });

    // Cache update
    const saved = localStorage.getItem("serenamente_planned_sessions");
    if (saved) {
      const currentList: PlannedSession[] = JSON.parse(saved);
      const filtered = currentList.filter(s => s.id !== id);
      localStorage.setItem("serenamente_planned_sessions", JSON.stringify(filtered));
    }
  } catch (error) {
    logDbOperation("deletePlannedSessionFromDb", "error", { id }, error);
    const saved = localStorage.getItem("serenamente_planned_sessions");
    if (saved) {
      const currentList: PlannedSession[] = JSON.parse(saved);
      const filtered = currentList.filter(s => s.id !== id);
      localStorage.setItem("serenamente_planned_sessions", JSON.stringify(filtered));
    }
  }
}
