import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface ChatMessage {
  id: string;
  type: "text" | "voice" | "image" | "video";
  content: string;
  timestamp: Date;
  senderId: string;
  recipientId: string;
  conversationId: string;
  duration?: number;
  fileName?: string;
  status: "sending" | "sent" | "delivered" | "read";
  reactions?: { [userId: string]: string };
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastSeen?: Date;
  isTyping?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  type: "direct" | "group";
  name?: string;
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoom {
  id: string;
  name?: string;
  type: "direct" | "group";
  participants: User[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
}

class ChatService {
  private messageListeners: ((messages: ChatMessage[]) => void)[] = [];
  private conversationListeners: ((conversations: Conversation[]) => void)[] = [];
  private unsubscribes: (() => void)[] = [];

  // CREATE - Send a new message
  async sendMessage(messageData: {
    type: ChatMessage['type'];
    content: string;
    recipientId: string;
    conversationId?: string;
    duration?: number;
    fileName?: string;
  }): Promise<ChatMessage> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      let conversationId = messageData.conversationId;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        conversationId = await this.createOrGetConversation([currentUser.uid, messageData.recipientId]);
      }

      const message = {
        type: messageData.type,
        content: messageData.content,
        senderId: currentUser.uid,
        recipientId: messageData.recipientId,
        conversationId,
        duration: messageData.duration,
        fileName: messageData.fileName,
        status: 'sent' as const,
        timestamp: serverTimestamp(),
        reactions: {}
      };

      const docRef = await addDoc(collection(db, 'messages'), message);

      // Update conversation's last message
      await this.updateConversationLastMessage(conversationId, {
        id: docRef.id,
        ...message,
        timestamp: new Date()
      } as ChatMessage);

      return {
        id: docRef.id,
        ...message,
        timestamp: new Date()
      } as ChatMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // READ - Get messages for a conversation
  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage);
      });
      callback(messages);
    });

    this.unsubscribes.push(unsubscribe);
    return unsubscribe;
  }

  // CREATE/READ - Create or get existing conversation
  async createOrGetConversation(participantIds: string[]): Promise<string> {
    try {
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains-any', participantIds)
      );

      const querySnapshot = await getDocs(q);
      
      // Find exact match
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.participants.length === participantIds.length &&
            participantIds.every(id => data.participants.includes(id))) {
          return doc.id;
        }
      }

      // Create new conversation
      const conversationData = {
        participants: participantIds,
        type: participantIds.length === 2 ? 'direct' : 'group',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  }

  // READ - Get user's conversations
  async getChatRooms(): Promise<ChatRoom[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const chatRooms: ChatRoom[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Get participant details
        const participants: User[] = [];
        for (const participantId of data.participants) {
          if (participantId !== currentUser.uid) {
            const userDoc = await getDoc(doc(db, 'users', participantId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              participants.push({
                id: participantId,
                name: userData.displayName || userData.username,
                avatar: userData.avatar || '',
                status: userData.status || 'offline',
                lastSeen: userData.lastSeen?.toDate()
              });
            }
          }
        }

        chatRooms.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          participants,
          lastMessage: data.lastMessage,
          unreadCount: 0, // TODO: Implement unread count logic
          createdAt: data.createdAt?.toDate() || new Date()
        });
      }

      return chatRooms;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }
  }

  // UPDATE - Update message status
  async updateMessageStatus(messageId: string, status: ChatMessage['status']): Promise<void> {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // UPDATE - Add reaction to message
  async addReaction(messageId: string, reaction: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const messageDoc = await getDoc(doc(db, 'messages', messageId));
      if (messageDoc.exists()) {
        const data = messageDoc.data();
        const reactions = data.reactions || {};
        reactions[currentUser.uid] = reaction;

        await updateDoc(doc(db, 'messages', messageId), {
          reactions,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  // DELETE - Delete message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // UPDATE - Update conversation's last message
  private async updateConversationLastMessage(conversationId: string, message: ChatMessage): Promise<void> {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: {
          id: message.id,
          type: message.type,
          content: message.content,
          senderId: message.senderId,
          timestamp: message.timestamp
        },
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation last message:', error);
    }
  }

  // Cleanup subscriptions
  cleanup() {
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes = [];
  }

  // Legacy methods for compatibility
  onMessagesUpdate(callback: (messages: ChatMessage[]) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  onUsersUpdate(callback: (users: User[]) => void) {
    // TODO: Implement real-time user updates
    callback([]);
    return () => {};
  }

  onTypingUpdate(callback: (userId: string, isTyping: boolean) => void) {
    // TODO: Implement typing indicators
    return () => {};
  }

  setTyping(recipientId: string, isTyping: boolean) {
    // TODO: Implement typing indicators
  }
}

export const chatService = new ChatService();