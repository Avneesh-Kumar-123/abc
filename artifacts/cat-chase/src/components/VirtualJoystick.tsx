import { useRef, useState } from "react";

type Props = {
  onChange: (dx: number, dy: number) => void;
};

export const VirtualJoystick = ({ onChange }: Props) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [stick, setStick] = useState<{ x: number; y: number } | null>(null);
  const activeId = useRef<number | null>(null);

  const compute = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const max = rect.width / 2;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, max);
    const angle = Math.atan2(dy, dx);
    const sx = Math.cos(angle) * clamped;
    const sy = Math.sin(angle) * clamped;
    setStick({ x: sx, y: sy });
    onChange(sx / max, sy / max);
  };

  return (
    <div
      className="fixed bottom-6 left-6 z-30 touch-none select-none md:hidden"
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        if (!t) return;
        activeId.current = t.identifier;
        compute(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier === activeId.current) {
            compute(t.clientX, t.clientY);
          }
        }
      }}
      onTouchEnd={(e) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier === activeId.current) {
            activeId.current = null;
            setStick(null);
            onChange(0, 0);
          }
        }
      }}
    >
      <div
        ref={baseRef}
        className="relative h-32 w-32 rounded-full border-4 border-primary/40 bg-card/70 backdrop-blur shadow-lg"
      >
        <div
          className="absolute h-14 w-14 rounded-full bg-primary border-4 border-primary-border shadow-md"
          style={{
            left: `calc(50% - 28px + ${stick?.x ?? 0}px)`,
            top: `calc(50% - 28px + ${stick?.y ?? 0}px)`,
            transition: stick ? "none" : "all 120ms",
          }}
        />
      </div>
    </div>
  );
};
