import { cn } from '@/shared/lib/utils';

export const EMOJI_OPTIONS = [
  '🎯','🏖️','🛡️','💻','🚗','🏠','✈️','🎓','💊','🍔','🛒','🎮','🎵','☕',
  '🐾','💪','💍','🚀','🌱','🎁','📱','🏋️','🎨','📚','🏥','⚡','🌍','💼',
];

export function EmojiPickerGrid({
  selected,
  onSelect,
  className,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-5 md:grid-cols-6 gap-2 p-1", className)}>
      {EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={cn(
            "w-11 h-11 md:w-11 md:h-11 flex items-center justify-center text-xl rounded-xl transition-all border",
            selected === emoji
              ? "bg-white/20 ring-2 ring-white/40 border-white/30"
              : "bg-white/[0.03] border-white/[0.06] hover:bg-white/10 hover:border-white/20"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
