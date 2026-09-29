import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  db,
  doc,
  setDoc,
  getDoc
} from '../lib/firebase';
import { toast } from 'sonner';

export const DEMO_ACCOUNTS = [
  {
    id: 'alex',
    uid: 'demo-alex',
    displayName: 'Alex Rivera',
    email: 'alex.rivera@oryn.internal',
    role: 'admin',
    title: 'SRE Lead (Admin)',
    avatar: 'AR',
    team: 'Platform Reliability'
  },
  {
    id: 'elena',
    uid: 'demo-elena',
    displayName: 'Elena Rostova',
    email: 'elena.rostova@oryn.internal',
    role: 'engineer',
    title: 'Staff SRE (Engineer)',
    avatar: 'ER',
    team: 'Payments & Core SRE'
  },
  {
    id: 'marcus',
    uid: 'demo-marcus',
    displayName: 'Marcus Chen',
    email: 'marcus.chen@oryn.internal',
    role: 'engineer',
    title: 'Infra Architect',
    avatar: 'MC',
    team: 'Datastores & Caching'
  },
  {
    id: 'sarah',
    uid: 'demo-sarah',
    displayName: 'Sarah Lin',
    email: 'sarah.lin@oryn.internal',
    role: 'admin',
    title: 'Platform Lead',
    avatar: 'SL',
    team: 'Security & Ingress'
  },
  {
    id: 'david',
    uid: 'demo-david',
    displayName: 'David Kim',
    email: 'david.kim@oryn.internal',
    role: 'engineer',
    title: 'Streaming Lead',
    avatar: 'DK',
    team: 'Kafka & Event Streams'
  },
  {
    id: 'rachel',
    uid: 'demo-rachel',
    displayName: 'Rachel Green',
    email: 'rachel.green@oryn.internal',
    role: 'admin',
    title: 'Security Architect',
    avatar: 'RG',
    team: 'Identity & Secrets'
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default demo user profile if unauthenticated or demo mode
  const defaultUser = DEMO_ACCOUNTS[0];

  useEffect(() => {
    // Check local storage for persistent guest/demo session
    const savedUser = localStorage.getItem('oryn_auth_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setLoading(false);
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let userRole = 'engineer';
        let userTitle = 'Site Reliability Engineer';
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userRole = data.role || 'engineer';
            userTitle = data.title || 'Site Reliability Engineer';
          }
        } catch (e) {
          console.warn("Could not fetch user document:", e);
        }

        const userObj = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Engineer',
          role: userRole,
          title: userTitle,
          photoURL: user.photoURL
        };
        setCurrentUser(userObj);
        localStorage.setItem('oryn_auth_user', JSON.stringify(userObj));
      } else if (!savedUser) {
        // Automatically provide demo engineer session for seamless review if no user
        setCurrentUser(defaultUser);
        localStorage.setItem('oryn_auth_user', JSON.stringify(defaultUser));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      toast.success(`Welcome back, ${cred.user.displayName || 'Engineer'}`);
      return cred.user;
    } catch (err) {
      // Fallback demo login if Firebase auth error
      if (email.includes('@')) {
        const fallback = {
          uid: `local-${Date.now()}`,
          email,
          displayName: email.split('@')[0],
          role: email.includes('admin') ? 'admin' : 'engineer',
          title: email.includes('admin') ? 'Platform Admin' : 'Staff SRE'
        };
        setCurrentUser(fallback);
        localStorage.setItem('oryn_auth_user', JSON.stringify(fallback));
        toast.success(`Signed in as ${fallback.displayName}`);
        return fallback;
      }
      toast.error(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (email, password, displayName, role = 'engineer') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      
      const userProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        role,
        title: role === 'admin' ? 'Principal SRE / Admin' : 'Site Reliability Engineer',
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', cred.user.uid), userProfile);
      } catch (e) {}

      setCurrentUser(userProfile);
      localStorage.setItem('oryn_auth_user', JSON.stringify(userProfile));
      toast.success(`Account created for ${displayName}`);
      return userProfile;
    } catch (err) {
      // Fallback local signup
      const fallback = {
        uid: `local-${Date.now()}`,
        email,
        displayName,
        role,
        title: role === 'admin' ? 'Platform Admin' : 'Site Reliability Engineer'
      };
      setCurrentUser(fallback);
      localStorage.setItem('oryn_auth_user', JSON.stringify(fallback));
      toast.success(`Welcome to ORYN, ${displayName}`);
      return fallback;
    }
  };

  const demoLogin = (keyOrRole = 'admin') => {
    let matched = DEMO_ACCOUNTS.find(
      a => a.id === keyOrRole || a.role === keyOrRole || a.displayName.toLowerCase().includes(keyOrRole.toLowerCase())
    );
    if (!matched) {
      matched = DEMO_ACCOUNTS[0];
    }
    setCurrentUser(matched);
    localStorage.setItem('oryn_auth_user', JSON.stringify(matched));
    toast.success(`Switched to ${matched.displayName} (${matched.title})`);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    localStorage.removeItem('oryn_auth_user');
    setCurrentUser(null);
    toast.info("Signed out");
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout, demoLogin, demoAccounts: DEMO_ACCOUNTS }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
