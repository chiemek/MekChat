import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';

interface Call {
  id: string;
  participants: any[];
  type: 'audio' | 'video';
  status: 'connecting' | 'connected' | 'ended';
}

interface CallInterfaceProps {
  call: Call;
  onEndCall: () => void;
  onUpdateCall: (call: Call) => void;
}

export function CallInterface({ call, onEndCall, onUpdateCall }: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const contact = call.participants.find(p => p.id !== 'current-user') || call.participants[0];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (call.status === 'connecting') {
      // Simulate call connection after 3 seconds
      const timeout = setTimeout(() => {
        onUpdateCall({ ...call, status: 'connected' });
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
    
    if (call.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [call.status, onUpdateCall]);

  useEffect(() => {
    // Initialize local video stream for video calls
    if (call.type === 'video' && call.status === 'connected') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(error => console.error('Error accessing media devices:', error));
    }
  }, [call.type, call.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    // Stop all media tracks
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="w-full h-full flex flex-col">
        {call.type === 'video' && call.status === 'connected' ? (
          <div className="flex-1 relative">
            {/* Remote video (main view) */}
            <div className="w-full h-full bg-gray-900 relative overflow-hidden">
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover"
                poster={call.contact.avatar}
                autoPlay
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* Local video (picture-in-picture) */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                  autoPlay
                  playsInline
                  muted
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <VideoOff className="w-6 h-6 text-white/70" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <img
                  src={contact.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
                  alt={contact.name || 'Contact'}
                  className="w-full h-full rounded-full object-cover"
                />
                {call.status === 'connecting' && (
                  <div className="absolute -inset-4 border-4 border-white/30 rounded-full animate-ping" />
                )}
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {contact.name || 'Unknown Contact'}
              </h2>
              <p className="text-white/70 text-lg">
                {call.status === 'connecting' 
                  ? `${call.type === 'video' ? 'Video' : 'Audio'} calling...`
                  : formatDuration(callDuration)
                }
              </p>
            </div>
          </div>
        )}

        {/* Call controls */}
        <div className="p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition-all duration-200 ${
                isMuted
                  ? 'bg-red-500/20 border-2 border-red-500'
                  : 'bg-white/10 border-2 border-white/20'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-red-500" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {call.type === 'audio' && (
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isSpeakerOn
                    ? 'bg-blue-500/20 border-2 border-blue-500'
                    : 'bg-white/10 border-2 border-white/20'
                }`}
              >
                {isSpeakerOn ? (
                  <Volume2 className="w-6 h-6 text-blue-500" />
                ) : (
                  <VolumeX className="w-6 h-6 text-white" />
                )}
              </button>
            )}

            {call.type === 'video' && (
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isVideoOff
                    ? 'bg-red-500/20 border-2 border-red-500'
                    : 'bg-white/10 border-2 border-white/20'
                }`}
              >
                {isVideoOff ? (
                  <VideoOff className="w-6 h-6 text-red-500" />
                ) : (
                  <Video className="w-6 h-6 text-white" />
                )}
              </button>
            )}

            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 scale-110"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}