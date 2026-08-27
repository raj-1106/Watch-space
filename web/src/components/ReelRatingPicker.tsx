import React, { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

const GOLD = "#E8B23D";
const SMOKE = "#8A8578";

interface ReelRatingPickerProps {
  value: number;
  onChange: (val: number) => void;
}

export function ReelRatingPicker({ value, onChange }: ReelRatingPickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [centered, setCentered] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);
  const reducedMotion = useReducedMotion();

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const itemWidth = 64; // 64px width per number

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.scrollTo({
        left: (value - 1) * itemWidth,
        behavior: reducedMotion ? "auto" : "smooth",
      });
      setCentered(value);
    }
  }, [value, reducedMotion]);

  const handleScroll = () => {
    if (!trackRef.current) return;
    const scrollLeft = trackRef.current.scrollLeft;
    const index = Math.round(scrollLeft / itemWidth);
    const newCentered = Math.max(1, Math.min(10, index + 1));
    if (newCentered !== centered) {
      setCentered(newCentered);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleScrollEnd = () => {
    if (centered !== value) {
      onChange(centered);
    }
  };

  // Option 2 (mouse drag support), added for completeness if mouse users interact with it
  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartLeft.current = trackRef.current?.scrollLeft ?? 0;
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging || !trackRef.current) return;
    const delta = dragStartX.current - e.clientX;
    trackRef.current.scrollLeft = scrollStartLeft.current + delta;
  }

  return (
    <div className="relative w-full h-16 flex items-center justify-center overflow-hidden bg-midnight/30 rounded-xl border border-white/5 select-none touch-none">
      {/* Center Viewfinder */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[64px] border-x-2 border-gold/30 pointer-events-none z-10 bg-gold/5 rounded-md my-1" />
      
      {/* Scroll Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuenow={centered}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-label="Your rating"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") onChange(Math.min(10, value + 1));
          if (e.key === "ArrowLeft") onChange(Math.max(1, value - 1));
        }}
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { setIsDragging(false); handleScrollEnd(); }}
        onPointerLeave={() => isDragging && setIsDragging(false)}
        className="flex items-center w-full h-full overflow-x-auto hide-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        style={{
          paddingLeft: `calc(50% - ${itemWidth / 2}px)`,
          paddingRight: `calc(50% - ${itemWidth / 2}px)`,
        }}
      >
        {numbers.map((n) => {
          const isCentered = n === centered;
          return (
            <div
              key={n}
              className="flex-shrink-0 h-full flex items-center justify-center snap-center cursor-pointer"
              style={{ width: `${itemWidth}px` }}
              onClick={() => onChange(n)}
            >
              <motion.span
                animate={{
                  color: isCentered ? GOLD : SMOKE,
                  scale: isCentered ? 1.4 : 1,
                  opacity: isCentered ? 1 : 0.4,
                }}
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 28 }}
                className="font-mono font-bold text-xl"
              >
                {n}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
