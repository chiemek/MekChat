import React from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const emojis = [
    '😀', '😂', '🥰', '😍', '🤩', '😊', '😉', '😎', '🥳', '😋',
    '😘', '🤗', '🤔', '😌', '😴', '🙄', '😅', '😆', '🤣', '😭',
    '👍', '👎', '👏', '🙌', '👋', '✋', '🤝', '💪', '🙏', '❤️',
    '💕', '💖', '💗', '💙', '💜', '💚', '💛', '🧡', '🤍', '🖤',
    '🔥', '⭐', '✨', '💯', '💥', '💫', '💦', '❄️', '⚡', '🌈'
  ];

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl">
      <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/20 rounded-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}