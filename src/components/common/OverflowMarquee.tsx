import React, { useEffect, useRef, useState } from 'react';

interface OverflowMarqueeProps {
  text: string;
  className?: string;
  scrollOnOverflow?: boolean;
}

export const OverflowMarquee: React.FC<OverflowMarqueeProps> = ({ text, className = '', scrollOnOverflow = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [durationSec, setDurationSec] = useState(10);
  const [distancePx, setDistancePx] = useState(0);

  useEffect(() => {
    const recompute = () => {
      const container = containerRef.current;
      const measureEl = measureRef.current;
      if (!container || !measureEl) return;
      const overflowAmount = Math.max(0, measureEl.scrollWidth - container.clientWidth);
      const overflow = overflowAmount > 0;
      setShouldMarquee(overflow);
      if (overflow) {
        setDistancePx(overflowAmount);
        const pxPerSec = 45;
        setDurationSec(Math.max(8, (overflowAmount + container.clientWidth) / pxPerSec));
      }
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    if (containerRef.current) observer.observe(containerRef.current);
    if (textRef.current) observer.observe(textRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className={`relative min-w-0 overflow-hidden ${className}`}>
      <span ref={measureRef} className="pointer-events-none absolute invisible whitespace-nowrap">
        {text}
      </span>
      <span
        ref={textRef}
        className={
          shouldMarquee
            ? (scrollOnOverflow ? 'inline-block whitespace-nowrap pr-4' : 'overflow-marquee inline-block whitespace-nowrap pr-10')
            : 'truncate block'
        }
        style={
          shouldMarquee && !scrollOnOverflow
            ? ({
                ['--overflow-marquee-duration' as string]: `${durationSec}s`,
                ['--overflow-marquee-distance' as string]: `${distancePx}px`
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
};

