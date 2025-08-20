export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  status: 'online' | 'offline' | 'away';
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
  username: string;
  displayName: string;
  password: string;
  phone?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: 'current-user-' + Date.now(),
      email: credentials.email,
      username: credentials.email.split('@')[0],
      displayName: credentials.email.split('@')[0],
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.notifyAuthListeners();
    return user;
  }

  async register(data: RegisterData): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const user: User = {
      id: 'user-' + Date.now(),
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      phone: data.phone,
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.notifyAuthListeners();
    return user;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) throw new Error('Not authenticated');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.currentUser = { ...this.currentUser, ...updates, updatedAt: new Date() };
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.notifyAuthListeners();
    return this.currentUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.notifyAuthListeners();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthChange(callback: (user: User | null) => void) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  private notifyAuthListeners() {
    this.authListeners.forEach(listener => listener(this.currentUser));
  }
}

export const authService = new AuthService();