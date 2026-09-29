import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from '../lib/firebase';
import { 
  INITIAL_INCIDENTS, 
  INITIAL_MEMORIES, 
  INITIAL_RUNBOOKS, 
  INITIAL_POSTMORTEMS, 
  INITIAL_DEPLOYMENTS, 
  INITIAL_SERVICES 
} from './seedData';

const STORAGE_KEYS = {
  INCIDENTS: 'oryn_local_incidents',
  MEMORIES: 'oryn_local_memories',
  RUNBOOKS: 'oryn_local_runbooks',
  POSTMORTEMS: 'oryn_local_postmortems',
  DEPLOYMENTS: 'oryn_local_deployments',
  SERVICES: 'oryn_local_services',
  SEEDED: 'oryn_db_seeded_v1'
};

// Helper to get local fallback
function getLocal(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn("Storage quota exceeded or unavailable:", e);
  }
}

/**
 * Automatically seeds the database on first launch.
 */
export async function seedDatabaseIfEmpty() {
  const isAlreadySeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
  if (isAlreadySeeded) return;

  console.log("Initializing ORYN Enterprise collections and seed data...");

  // Seed local storage baseline
  setLocal(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
  setLocal(STORAGE_KEYS.MEMORIES, INITIAL_MEMORIES);
  setLocal(STORAGE_KEYS.RUNBOOKS, INITIAL_RUNBOOKS);
  setLocal(STORAGE_KEYS.POSTMORTEMS, INITIAL_POSTMORTEMS);
  setLocal(STORAGE_KEYS.DEPLOYMENTS, INITIAL_DEPLOYMENTS);
  setLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);

  // Attempt Firestore seeding if online and authorized
  try {
    const incidentsRef = collection(db, 'incidents');
    const snap = await getDocs(query(incidentsRef, limit(1)));
    
    if (snap.empty) {
      console.log("Seeding Firestore with 25 production incidents...");
      // Seed first 10 immediately to avoid batch throttling
      const batchList = INITIAL_INCIDENTS.slice(0, 10);
      for (const inc of batchList) {
        await setDoc(doc(db, 'incidents', inc.id), inc);
      }
      for (const mem of INITIAL_MEMORIES.slice(0, 6)) {
        await setDoc(doc(db, 'memories', mem.id), mem);
      }
      for (const rb of INITIAL_RUNBOOKS) {
        await setDoc(doc(db, 'runbooks', rb.id), rb);
      }
      for (const pm of INITIAL_POSTMORTEMS) {
        await setDoc(doc(db, 'postmortems', pm.id), pm);
      }
      for (const dep of INITIAL_DEPLOYMENTS) {
        await setDoc(doc(db, 'deployments', dep.id), dep);
      }
      for (const svc of INITIAL_SERVICES) {
        await setDoc(doc(db, 'serviceHealth', svc.id), svc);
      }
    }
  } catch (err) {
    console.info("Firestore seed skipped (using secure local replica):", err.message);
  } finally {
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }
}

// Helper for real-time reactivity across components
function broadcastUpdate(event, data) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

// ================= INCIDENTS =================

export async function getIncidents() {
  try {
    const snap = await getDocs(query(collection(db, 'incidents'), orderBy('createdAt', 'desc')));
    if (!snap.empty) {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLocal(STORAGE_KEYS.INCIDENTS, data);
      return data;
    }
  } catch (e) {
    // Firestore error or unauthenticated, fallback to local replica
  }
  return getLocal(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
}

export function subscribeIncidents(callback) {
  // Immediately return fast local data
  callback(getLocal(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS));

  const handleUpdate = (e) => {
    if (e.detail) {
      callback(e.detail);
    } else {
      callback(getLocal(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS));
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('oryn_incidents_updated', handleUpdate);
  }

  let unsubscribe = () => {};
  try {
    unsubscribe = onSnapshot(
      query(collection(db, 'incidents'), orderBy('createdAt', 'desc')), 
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setLocal(STORAGE_KEYS.INCIDENTS, data);
          callback(data);
        }
      },
      () => {
        // Silently preserve local data if Firestore is unprovisioned
      }
    );
  } catch (e) {}

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('oryn_incidents_updated', handleUpdate);
    }
    unsubscribe();
  };
}

