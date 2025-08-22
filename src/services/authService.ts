import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  phone?: string;
}

class AuthService {
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getUserProfile(firebaseUser.uid);
        this.notifyListeners(user);
      } else {
        this.notifyListeners(null);
      }
    });
  }

  // CREATE - Register new user
  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email!,
        username: email.split('@')[0],
        displayName,
        avatar: firebaseUser.photoURL || undefined,
        status: 'online',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { id: firebaseUser.uid, ...userData };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // READ - Login user
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = await this.getUserProfile(userCredential.user.uid);
      
      // Update user status to online
      await this.updateUserStatus(userCredential.user.uid, 'online');
      
      return user!;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // READ - Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userId,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastSeen: data.lastSeen?.toDate()
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // UPDATE - Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile if displayName or photoURL changed
      if (updates.displayName || updates.avatar) {
        await updateProfile(currentUser, {
          displayName: updates.displayName,
          photoURL: updates.avatar
        });
      }

      // Update Firestore document
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, 'users', currentUser.uid), updateData);

      // Return updated user profile
      const updatedUser = await this.getUserProfile(currentUser.uid);
      return updatedUser!;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // UPDATE - Update user status
  async updateUserStatus(userId: string, status: User['status']): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'offline') {
        updateData.lastSeen = serverTimestamp();
      }

      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // DELETE - Delete user account
  async deleteAccount(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user logged in');

    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // Delete Firebase Auth user
      await currentUser.delete();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await this.updateUserStatus(currentUser.uid, 'offline');
    }
    await signOut(auth);
  }

  // Auth state listener
  onAuthStateChange(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(user: User | null) {
    this.listeners.forEach(listener => listener(user));
  }
}

export const authService = new AuthService();