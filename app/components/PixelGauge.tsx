import { memo } from 'react';

interface PixelGaugeProps {
  value: number;
  blocks?: number;
  height?: 'sm' | 'md';
  glow?: boolean;
}

export const PixelGauge = memo(function PixelGauge({
  value,
  blocks = 10,
  height = 'md',
  glow = false,
}: PixelGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const filledBlocks = Math.round((clamped / 100) * blocks);
  const heightClass = height === 'sm' ? 'h-1.5' : 'h-3';

  return (
    <div className="flex gap-[2px] w-full">
      {Array.from({ length: blocks }).map((_, idx) => {
        const isFilled = idx < filledBlocks;
        const isCurrent = isFilled && idx === filledBlocks - 1;
        return (
          <div
            key={idx}
            className={`flex-1 ${heightClass} transition-all duration-200 ${
              isFilled
                ? `bg-[#00ff00]${isCurrent ? ' animate-pulse' : ''}${glow ? ' shadow-[0_0_4px_#00ff00]' : ''}`
                : 'bg-[#00ff00]/5 border border-[#00ff00]/20'
            }`}
          />
        );
      })}
    </div>
  );
});
