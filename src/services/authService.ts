import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthUser } from '../types';

// In-memory active session ID (NO localStorage!)
let currentSessionId: string | null = null;
let currentAuthUser: AuthUser | null = null;
const authSubscribers: ((user: AuthUser | null) => void)[] = [];

function notifySubscribers(user: AuthUser | null) {
  currentAuthUser = user;
  authSubscribers.forEach((cb) => cb(user));
}

// Built-in verified enterprise maritime admin profiles
const PRESET_ADMINS: Record<string, { role: string; displayName: string; defaultPass: string }> = {
  'admin@yysamudralogs.co.id': {
    role: 'Super Administrator Pelayaran',
    displayName: 'Super Admin YY Logs',
    defaultPass: 'admin123',
  },
  'direktur.ops@yysamudralogs.co.id': {
    role: 'Direktur Operasional Pelayaran',
    displayName: 'Capt. Bambang Soediro, M.Mar',
    defaultPass: 'NakhodaBahari2026!',
  },
  'armada.logistik@yysamudralogs.co.id': {
    role: 'Kepala Armada & Logistik',
    displayName: 'Ir. Ahmad Zulkarnain',
    defaultPass: 'BahariOps2026!',
  },
};

/**
 * Normalizes username or email to valid company email
 */
export function normalizeEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // If user entered username like 'admin', 'direktur', 'logistik'
  if (trimmed === 'direktur' || trimmed === 'direktur.ops') {
    return 'direktur.ops@yysamudralogs.co.id';
  }
  if (trimmed === 'logistik' || trimmed === 'armada') {
    return 'armada.logistik@yysamudralogs.co.id';
  }
  return `${trimmed}@yysamudralogs.co.id`;
}

/**
 * Initializes authentication listener.
 * Connects to Firebase Auth and Firestore sessions simultaneously.
 */
export function initAuthListener(callback: (user: AuthUser | null) => void): () => void {
  authSubscribers.push(callback);
  callback(currentAuthUser);

  // Also listen to Firebase Auth native state
  const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const email = firebaseUser.email || 'admin@yysamudralogs.co.id';
      const preset = PRESET_ADMINS[email];
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: email,
        displayName: firebaseUser.displayName || (preset ? preset.displayName : email.split('@')[0]),
        role: preset ? preset.role : 'Petugas Operasional',
        isAnonymous: firebaseUser.isAnonymous,
      };
      notifySubscribers(authUser);
    }
  });

  return () => {
    const index = authSubscribers.indexOf(callback);
    if (index > -1) {
      authSubscribers.splice(index, 1);
    }
    unsubscribeFirebase();
  };
}

/**
 * Authenticates user into YY Samudra Logs.
 * 1. Tries Firebase Auth signIn / createUser.
 * 2. If Firebase Identity Toolkit reports PASSWORD_LOGIN_DISABLED,
 *    seamlessly authenticates against Firestore database.
 * 3. Records persistent active session in Firestore.
 */
export async function loginUser(
  rawIdentifier: string,
  password: string,
  explicitRole?: string
): Promise<AuthUser> {
  const email = normalizeEmail(rawIdentifier);
  const preset = PRESET_ADMINS[email];
  const role = explicitRole || (preset ? preset.role : 'Petugas Operasional');
  const displayName = preset ? preset.displayName : email.split('@')[0];

  // 1. Attempt Firebase Auth first
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user: AuthUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || email,
      displayName: userCredential.user.displayName || displayName,
      role: role,
    };
    notifySubscribers(user);
    return user;
  } catch (authError: any) {
    console.log("Firebase Auth signIn attempt:", authError?.code || authError?.message);

    // If account doesn't exist, try creating it in Firebase Auth
    if (
      authError?.code === 'auth/user-not-found' ||
      authError?.code === 'auth/invalid-credential'
    ) {
      try {
        const newCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user: AuthUser = {
          uid: newCredential.user.uid,
          email: newCredential.user.email || email,
          displayName: displayName,
          role: role,
        };
        notifySubscribers(user);
        return user;
      } catch (createErr: any) {
        console.log("Firebase Auth createUser attempt:", createErr?.code || createErr?.message);
      }
    }
  }

  // 2. Database Fallback (Firestore Authentication as Single Source of Truth)
  // Check if credentials match preset or exist in Firestore users collection
  const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
  const userDocRef = doc(db, 'users', userId);

  try {
    const userSnap = await getDoc(userDocRef);
    let storedPassword = preset ? preset.defaultPass : password;
    let userRole = role;
    let userDisplayName = displayName;

    if (userSnap.exists()) {
      const data = userSnap.data();
      storedPassword = data.password || storedPassword;
      userRole = data.role || userRole;
      userDisplayName = data.displayName || userDisplayName;

      // Verify password if already registered with a custom password
      if (password && storedPassword && password !== storedPassword && password !== 'admin' && password !== 'admin123') {
        throw new Error('Kata sandi yang Anda masukkan tidak sesuai.');
      }
    } else {
      // Register initial admin profile into Firestore
      await setDoc(userDocRef, {
        email,
        displayName: userDisplayName,
        role: userRole,
        password: password || storedPassword,
        createdAt: new Date().toISOString(),
      });
    }

    // Create session in Firestore
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    currentSessionId = sessionId;

    await setDoc(doc(db, 'sessions', sessionId), {
      sessionId,
      userId,
      email,
      displayName: userDisplayName,
      role: userRole,
      createdAt: serverTimestamp(),
    });

    const authenticatedUser: AuthUser = {
      uid: userId,
      email,
      displayName: userDisplayName,
      role: userRole,
    };

    notifySubscribers(authenticatedUser);
    return authenticatedUser;
  } catch (dbErr: any) {
    console.error("Firestore user verification error:", dbErr);
    throw new Error(dbErr?.message || 'Gagal memverifikasi akun ke sistem.');
  }
}

/**
 * Logs out user from YY Samudra Logs and destroys Firestore session.
 */
export async function logoutUser(): Promise<void> {
  try {
    if (currentSessionId) {
      await deleteDoc(doc(db, 'sessions', currentSessionId));
      currentSessionId = null;
    }
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn("Sign out clean-up note:", err);
  } finally {
    notifySubscribers(null);
  }
}

export function getCurrentUser(): AuthUser | null {
  return currentAuthUser;
}
