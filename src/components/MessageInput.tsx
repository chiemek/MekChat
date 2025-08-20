import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff, Image, Video, Smile } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { EmojiPicker } from './EmojiPicker';
import { cloudinaryService } from '../services/cloudinaryService';

export function MessageInput() {
  const { addMessage, isRecording, startRecording, stopRecording, handleTyping } = useChat();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Handle typing indicators
    if (newMessage.trim() && !message.trim()) {
      handleTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (newMessage.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 1000);
    } else {
      handleTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      handleTyping(false);
      addMessage({
        type: 'text',
        content: message.trim(),
        sender: 'me'
      });
      setMessage('');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartRecording = async () => {
    await startRecording();
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = async () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    
    const audioBlob = await stopRecording();
    if (audioBlob) {
      try {
        const result = await cloudinaryService.uploadAudio(audioBlob);
        addMessage({
          type: 'voice',
          content: result.secure_url,
          sender: 'me',
          duration: recordingTime
        });
      } catch (error) {
        console.error('Failed to upload audio:', error);
        // Fallback to local URL
        const audioUrl = URL.createObjectURL(audioBlob);
        addMessage({
          type: 'voice',
          content: audioUrl,
          sender: 'me',
          duration: recordingTime
        });
      }
    }
    setRecordingTime(0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const result = await cloudinaryService.uploadImage(file);
      addMessage({
        type: 'image',
        content: result.secure_url,
        sender: 'me',
        fileName: file.name
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      // Fallback to local URL
      const imageUrl = URL.createObjectURL(file);
      addMessage({
        type: 'image',
        content: imageUrl,
        sender: 'me',
        fileName: file.name
      });
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleVideoUploadToCloud(file);
    }
  };

  const handleVideoUploadToCloud = async (file: File) => {
    try {
      const result = await cloudinaryService.uploadVideo(file);
      addMessage({
        type: 'video',
        content: result.secure_url,
        sender: 'me',
        fileName: file.name
      });
    } catch (error) {
      console.error('Failed to upload video:', error);
      // Fallback to local URL
      const videoUrl = URL.createObjectURL(file);
      addMessage({
        type: 'video',
        content: videoUrl,
        sender: 'me',
        fileName: file.name
      });
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="p-4 border-t border-white/10 bg-white/5">
      {isRecording && (
        <div className="mb-4 flex items-center justify-center gap-3 p-3 bg-red-500/20 rounded-xl border border-red-500/30">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-medium">Recording: {formatRecordingTime(recordingTime)}</span>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 relative min-w-0">
          <textarea
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-3 pr-24 lg:pr-20 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all backdrop-blur-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          <div className="absolute right-1 top-1 flex items-center gap-0.5 lg:gap-1">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 lg:p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Smile className="w-4 h-4 lg:w-5 lg:h-5 text-white/70" />
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 lg:p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Image className="w-4 h-4 lg:w-5 lg:h-5 text-white/70" />
            </button>
            
            <button
              onClick={() => videoInputRef.current?.click()}
              className="p-1.5 lg:p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Video className="w-4 h-4 lg:w-5 lg:h-5 text-white/70" />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 right-0">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
        </div>

        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`p-2.5 lg:p-3 rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 scale-110'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {isRecording ? (
            <MicOff className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          ) : (
            <Mic className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          )}
        </button>

        <button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className={`p-2.5 lg:p-3 rounded-full transition-all duration-200 ${
            message.trim()
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 scale-100'
              : 'bg-white/10 scale-95 opacity-50'
          }`}
        >
          <Send className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />
    </div>
  );
}