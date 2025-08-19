import React, { useState } from 'react';
import { Play, Pause, Download, Check, CheckCheck } from 'lucide-react';
import { Message } from '../context/ChatContext';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const isFromMe = message.sender === 'me';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const StatusIcon = () => {
    if (!isFromMe) return null;
    
    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border border-white/60 rounded-full animate-pulse" />;
      case 'sent':
        return <Check className="w-3 h-3 text-white/60" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-white/60" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="text-white leading-relaxed">{message.content}</p>
        );
      
      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>
            
            <div className="flex-1">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / (message.duration || 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(message.duration || 0)}</span>
              </div>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="relative">
            <img
              src={message.content}
              alt="Shared image"
              className="max-w-sm max-h-64 rounded-lg object-cover"
            />
            <button className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
        );
      
      case 'video':
        return (
          <div className="relative max-w-sm">
            <video
              src={message.content}
              controls
              className="w-full max-h-64 rounded-lg"
              poster="https://images.pexels.com/photos/1083822/pexels-photo-1083822.jpeg?auto=compress&cs=tinysrgb&w=400"
            />
            {message.fileName && (
              <p className="text-xs text-white/60 mt-2">{message.fileName}</p>
            )}
          </div>
        );
      
      default:
        return <p className="text-white">{message.content}</p>;
    }
  };

  return (
    <div className={`flex items-end gap-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      {!isFromMe && (
        <img
          src="https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100"
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      )}
      
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isFromMe
            ? 'bg-gradient-to-br from-purple-600 to-pink-600 rounded-br-sm'
            : 'bg-white/15 backdrop-blur-sm rounded-bl-sm'
        } animate-in slide-in-from-bottom-2 duration-300`}
      >
        {renderMessageContent()}
        
        <div className={`flex items-center gap-1 mt-2 text-xs ${
          isFromMe ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-white/60">{formatTime(message.timestamp)}</span>
          <StatusIcon />
        </div>
      </div>
      
      {isFromMe && (
        <img
          src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      )}
    </div>
  );
}