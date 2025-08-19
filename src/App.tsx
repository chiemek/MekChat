import React, { useState, useEffect } from 'react';
import { ResponsiveLayout } from './components/ResponsiveLayout';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';

function App() {
  const [activeCall, setActiveCall] = useState<{
    type: 'audio' | 'video';
    contact: any;
    status: 'calling' | 'connected' | 'ended';
  } | null>(null);

  return (
    <ThemeProvider>
      <ChatProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="max-w-7xl mx-auto">
            <ResponsiveLayout 
              activeCall={activeCall}
              setActiveCall={setActiveCall}
            />
          </div>
        </div>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;