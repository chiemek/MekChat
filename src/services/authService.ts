import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  status: "online" | "offline" | "away";
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return this.transformUser(result.user);
  }

  async register(email: string, password: string, name: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Add user profile data
    return this.transformUser(result.user);
  }

  async logout() {
    await signOut(auth);
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.transformUser(user) : null);
    });
  }

  private transformUser(firebaseUser: any): User {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || "Anonymous",
      email: firebaseUser.email,
      avatar: firebaseUser.photoURL || "",
      status: "online",
    };
  }
}

export const authService = new AuthService();
