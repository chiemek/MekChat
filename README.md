# Ultra Modern Chat Application

A production-ready chat application built with React, TypeScript, Firebase, and Tailwind CSS featuring real-time messaging, voice/video calls, and comprehensive CRUD operations.

## Features

### 🔐 Authentication
- Email/password authentication with Firebase Auth
- User registration and login
- Profile management with avatar upload
- Real-time user status (online/offline/away)

### 💬 Messaging
- Real-time text messaging
- Voice message recording and playback
- Image and video sharing
- Message reactions and replies
- Message editing and deletion
- Typing indicators
- Message status (sent/delivered/read)

### 👥 Contacts
- Add contacts by email or phone
- Import contacts from phone (mock implementation)
- Search and filter contacts
- Favorite contacts
- Block/unblock contacts
- Custom contact names and notes

### 📞 Voice & Video Calls
- WebRTC-based voice and video calls
- Call controls (mute, speaker, video toggle)
- Call duration tracking
- Picture-in-picture video layout

### 🎨 UI/UX
- Modern glassmorphism design
- Responsive layout for mobile and desktop
- Dark theme with gradient backgrounds
- Smooth animations and transitions
- Emoji picker
- File upload with progress indicators

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Real-time**: Firebase Firestore real-time listeners
- **Media**: Cloudinary for file uploads
- **Icons**: Lucide React
- **Build Tool**: Vite

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable the following services:
   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create in production mode
   - **Storage**: Enable for file uploads

3. Get your Firebase configuration from Project Settings

4. Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop

REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

5. Update `src/config/firebase.ts` with your configuration

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users for contacts
    }
    
    // Messages - users can only access messages they're involved in
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.recipientId);
    }
    
    // Conversations - users can only access conversations they're part of
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Contacts - users can only manage their own contacts
    match /contacts/{contactId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## CRUD Operations

### Users (Authentication Service)
- **CREATE**: Register new user with email/password
- **READ**: Get user profile, search users, get all users
- **UPDATE**: Update profile, status, avatar
- **DELETE**: Delete user account

### Messages (Chat Service)
- **CREATE**: Send text, voice, image, video messages
- **READ**: Get messages with pagination, real-time subscription
- **UPDATE**: Edit messages, update status, add reactions
- **DELETE**: Delete messages (own messages only)

### Conversations (Chat Service)
- **CREATE**: Create direct or group conversations
- **READ**: Get user's conversations, real-time updates
- **UPDATE**: Update conversation details, last message
- **DELETE**: Delete conversations and all messages

### Contacts (Contact Service)
- **CREATE**: Add contacts, import from phone
- **READ**: Get contacts, search, get favorites
- **UPDATE**: Update contact info, toggle favorite/block
- **DELETE**: Remove contacts

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Firebase Setup above)

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── ChatInterface.tsx # Main chat interface
│   ├── MessageBubble.tsx # Individual message component
│   └── ...
├── context/            # React contexts
│   ├── AuthContext.tsx # Authentication context
│   ├── ChatContext.tsx # Chat state management
│   └── ...
├── services/           # Business logic and API calls
│   ├── authService.ts  # Authentication operations
│   ├── chatService.ts  # Chat CRUD operations
│   ├── contactService.ts # Contact management
│   └── cloudinaryService.ts # File uploads
├── hooks/              # Custom React hooks
│   └── useFirestore.ts # Firestore data fetching
├── utils/              # Utility functions
│   └── firebaseHelpers.ts # Firebase CRUD helpers
├── config/             # Configuration files
│   └── firebase.ts     # Firebase initialization
└── ...
```

## Key Features Implementation

### Real-time Messaging
Uses Firestore's `onSnapshot` for real-time updates:
```typescript
const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
  // Handle real-time message updates
});
```

### File Uploads
Integrates with Cloudinary for optimized media handling:
```typescript
const result = await cloudinaryService.uploadImage(file, onProgress);
```

### Voice Recording
Uses MediaRecorder API for voice messages:
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
```

### WebRTC Calls
Implements peer-to-peer video/audio calls:
```typescript
const peerConnection = new RTCPeerConnection(rtcConfig);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.