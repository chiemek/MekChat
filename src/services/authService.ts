// Mock authentication service for demo purposes
// In production, replace with Firebase, Auth0, or your preferred auth service

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
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Check for stored user session
    const storedUser = localStorage.getItem('chatapp_user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  async login(email: string, password: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    const user: User = {
      id: 'user-' + Date.now(),
      email,
      username: email.split('@')[0],
      displayName: email.split('@')[0],
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.currentUser = user;
    localStorage.setItem('chatapp_user', JSON.stringify(user));
    this.notifyListeners();
    return user;
  }

  async register(email: string, password: string, name: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: 'user-' + Date.now(),
      email,
      username: email.split('@')[0],
      displayName: name,
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.currentUser = user;
    localStorage.setItem('chatapp_user', JSON.stringify(user));
    this.notifyListeners();
    return user;
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem('chatapp_user');
    this.notifyListeners();
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) throw new Error('No user logged in');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.currentUser = { ...this.currentUser, ...updates, updatedAt: new Date() };
    localStorage.setItem('chatapp_user', JSON.stringify(this.currentUser));
    this.notifyListeners();
    return this.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current user
    callback(this.currentUser);
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const authService = new AuthService();