export async function createIncident(incidentData) {
  const newId = `inc-${Math.floor(4100 + Math.random() * 900)}`;
  const record = {
    id: newId,
    title: incidentData.title || 'Untitled Incident',
    service: incidentData.service || 'Infrastructure',
    severity: incidentData.severity || 'SEV-1',
    environment: incidentData.environment || 'production-us-east',
    rawLogs: incidentData.rawLogs || '',
    sanitizedLogs: incidentData.sanitizedLogs || incidentData.rawLogs || '',
    rootCause: incidentData.rootCause || 'Under investigation by SRE team.',
    errorSignature: incidentData.errorSignature || 'UNKNOWN_ANOMALY',
    confidenceScore: typeof incidentData.confidenceScore === 'number' ? incidentData.confidenceScore : 92,
    status: incidentData.status || 'active',
    assignee: incidentData.assignee || { name: 'Alex Rivera', role: 'SRE Lead', avatar: 'AR' },
    failedAttempts: Array.isArray(incidentData.failedAttempts) ? incidentData.failedAttempts : [],
    successfulResolution: incidentData.successfulResolution || '',
    runbook: incidentData.runbook || {
      title: `Runbook: ${incidentData.title || 'Incident'}`,
      steps: ['Review telemetry logs', 'Drain traffic if necessary', 'Verify stabilization']
    },
    lessonsLearned: Array.isArray(incidentData.lessonsLearned) ? incidentData.lessonsLearned : [],
    tags: Array.isArray(incidentData.tags) ? incidentData.tags : ['active'],
    createdAt: new Date().toISOString(),
  };

  // 1. Instantly update local store and broadcast to live subscribers
  const existing = getLocal(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
  const updated = [record, ...existing];
  setLocal(STORAGE_KEYS.INCIDENTS, updated);
  broadcastUpdate('oryn_incidents_updated', updated);

  // 2. Non-blocking cloud sync with fast timeout so UI is never blocked
  Promise.race([
    setDoc(doc(db, 'incidents', newId), JSON.parse(JSON.stringify(record))),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {
    // Cloud sync fallback to resilient local replica
  });

  return record;
}

export async function updateIncident(id, data) {
  const existing = getLocal(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
  const updated = existing.map(item => item.id === id ? { ...item, ...data } : item);
  setLocal(STORAGE_KEYS.INCIDENTS, updated);
  broadcastUpdate('oryn_incidents_updated', updated);

  Promise.race([
    updateDoc(doc(db, 'incidents', id), JSON.parse(JSON.stringify(data))),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {
    // Cloud sync fallback to resilient local replica
  });

  return updated.find(i => i.id === id);
}

// ================= MEMORIES =================

export async function getMemories() {
  try {
    const snap = await getDocs(query(collection(db, 'memories'), orderBy('createdAt', 'desc')));
    if (!snap.empty) {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLocal(STORAGE_KEYS.MEMORIES, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.MEMORIES, INITIAL_MEMORIES);
}

export async function createMemory(memoryData) {
  const newId = `mem-${Math.floor(1000 + Math.random() * 9000)}`;
  const record = {
    id: newId,
    title: memoryData.title || 'Incident Pattern',
    service: memoryData.service || 'Infrastructure',
    severity: memoryData.severity || 'SEV-1',
    errorSignature: memoryData.errorSignature || 'ANOMALY_PATTERN',
    confidenceScore: typeof memoryData.confidenceScore === 'number' ? memoryData.confidenceScore : 90,
    rootCause: memoryData.rootCause || 'Observed failure pattern',
    recoverySteps: Array.isArray(memoryData.recoverySteps) ? memoryData.recoverySteps : ['Execute cluster mitigation'],
    tags: Array.isArray(memoryData.tags) ? memoryData.tags : ['active'],
    timesRecalled: 1,
    verifiedSuccessRate: 99,
    createdAt: new Date().toISOString()
  };

  const existing = getLocal(STORAGE_KEYS.MEMORIES, INITIAL_MEMORIES);
  const updated = [record, ...existing];
  setLocal(STORAGE_KEYS.MEMORIES, updated);
  broadcastUpdate('oryn_memories_updated', updated);

  Promise.race([
    setDoc(doc(db, 'memories', newId), JSON.parse(JSON.stringify(record))),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {});

  return record;
}

// ================= RUNBOOKS =================

export async function getRunbooks() {
  let cloudDocs = [];
  try {
    const snap = await Promise.race([
      getDocs(collection(db, 'runbooks')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    if (snap && !snap.empty) {
      cloudDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (e) {}

  const local = getLocal(STORAGE_KEYS.RUNBOOKS, []);
  
  // Combine all sources: seed data, Firestore cloud documents, and local user additions
  const allKnownMap = new Map();
  
  // 1. Initial production seeds (all 16 playbooks)
  INITIAL_RUNBOOKS.forEach(rb => allKnownMap.set(rb.id, rb));
  
  // 2. Cloud documents
  cloudDocs.forEach(rb => {
    const existing = allKnownMap.get(rb.id) || {};
    allKnownMap.set(rb.id, { ...existing, ...rb });
  });
  
  // 3. Local documents (ensures offline edits and newly authored playbooks are preserved)
  local.forEach(rb => {
    const existing = allKnownMap.get(rb.id) || {};
    allKnownMap.set(rb.id, { ...existing, ...rb });
  });

  const seedIds = new Set(INITIAL_RUNBOOKS.map(r => r.id));
  const userCreated = [];
  const seedItems = [];

  allKnownMap.forEach((rb, id) => {
    if (seedIds.has(id)) {
      seedItems.push(rb);
    } else {
      userCreated.push(rb);
    }
  });

  // Sort user-created playbooks with newest first
  userCreated.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const merged = [...userCreated, ...seedItems];
  setLocal(STORAGE_KEYS.RUNBOOKS, merged);
  return merged;
}

export async function createRunbook(runbookData) {
  const newId = `rb-${Date.now()}`;
  const record = {
    id: newId,
    executionCount: 1,
    successRate: '99.2%',
    version: runbookData.version || 'v1.0',
    ...runbookData,
    createdAt: new Date().toISOString()
  };

  const existing = await getRunbooks();
  const updated = [record, ...existing.filter(r => r.id !== newId)];
  setLocal(STORAGE_KEYS.RUNBOOKS, updated);
  broadcastUpdate('oryn_runbooks_updated', updated);

  Promise.race([
    setDoc(doc(db, 'runbooks', newId), JSON.parse(JSON.stringify(record))),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {});

  return record;
}

export async function deleteRunbook(id) {
  const existing = await getRunbooks();
  const updated = existing.filter(r => r.id !== id);
  setLocal(STORAGE_KEYS.RUNBOOKS, updated);
  broadcastUpdate('oryn_runbooks_updated', updated);

  Promise.race([
    deleteDoc(doc(db, 'runbooks', id)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {});

  return updated;
}

// ================= POSTMORTEMS =================

export async function getPostmortems() {
  let cloudDocs = [];
  try {
    const snap = await Promise.race([
      getDocs(collection(db, 'postmortems')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    if (snap && !snap.empty) {
      cloudDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (e) {}

  const local = getLocal(STORAGE_KEYS.POSTMORTEMS, []);
  
  // Combine all sources: seed postmortems, Firestore documents, and local user additions
  const allKnownMap = new Map();
  
  // 1. Initial seeds (all 6 rich postmortems across fake accounts)
  INITIAL_POSTMORTEMS.forEach(pm => allKnownMap.set(pm.id, pm));
  
  // 2. Cloud documents override
  cloudDocs.forEach(pm => {
    const existing = allKnownMap.get(pm.id) || {};
    allKnownMap.set(pm.id, { ...existing, ...pm });
  });
  
  // 3. Local storage override (user changes, edits, offline creations)
  local.forEach(pm => {
    const existing = allKnownMap.get(pm.id) || {};
    allKnownMap.set(pm.id, { ...existing, ...pm });
  });

  const seedIds = new Set(INITIAL_POSTMORTEMS.map(p => p.id));
  const userCreated = [];
  const seedItems = [];

  allKnownMap.forEach((pm, id) => {
    if (seedIds.has(id)) {
      seedItems.push(pm);
    } else {
      userCreated.push(pm);
    }
  });

  // Sort user-created postmortems newest first
  userCreated.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const merged = [...userCreated, ...seedItems];
  setLocal(STORAGE_KEYS.POSTMORTEMS, merged);
  return merged;
}

export async function createPostmortem(postmortemData) {
  const newId = `pm-${Date.now()}`;
  const record = {
    id: newId,
    ...postmortemData,
    createdAt: new Date().toISOString()
  };

  const existing = await getPostmortems();
  const updated = [record, ...existing.filter(p => p.id !== newId)];
  setLocal(STORAGE_KEYS.POSTMORTEMS, updated);
  broadcastUpdate('oryn_postmortems_updated', updated);

  Promise.race([
    setDoc(doc(db, 'postmortems', newId), JSON.parse(JSON.stringify(record))),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {});

  return record;
}

export async function updatePostmortem(id, postmortemData) {
  const existing = await getPostmortems();
  const updated = existing.map(pm => pm.id === id ? { ...pm, ...postmortemData, updatedAt: new Date().toISOString() } : pm);
  setLocal(STORAGE_KEYS.POSTMORTEMS, updated);
  broadcastUpdate('oryn_postmortems_updated', updated);

  Promise.race([
    updateDoc(doc(db, 'postmortems', id), JSON.parse(JSON.stringify(postmortemData))),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {});

  return updated.find(pm => pm.id === id);
}

export async function deletePostmortem(id) {
  const existing = await getPostmortems();
  const updated = existing.filter(pm => pm.id !== id);
  setLocal(STORAGE_KEYS.POSTMORTEMS, updated);
  broadcastUpdate('oryn_postmortems_updated', updated);

  Promise.race([
    deleteDoc(doc(db, 'postmortems', id)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
  ]).catch(() => {});

  return updated;
}

// ================= DEPLOYMENTS & SERVICES =================

export async function getDeployments() {
  try {
    const snap = await getDocs(collection(db, 'deployments'));
    if (!snap.empty) {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLocal(STORAGE_KEYS.DEPLOYMENTS, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.DEPLOYMENTS, INITIAL_DEPLOYMENTS);
}

export async function getServiceHealth() {
  try {
    const snap = await getDocs(collection(db, 'serviceHealth'));
    if (!snap.empty) {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLocal(STORAGE_KEYS.SERVICES, data);
      return data;
    }
  } catch (e) {}
  return getLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
}
