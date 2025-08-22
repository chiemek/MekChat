import React, { useState, useEffect } from "react";
import { ResponsiveLayout } from "./components/ResponsiveLayout";
import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { AuthModal } from "./components/AuthModal";
import { authService, User as UserType } from "./services/authService";
import { AuthProvider, useAuth } from "./context/AuthContext";

interface Call {
  id: string;
  participants: UserType[];
  type: "audio" | "video";
  status: "connecting" | "connected" | "ended";
}

function AppContent() {
  const { user: currentUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">ChatFlow</h1>
          <p className="text-white/70 mb-8">Ultra Modern Chat Experience</p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium transition-all"
          >
            Get Started
          </button>
        </div>

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      </div>
    );
  }

  return (
    <ChatProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <ResponsiveLayout
            activeCall={activeCall}
            setActiveCall={setActiveCall}
            currentUser={currentUser}
          />
        </div>
      </div>
    </ChatProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
