import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatRoom, User } from "../services/chatService";
import { formatDistanceToNow } from "date-fns";
import { FC, memo } from "react";

import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  chatRooms: ChatRoom[];
  activeChatRoom: ChatRoom | null;
  onSelectChatRoom: (chatRoom: ChatRoom) => void;
  currentUser: User;
  isConnected: boolean;
  isLoading?: boolean;
  error?: string;
}

const Sidebar: FC<SidebarProps> = memo(
  ({
    chatRooms,
    activeChatRoom,
    onSelectChatRoom,
    currentUser,
    isConnected,
    isLoading,
    error,
  }) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Add loading state
    if (isLoading) {
      return (
        <div className="w-80 bg-white dark:bg-gray-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      );
    }

    // Add error state
    if (error) {
      return (
        <div className="w-80 bg-white dark:bg-gray-800 p-4 text-red-500">
          {error}
        </div>
      );
    }

    const filteredChatRooms = chatRooms.filter((chatRoom) => {
      const otherUser = chatRoom.participants.find(
        (p) => p.id !== currentUser.id
      );
      return (
        otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chatRoom.lastMessage?.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    });

    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={
                    currentUser.avatar ||
                    "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
                  }
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                    isConnected ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {currentUser.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isConnected ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filteredChatRooms.map((chatRoom) => {
              const otherUser = chatRoom.participants.find(
                (p: User) => p.id !== currentUser.id
              );
              const isActive = activeChatRoom?.id === chatRoom.id;

              return (
                <motion.div
                  key={chatRoom.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/20 border-r-4 border-r-primary-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => onSelectChatRoom(chatRoom)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          otherUser?.avatar ||
                          "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
                        }
                        alt={otherUser?.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {otherUser?.status === "online" && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {otherUser?.name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {chatRoom.lastMessage?.timestamp &&
                            formatDistanceToNow(
                              chatRoom.lastMessage.timestamp,
                              {
                                addSuffix: true,
                              }
                            )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {chatRoom.lastMessage?.content || "No messages yet"}
                        </p>
                        {chatRoom.unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center"
                          >
                            {chatRoom.unreadCount}
                          </motion.span>
                        )}
                      </div>

                      {otherUser?.status !== "online" && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Last seen{" "}
                          {formatDistanceToNow(
                            otherUser?.lastSeen ?? new Date()
                          )}{" "}
                          ago
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredChatRooms.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-16 h-16 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p>No conversations found</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
