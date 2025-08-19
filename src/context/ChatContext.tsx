import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { chatService, ChatMessage as ServiceMessage, User as ServiceUser } from '../services/chatService';

export interface Message extends Omit<ServiceMessage, 'sender' | 'recipient'> {
  sender: 'me' | 'other';
}

export interface Contact extends Omit<ServiceUser, 'id'> {
  id: string;
}

interface ChatContextType {
  messages: Message[];
  contacts: Contact[];
  activeContact: Contact | null;
  setActiveContact: (contact: Contact) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp' | 'status'>) => void;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  mediaRecorder: MediaRecorder | null;
  handleTyping: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize chat service subscriptions
  useEffect(() => {
    const unsubscribeMessages = chatService.onMessagesUpdate((serviceMessages) => {
      const formattedMessages = serviceMessages.map(msg => ({
        ...msg,
        sender: msg.sender === 'currentUser' ? 'me' as const : 'other' as const
      }));
      setMessages(formattedMessages);
    });

    const unsubscribeUsers = chatService.onUsersUpdate((users) => {
      const formattedContacts = users.map(user => ({ ...user }));
      setContacts(formattedContacts);
      
      // Set first contact as active if none selected
      if (!activeContact && formattedContacts.length > 0) {
        setActiveContact(formattedContacts[0]);
      }
    });

    const unsubscribeTyping = chatService.onTypingUpdate((userId, isTyping) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
      
      // Update contact typing status
      setContacts(prev => prev.map(contact => 
        contact.id === userId ? { ...contact, isTyping } : contact
      ));
    });

    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
      unsubscribeTyping();
    };
  }, [activeContact]);

  // Get messages for active conversation
  const conversationMessages = activeContact 
    ? messages.filter(msg => 
        (msg.sender === 'me' && (msg as any).recipient === activeContact.id) ||
        (msg.sender === 'other' && (msg as any).sender === activeContact.id)
      )
    : [];

  const addMessage = (message: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
    if (!activeContact) return;
    
    chatService.sendMessage({
      type: message.type,
      content: message.content,
      recipient: activeContact.id,
      duration: message.duration,
      fileName: message.fileName
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        resolve(audioBlob);
        setIsRecording(false);
        
        // Stop all tracks to release microphone
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.stop();
    });
  };

  // Handle typing indicators
  const handleTyping = (isTyping: boolean) => {
    if (!activeContact) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    chatService.setTyping(activeContact.id, isTyping);
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        chatService.setTyping(activeContact.id, false);
      }, 3000);
    }
  };

  // Enhanced setActiveContact with typing cleanup
  const handleSetActiveContact = (contact: Contact) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setActiveContact(contact);
  };

  return (
    <ChatContext.Provider value={{
      messages: conversationMessages,
      contacts,
      activeContact,
      setActiveContact: handleSetActiveContact,
      addMessage,
      isRecording,
      startRecording,
      stopRecording,
      mediaRecorder: mediaRecorderRef.current,
      handleTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}