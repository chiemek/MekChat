import React, { useState, useRef, useEffect } from 'react';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { ChatHeader } from './ChatHeader';
import { useChat } from '../context/ChatContext';

interface ChatInterfaceProps {
  onCall: (call: { type: 'audio' | 'video'; contact: any; status: 'calling' }) => void;
}

export function ChatInterface({ onCall }: ChatInterfaceProps) {
  const { messages, activeContact } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!activeContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-xl">
        <div className="text-center text-white/60">
          <h3 className="text-xl font-medium mb-2">Welcome to ChatFlow</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl">
      <ChatHeader contact={activeContact} onCall={onCall} />
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput />
    </div>
  );
}