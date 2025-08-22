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
  Timestamp,
  limit,
  startAfter,
  DocumentSnapshot
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
  editedAt?: Date;
  replyTo?: string; // Message ID this is replying to
}

export interface User {
  id: string;
  name: string;
  displayName: string;
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
  description?: string;
  avatar?: string;
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  admins?: string[]; // For group chats
  settings?: {
    muteNotifications?: boolean;
    customWallpaper?: string;
  };
}

export interface ChatRoom {
  id: string;
  name?: string;
  type: "direct" | "group";
  participants: User[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  avatar?: string;
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
    replyTo?: string;
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
        replyTo: messageData.replyTo,
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

  // READ - Get messages for a conversation with pagination
  async getMessages(conversationId: string, limitCount: number = 50, lastDoc?: DocumentSnapshot): Promise<{
    messages: ChatMessage[];
    lastDoc?: DocumentSnapshot;
    hasMore: boolean;
  }> {
    try {
      let q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate()
        } as ChatMessage);
      });

      return {
        messages: messages.reverse(), // Reverse to show oldest first
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { messages: [], hasMore: false };
    }
  }

  // READ - Subscribe to real-time messages
  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc'),
      limit(100) // Limit for performance
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate()
        } as ChatMessage);
      });
      callback(messages);
    });

    this.unsubscribes.push(unsubscribe);
    return unsubscribe;
  }

  // UPDATE - Edit message
  async editMessage(messageId: string, newContent: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Verify user owns the message
      const messageDoc = await getDoc(doc(db, 'messages', messageId));
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      if (messageData.senderId !== currentUser.uid) {
        throw new Error('You can only edit your own messages');
      }

      await updateDoc(doc(db, 'messages', messageId), {
        content: newContent,
        editedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
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

  // UPDATE - Add/remove reaction to message
  async toggleReaction(messageId: string, reaction: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const messageDoc = await getDoc(doc(db, 'messages', messageId));
      if (messageDoc.exists()) {
        const data = messageDoc.data();
        const reactions = data.reactions || {};
        
        // Toggle reaction
        if (reactions[currentUser.uid] === reaction) {
          delete reactions[currentUser.uid];
        } else {
          reactions[currentUser.uid] = reaction;
        }

        await updateDoc(doc(db, 'messages', messageId), {
          reactions,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }

  // DELETE - Delete message
  async deleteMessage(messageId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Verify user owns the message
      const messageDoc = await getDoc(doc(db, 'messages', messageId));
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      if (messageData.senderId !== currentUser.uid) {
        throw new Error('You can only delete your own messages');
      }

      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // CREATE - Create new conversation
  async createConversation(participantIds: string[], type: 'direct' | 'group' = 'direct', name?: string): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const conversationData = {
        participants: participantIds,
        type,
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        admins: type === 'group' ? [currentUser.uid] : undefined
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // READ - Create or get existing conversation
  async createOrGetConversation(participantIds: string[]): Promise<string> {
    try {
      // For direct messages, check if conversation already exists
      if (participantIds.length === 2) {
        const q = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains-any', participantIds),
          where('type', '==', 'direct')
        );

        const querySnapshot = await getDocs(q);
        
        // Find exact match
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          if (data.participants.length === 2 &&
              participantIds.every(id => data.participants.includes(id))) {
            return doc.id;
          }
        }
      }

      // Create new conversation
      return await this.createConversation(participantIds, participantIds.length === 2 ? 'direct' : 'group');
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
                displayName: userData.displayName || userData.username,
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
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date()
          } : undefined,
          unreadCount: 0, // TODO: Implement unread count logic
          createdAt: data.createdAt?.toDate() || new Date(),
          avatar: data.avatar
        });
      }

      return chatRooms;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }
  }

  // UPDATE - Update conversation
  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Verify user is participant
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const conversationData = conversationDoc.data();
      if (!conversationData.participants.includes(currentUser.uid)) {
        throw new Error('You are not a participant in this conversation');
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, 'conversations', conversationId), updateData);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  // DELETE - Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Verify user is participant or admin
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const conversationData = conversationDoc.data();
      if (!conversationData.participants.includes(currentUser.uid)) {
        throw new Error('You are not a participant in this conversation');
      }

      // Delete all messages in the conversation
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the conversation
      await deleteDoc(doc(db, 'conversations', conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
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
    // Subscribe to users collection for real-time updates
    const q = query(collection(db, 'users'), orderBy('displayName'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.displayName || data.username,
          displayName: data.displayName || data.username,
          avatar: data.avatar || '',
          status: data.status || 'offline',
          lastSeen: data.lastSeen?.toDate(),
          isTyping: data.isTyping || false
        });
      });
      callback(users);
    });

    this.unsubscribes.push(unsubscribe);
    return unsubscribe;
  }

  onTypingUpdate(callback: (userId: string, isTyping: boolean) => void) {
    // TODO: Implement typing indicators with real-time updates
    return () => {};
  }

  setTyping(recipientId: string, isTyping: boolean) {
    // TODO: Implement typing indicators
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Update user's typing status in Firestore
    updateDoc(doc(db, 'users', currentUser.uid), {
      isTyping,
      typingTo: isTyping ? recipientId : null,
      updatedAt: serverTimestamp()
    }).catch(error => console.error('Error updating typing status:', error));
  }
}

export const chatService = new ChatService();