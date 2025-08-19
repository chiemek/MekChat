import React, { useState } from 'react';
import { Search, Phone, Video, Settings, Moon, Sun, Plus } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';

interface ContactsSidebarProps {
  onCall: (call: { type: 'audio' | 'video'; contact: any; status: 'calling' }) => void;
  onContactSelect?: () => void;
}

export function ContactsSidebar({ onCall, onContactSelect }: ContactsSidebarProps) {
  const { contacts, activeContact, setActiveContact } = useChat();
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="w-80 bg-white/10 backdrop-blur-xl border-r border-white/20 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => {
              setActiveContact(contact);
              onContactSelect?.();
            }}
            className={`p-4 border-b border-white/5 cursor-pointer transition-all duration-200 hover:bg-white/10 ${
              activeContact?.id === contact.id ? 'bg-white/10 border-r-2 border-r-purple-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    contact.status === 'online'
                      ? 'bg-green-500'
                      : contact.status === 'away'
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{contact.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCall({ type: 'audio', contact, status: 'calling' });
                      }}
                      className="p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-white/70" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCall({ type: 'video', contact, status: 'calling' });
                      }}
                      className="p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <Video className="w-4 h-4 text-white/70" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {contact.isTyping ? (
                    <span className="text-xs text-purple-400 animate-pulse">typing...</span>
                  ) : (
                    <span className="text-xs text-white/60">
                      {contact.status === 'online'
                        ? 'Online'
                        : contact.lastSeen
                        ? `Last seen ${formatLastSeen(contact.lastSeen)}`
                        : 'Offline'
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all">
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
    </div>
  );
}