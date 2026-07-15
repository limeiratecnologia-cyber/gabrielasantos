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

// Clinic Info Helpers
export async function getClinicInfoFromDb(): Promise<any> {
  try {
    const docRef = doc(db, "clinic_info", "main");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Seed initial clinic info to database
      await setDoc(docRef, CLINIC_INFO);
      return CLINIC_INFO;
    }
  } catch (error) {
    console.error("Error fetching clinic info from Firestore:", error);
    // Fallback to localStorage or default static info
    const saved = localStorage.getItem("serenamente_clinic_info");
    return saved ? JSON.parse(saved) : CLINIC_INFO;
  }
}

export async function saveClinicInfoToDb(info: any): Promise<void> {
  try {
    const docRef = doc(db, "clinic_info", "main");
    await setDoc(docRef, info, { merge: true });
    // Also update local cache
    localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
  } catch (error) {
    console.error("Error saving clinic info to Firestore:", error);
    // Fallback save to localStorage
    localStorage.setItem("serenamente_clinic_info", JSON.stringify(info));
  }
}

// Booking Helpers
export async function getBookingsFromDb(): Promise<Booking[]> {
  try {
    const q = query(collection(db, "bookings"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    const firestoreBookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      firestoreBookings.push({ id: doc.id, ...doc.data() } as Booking);
    });

    const saved = localStorage.getItem("serenamente_bookings");
    const localBookings: Booking[] = saved ? JSON.parse(saved) : [];

    const mergedMap = new Map<string, Booking>();
    
    localBookings.forEach(b => {
      if (b && b.id) mergedMap.set(b.id, b);
    });
    
    firestoreBookings.forEach(b => {
      if (b && b.id) mergedMap.set(b.id, b);
    });

    const mergedList = Array.from(mergedMap.values());

    for (const b of mergedList) {
      const existsInFirestore = firestoreBookings.some(fb => fb.id === b.id);
      if (!existsInFirestore) {
        const docRef = doc(db, "bookings", b.id);
        await setDoc(docRef, b, { merge: true }).catch(console.error);
      }
    }

    localStorage.setItem("serenamente_bookings", JSON.stringify(mergedList));
    return mergedList;
  } catch (error) {
    console.error("Error fetching bookings from Firestore:", error);
    const saved = localStorage.getItem("serenamente_bookings");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveBookingToDb(booking: Booking): Promise<void> {
  try {
    const docRef = doc(db, "bookings", booking.id);
    await setDoc(docRef, booking);
    
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
    console.error("Error saving booking to Firestore:", error);
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

    // Update local cache
    const saved = localStorage.getItem("serenamente_bookings");
    if (saved) {
      const currentList: Booking[] = JSON.parse(saved);
      const filtered = currentList.filter(b => b.id !== id);
      localStorage.setItem("serenamente_bookings", JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error deleting booking from Firestore:", error);
    // Update local cache
    const saved = localStorage.getItem("serenamente_bookings");
    if (saved) {
      const currentList: Booking[] = JSON.parse(saved);
      const filtered = currentList.filter(b => b.id !== id);
      localStorage.setItem("serenamente_bookings", JSON.stringify(filtered));
    }
  }
}

// Therapeutic Approaches Helpers
export async function getApproachesFromDb(): Promise<Approach[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "approaches"));
    const approaches: Approach[] = [];
    querySnapshot.forEach((doc) => {
      approaches.push({ id: doc.id, ...doc.data() } as Approach);
    });

    if (approaches.length > 0) {
      // Sort to preserve default array ordering if needed
      // Also update local cache
      localStorage.setItem("serenamente_approaches", JSON.stringify(approaches));
      return approaches;
    } else {
      // Seed with default APPROACHES from data.ts
      for (const app of APPROACHES) {
        const docRef = doc(db, "approaches", app.id);
        await setDoc(docRef, app);
      }
      localStorage.setItem("serenamente_approaches", JSON.stringify(APPROACHES));
      return APPROACHES;
    }
  } catch (error) {
    console.error("Error fetching approaches from Firestore:", error);
    const saved = localStorage.getItem("serenamente_approaches");
    return saved ? JSON.parse(saved) : APPROACHES;
  }
}

export async function saveApproachToDb(approach: Approach): Promise<void> {
  try {
    const docRef = doc(db, "approaches", approach.id);
    await setDoc(docRef, approach);

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
    console.error("Error saving approach to Firestore:", error);
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

    // Update local cache
    const saved = localStorage.getItem("serenamente_approaches");
    if (saved) {
      const currentList: Approach[] = JSON.parse(saved);
      const filtered = currentList.filter(a => a.id !== id);
      localStorage.setItem("serenamente_approaches", JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error deleting approach from Firestore:", error);
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

    const saved = localStorage.getItem("serenamente_patients");
    const localPatients: Patient[] = saved ? JSON.parse(saved) : [];

    const mergedPatientsMap = new Map<string, Patient>();
    
    // Seed with local patients first
    localPatients.forEach(p => {
      if (p && p.id) mergedPatientsMap.set(p.id, p);
    });
    
    // Firestore takes priority and overrides local
    firestorePatients.forEach(p => {
      if (p && p.id) mergedPatientsMap.set(p.id, p);
    });

    const mergedPatients = Array.from(mergedPatientsMap.values());

    // Upload local-only patients to Firestore in background
    for (const p of mergedPatients) {
      const existsInFirestore = firestorePatients.some(fp => fp.id === p.id);
      if (!existsInFirestore) {
        const docRef = doc(db, "patients", p.id);
        await setDoc(docRef, p, { merge: true }).catch(console.error);
      }
    }

    localStorage.setItem("serenamente_patients", JSON.stringify(mergedPatients));
    return mergedPatients;
  } catch (error) {
    console.error("Error fetching patients from Firestore:", error);
    const saved = localStorage.getItem("serenamente_patients");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function savePatientToDb(patient: Patient): Promise<void> {
  try {
    const docRef = doc(db, "patients", patient.id);
    await setDoc(docRef, patient, { merge: true });

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
    console.error("Error saving patient to Firestore:", error);
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

    // Update local cache
    const saved = localStorage.getItem("serenamente_patients");
    if (saved) {
      const currentList: Patient[] = JSON.parse(saved);
      const filtered = currentList.filter(p => p.id !== id);
      localStorage.setItem("serenamente_patients", JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error deleting patient from Firestore:", error);
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

    const saved = localStorage.getItem("serenamente_evolutions");
    const localEvolutions: ClinicalEvolution[] = saved ? JSON.parse(saved) : [];

    const mergedMap = new Map<string, ClinicalEvolution>();
    
    localEvolutions.forEach(e => {
      if (e && e.id) mergedMap.set(e.id, e);
    });
    
    firestoreEvolutions.forEach(e => {
      if (e && e.id) mergedMap.set(e.id, e);
    });

    const mergedList = Array.from(mergedMap.values());

    for (const e of mergedList) {
      const existsInFirestore = firestoreEvolutions.some(fe => fe.id === e.id);
      if (!existsInFirestore) {
        const docRef = doc(db, "evolutions", e.id);
        await setDoc(docRef, e, { merge: true }).catch(console.error);
      }
    }

    localStorage.setItem("serenamente_evolutions", JSON.stringify(mergedList));
    return mergedList;
  } catch (error) {
    console.error("Error fetching evolutions from Firestore:", error);
    const saved = localStorage.getItem("serenamente_evolutions");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveEvolutionToDb(evolution: ClinicalEvolution): Promise<void> {
  try {
    const docRef = doc(db, "evolutions", evolution.id);
    await setDoc(docRef, evolution, { merge: true });

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
    console.error("Error saving evolution to Firestore:", error);
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

    // Update local cache
    const saved = localStorage.getItem("serenamente_evolutions");
    if (saved) {
      const currentList: ClinicalEvolution[] = JSON.parse(saved);
      const filtered = currentList.filter(e => e.id !== id);
      localStorage.setItem("serenamente_evolutions", JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error deleting evolution from Firestore:", error);
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

    const saved = localStorage.getItem("serenamente_helppsi");
    const localEmergencies: HelpPsiEmergency[] = saved ? JSON.parse(saved) : [];

    const mergedMap = new Map<string, HelpPsiEmergency>();
    
    localEmergencies.forEach(e => {
      if (e && e.id) mergedMap.set(e.id, e);
    });
    
    firestoreEmergencies.forEach(e => {
      if (e && e.id) mergedMap.set(e.id, e);
    });

    const mergedList = Array.from(mergedMap.values());

    for (const e of mergedList) {
      const existsInFirestore = firestoreEmergencies.some(fe => fe.id === e.id);
      if (!existsInFirestore) {
        const docRef = doc(db, "helppsi_emergencies", e.id);
        await setDoc(docRef, e, { merge: true }).catch(console.error);
      }
    }

    mergedList.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem("serenamente_helppsi", JSON.stringify(mergedList));
    return mergedList;
  } catch (error) {
    console.error("Error fetching HelpPsi emergencies:", error);
    const saved = localStorage.getItem("serenamente_helppsi");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveHelpPsiEmergencyToDb(emergency: HelpPsiEmergency): Promise<void> {
  try {
    const docRef = doc(db, "helppsi_emergencies", emergency.id);
    await setDoc(docRef, emergency, { merge: true });

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
    console.error("Error saving HelpPsi emergency:", error);
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

    // Cache update
    const saved = localStorage.getItem("serenamente_helppsi");
    if (saved) {
      const currentList: HelpPsiEmergency[] = JSON.parse(saved);
      const filtered = currentList.filter(e => e.id !== id);
      localStorage.setItem("serenamente_helppsi", JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error deleting HelpPsi emergency:", error);
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

    const saved = localStorage.getItem("serenamente_planned_sessions");
    const localSessions: PlannedSession[] = saved ? JSON.parse(saved) : [];

    const mergedMap = new Map<string, PlannedSession>();
    
    localSessions.forEach(s => {
      if (s && s.id) mergedMap.set(s.id, s);
    });
    
    firestoreSessions.forEach(s => {
      if (s && s.id) mergedMap.set(s.id, s);
    });

    const mergedList = Array.from(mergedMap.values());

    for (const s of mergedList) {
      const existsInFirestore = firestoreSessions.some(fs => fs.id === s.id);
      if (!existsInFirestore) {
        const docRef = doc(db, "planned_sessions", s.id);
        await setDoc(docRef, s, { merge: true }).catch(console.error);
      }
    }

    localStorage.setItem("serenamente_planned_sessions", JSON.stringify(mergedList));
    return mergedList;
  } catch (error) {
    console.error("Error fetching planned sessions:", error);
    const saved = localStorage.getItem("serenamente_planned_sessions");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function savePlannedSessionToDb(session: PlannedSession): Promise<void> {
  try {
    const docRef = doc(db, "planned_sessions", session.id);
    await setDoc(docRef, session, { merge: true });

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
    console.error("Error saving planned session:", error);
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

    // Cache update
    const saved = localStorage.getItem("serenamente_planned_sessions");
    if (saved) {
      const currentList: PlannedSession[] = JSON.parse(saved);
      const filtered = currentList.filter(s => s.id !== id);
      localStorage.setItem("serenamente_planned_sessions", JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error deleting planned session:", error);
    const saved = localStorage.getItem("serenamente_planned_sessions");
    if (saved) {
      const currentList: PlannedSession[] = JSON.parse(saved);
      const filtered = currentList.filter(s => s.id !== id);
      localStorage.setItem("serenamente_planned_sessions", JSON.stringify(filtered));
    }
  }
}

