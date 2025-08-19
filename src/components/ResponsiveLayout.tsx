import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ContactsSidebar } from './ContactsSidebar';
import { ChatInterface } from './ChatInterface';
import { CallInterface } from './CallInterface';

interface ResponsiveLayoutProps {
  activeCall: any;
  setActiveCall: (call: any) => void;
}

export function ResponsiveLayout({ activeCall, setActiveCall }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20 p-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen pt-16 lg:pt-0">
        {/* Sidebar */}
        <div className={`
          fixed lg:relative z-40 lg:z-0
          w-80 h-full lg:h-screen
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <ContactsSidebar 
            onCall={setActiveCall}
            onContactSelect={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 lg:flex-1">
          <ChatInterface onCall={setActiveCall} />
        </div>

        {/* Call Interface */}
        {activeCall && (
          <CallInterface
            call={activeCall}
            onEndCall={() => setActiveCall(null)}
            onUpdateCall={setActiveCall}
          />
        )}
      </div>
    </>
  );
}