import { Phone, Video, MoreVertical } from "lucide-react";
import { Contact } from "../context/ChatContext";

interface ChatHeaderProps {
  contact: Contact;
  onCall: (call: {
    type: "audio" | "video";
    contact: Contact;
    status: "calling";
  }) => void;
}

export function ChatHeader({ contact, onCall }: ChatHeaderProps) {
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="px-6 py-4 border-b border-white/10 bg-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                contact.status === "online"
                  ? "bg-green-500"
                  : contact.status === "away"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
            />
          </div>

          <div>
            <h2 className="font-semibold text-white">{contact.name}</h2>
            <p className="text-sm text-white/60">
              {contact.isTyping
                ? "typing..."
                : contact.status === "online"
                ? "Online"
                : contact.lastSeen
                ? `Last seen ${formatLastSeen(contact.lastSeen)}`
                : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onCall({ type: "audio", contact, status: "calling" })
            }
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Phone className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() =>
              onCall({ type: "video", contact, status: "calling" })
            }
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Video className="w-5 h-5 text-white" />
          </button>
          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
