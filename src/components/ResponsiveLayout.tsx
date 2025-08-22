import { useState, FC, useEffect, memo } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./ContactsSidebar";
import { ChatInterface } from "./ChatInterface";
import { CallInterface } from "./CallInterface";
import { authService, User as UserType } from "../services/authService";
import { ChatRoom, chatService } from "../services/chatService";

interface Call {
  id: string;
  participants: UserType[];
  type: "audio" | "video";
  status: "connecting" | "connected" | "ended";
}

interface ResponsiveLayoutProps {
  activeCall: Call | null;
  setActiveCall: (call: Call | null) => void;
  currentUser: UserType | null;
}

export const ResponsiveLayout: FC<ResponsiveLayoutProps> = memo(
  ({ activeCall, setActiveCall, currentUser }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [activeChatRoom, setActiveChatRoom] = useState<ChatRoom | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const loadChatRooms = async () => {
        setIsLoading(true);
        try {
          const rooms = await chatService.getChatRooms();
          setChatRooms(rooms);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load chat rooms"
          );
        } finally {
          setIsLoading(false);
        }
      };

      loadChatRooms();
    }, []);

    const handleChatRoomSelect = (chatRoom: ChatRoom) => {
      setActiveChatRoom(chatRoom);
      setIsSidebarOpen(false);
    };

    const handleCall = (callData: any) => {
      if (!currentUser) return;
      
      const call: Call = {
        id: 'call-' + Date.now(),
        participants: [currentUser, callData.contact],
        type: callData.type,
        status: 'connecting'
      };
      
      setActiveCall(call);
    };

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
          <div
            className={`
          fixed lg:relative z-40 lg:z-0
          w-80 h-full lg:h-screen
          transform transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
          >
            {currentUser && (
              <Sidebar
                chatRooms={chatRooms}
                activeChatRoom={activeChatRoom}
                onSelectChatRoom={handleChatRoomSelect}
                currentUser={currentUser}
                isConnected={true}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 lg:flex-1">
            <ChatInterface onCall={handleCall} />
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
);

ResponsiveLayout.displayName = "ResponsiveLayout";
