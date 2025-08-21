// Simulated real-time chat service

import { getDatabase, ref, onValue, push, set } from "firebase/database";
import { User } from "./authService";

const db = getDatabase();

export interface ChatMessage {
  id: string;
  type: "text" | "voice" | "image" | "video";
  content: string;
  timestamp: Date;
  sender: string;
  recipient: string;
  duration?: number;
  fileName?: string;
  status: "sending" | "sent" | "delivered" | "read";
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastSeen?: Date;
  isTyping?: boolean;
}

// Add this interface to chatService.ts
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
  private messages: ChatMessage[] = [];
  private users: User[] = [
    {
      id: "user1",
      name: "Alex Johnson",
      avatar:
        "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
      status: "online",
    },
    {
      id: "user2",
      name: "Sarah Chen",
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
      status: "away",
    },
    {
      id: "user3",
      name: "Mike Rodriguez",
      avatar:
        "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150",
      status: "offline",
      lastSeen: new Date(Date.now() - 1800000),
    },
    {
      id: "user4",
      name: "Emma Watson",
      avatar:
        "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
      status: "online",
    },
  ];

  listenToChats(userId: string, callback: (chats: ChatRoom[]) => void) {
    const chatsRef = ref(db, `chats/${userId}`);
    return onValue(chatsRef, (snapshot) => {
      const chats = snapshot.val() || {};
      callback(Object.values(chats));
    });
  }

  async sendMessage(
    chatId: string,
    message: Omit<ChatMessage, "id" | "timestamp">
  ) {
    const messageRef = ref(db, `messages/${chatId}`);
    const newMessage = {
      ...message,
      id: push(messageRef).key,
      timestamp: new Date().toISOString(),
    };
    await set(ref(db, `messages/${chatId}/${newMessage.id}`), newMessage);
    return newMessage;
  }

  listenToMessages(
    chatId: string,
    callback: (messages: ChatMessage[]) => void
  ) {
    const messagesRef = ref(db, `messages/${chatId}`);
    return onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val() || {};
      callback(Object.values(messages));
    });
  }

  private currentUserId = "currentUser"; // Move this to the top
  private chatRooms: ChatRoom[] = [
    {
      id: "room1",
      name: "Direct Message",
      type: "direct",
      participants: [
        this.users[0],
        {
          id: this.currentUserId,
          name: "Current User",
          avatar:
            "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150",
          status: "online",
        },
      ],
      lastMessage: this.messages[0],
      unreadCount: 0,
      createdAt: new Date(),
    },
    {
      id: "room2",
      name: "Project Team",
      type: "group",
      participants: [this.users[0], this.users[1], this.users[2]],
      lastMessage: this.messages[1],
      unreadCount: 2,
      createdAt: new Date(),
    },
  ];

  // Add these methods to the ChatService class
  getChatRooms(): ChatRoom[] {
    return this.chatRooms;
  }

  updateChatRoomLastMessage(roomId: string, message: ChatMessage) {
    this.chatRooms = this.chatRooms.map((room) =>
      room.id === roomId ? { ...room, lastMessage: message } : room
    );
  }

  incrementUnreadCount(roomId: string) {
    this.chatRooms = this.chatRooms.map((room) =>
      room.id === roomId ? { ...room, unreadCount: room.unreadCount + 1 } : room
    );
  }

  resetUnreadCount(roomId: string) {
    this.chatRooms = this.chatRooms.map((room) =>
      room.id === roomId ? { ...room, unreadCount: 0 } : room
    );
  }

  private listeners: ((messages: ChatMessage[]) => void)[] = [];
  private userListeners: ((users: User[]) => void)[] = [];
  private typingListeners: ((userId: string, isTyping: boolean) => void)[] = [];

  constructor() {
    // Initialize with some demo messages
    this.messages = [
      {
        id: "1",
        type: "text",
        content: "Hey! How are you doing?",
        timestamp: new Date(Date.now() - 3600000),
        sender: "user1",
        recipient: this.currentUserId,
        status: "read",
      },
      {
        id: "2",
        type: "text",
        content: "I'm doing great! Just working on some cool projects.",
        timestamp: new Date(Date.now() - 3000000),
        sender: this.currentUserId,
        recipient: "user1",
        status: "read",
      },
    ];

    // Simulate random incoming messages
    this.startMessageSimulation();
  }

  // Subscribe to message updates
  onMessagesUpdate(callback: (messages: ChatMessage[]) => void) {
    this.listeners.push(callback);
    callback(this.messages);

    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  // Subscribe to user updates
  onUsersUpdate(callback: (users: User[]) => void) {
    this.userListeners.push(callback);
    callback(this.users);

    return () => {
      this.userListeners = this.userListeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  // Subscribe to typing indicators
  onTypingUpdate(callback: (userId: string, isTyping: boolean) => void) {
    this.typingListeners.push(callback);

    return () => {
      this.typingListeners = this.typingListeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  // Send a message
  async sendMessage(
    message: Omit<ChatMessage, "id" | "timestamp" | "sender" | "status">
  ) {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      sender: this.currentUserId,
      status: "sending",
    };

    this.messages.push(newMessage);
    this.notifyListeners();

    // Simulate network delay and status updates
    await this.simulateMessageDelivery(newMessage.id);

    // Simulate response from recipient (30% chance)
    if (Math.random() < 0.3) {
      setTimeout(() => {
        this.simulateIncomingMessage(message.recipient);
      }, 2000 + Math.random() * 3000);
    }
  }

  // Get messages for a specific conversation
  getConversationMessages(userId: string): ChatMessage[] {
    return this.messages.filter(
      (msg) =>
        (msg.sender === this.currentUserId && msg.recipient === userId) ||
        (msg.sender === userId && msg.recipient === this.currentUserId)
    );
  }

  // Get all users
  getUsers(): User[] {
    return this.users;
  }

  // Update user status
  updateUserStatus(userId: string, status: User["status"]) {
    this.users = this.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            status,
            lastSeen: status === "offline" ? new Date() : undefined,
          }
        : user
    );
    this.notifyUserListeners();
  }

  // Set typing indicator
  setTyping(recipientId: string, isTyping: boolean) {
    this.typingListeners.forEach((listener) => listener(recipientId, isTyping));

    // Simulate typing response (20% chance)
    if (isTyping && Math.random() < 0.2) {
      setTimeout(() => {
        this.simulateTyping(recipientId);
      }, 1000 + Math.random() * 2000);
    }
  }

  private async simulateMessageDelivery(messageId: string) {
    // Simulate sent status
    setTimeout(() => {
      this.updateMessageStatus(messageId, "sent");
    }, 500 + Math.random() * 1000);

    // Simulate delivered status
    setTimeout(() => {
      this.updateMessageStatus(messageId, "delivered");
    }, 1000 + Math.random() * 2000);

    // Simulate read status (70% chance)
    if (Math.random() < 0.7) {
      setTimeout(() => {
        this.updateMessageStatus(messageId, "read");
      }, 2000 + Math.random() * 5000);
    }
  }

  private updateMessageStatus(
    messageId: string,
    status: ChatMessage["status"]
  ) {
    this.messages = this.messages.map((msg) =>
      msg.id === messageId ? { ...msg, status } : msg
    );
    this.notifyListeners();
  }

  private simulateIncomingMessage(fromUserId: string) {
    const responses = [
      "That's interesting!",
      "Tell me more about that",
      "Sounds great!",
      "I agree with you",
      "That's awesome!",
      "Really? That's cool!",
      "I see what you mean",
      "Thanks for sharing!",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    const incomingMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "text",
      content: randomResponse,
      timestamp: new Date(),
      sender: fromUserId,
      recipient: this.currentUserId,
      status: "sent",
    };

    this.messages.push(incomingMessage);
    this.notifyListeners();

    // Mark as delivered and read after a short delay
    setTimeout(() => {
      this.updateMessageStatus(incomingMessage.id, "delivered");
      setTimeout(() => {
        this.updateMessageStatus(incomingMessage.id, "read");
      }, 1000);
    }, 500);
  }

  private simulateTyping(userId: string) {
    this.users = this.users.map((user) =>
      user.id === userId ? { ...user, isTyping: true } : user
    );
    this.notifyUserListeners();

    setTimeout(() => {
      this.users = this.users.map((user) =>
        user.id === userId ? { ...user, isTyping: false } : user
      );
      this.notifyUserListeners();
    }, 2000 + Math.random() * 3000);
  }

  private startMessageSimulation() {
    // Randomly update user statuses
    setInterval(() => {
      const randomUser =
        this.users[Math.floor(Math.random() * this.users.length)];
      const statuses: User["status"][] = ["online", "away", "offline"];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      this.updateUserStatus(randomUser.id, newStatus);
    }, 30000); // Every 30 seconds

    // Occasionally send random messages
    setInterval(() => {
      if (Math.random() < 0.1) {
        // 10% chance every 10 seconds
        const onlineUsers = this.users.filter(
          (user) => user.status === "online"
        );
        if (onlineUsers.length > 0) {
          const randomUser =
            onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
          this.simulateIncomingMessage(randomUser.id);
        }
      }
    }, 10000);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.messages]));
  }

  private notifyUserListeners() {
    this.userListeners.forEach((listener) => listener([...this.users]));
  }
}

export const chatService = new ChatService();
