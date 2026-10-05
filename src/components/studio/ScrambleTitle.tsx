import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

interface ScrambleTitleProps {
  text: string;
  trigger?: number;
  durationMs?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Button-only scramble. A hidden copy reserves the label's exact size while
 * the animated copy occupies the same grid cell without moving nearby UI.
 */
export function ScrambleTitle({ text, trigger = 0, durationMs = 420 }: ScrambleTitleProps) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (trigger === 0 || prefersReducedMotion()) {
      setDisplay(text);
      return;
    }

    const characters = Array.from(text);
    const lockTimes = characters.map(
      (_, index) => durationMs * (0.25 + (0.7 * index) / Math.max(characters.length - 1, 1)),
    );
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const next = characters
        .map((character, index) => {
          if (!/[a-z0-9]/i.test(character) || elapsed >= (lockTimes[index] ?? 0)) return character;
          const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? character;
          return character === character.toLowerCase() ? glyph.toLowerCase() : glyph;
        })
        .join("");
      setDisplay(next);

      if (elapsed < durationMs) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(text);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [text, trigger, durationMs]);

  return (
    <span className="inline-grid font-mono tracking-normal" aria-label={text}>
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">{text}</span>
      <span className="col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">{display}</span>
    </span>
  );
}
