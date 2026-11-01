'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, useReducedMotion } from 'motion/react';

type MultiTouchBlockProps = {
  bannedUntil: string | null;
  durationSeconds: number | null;
};

function remainingRatio(
  bannedUntil: string | null,
  durationSeconds: number | null,
): number {
  if (!bannedUntil || durationSeconds == null || durationSeconds <= 0) {
    return 1;
  }

  const end = new Date(bannedUntil).getTime();
  if (!Number.isFinite(end)) return 1;

  const totalMs = durationSeconds * 1000;
  const remaining = end - Date.now();
  if (remaining <= 0) return 0;
  return Math.min(1, remaining / totalMs);
}

function DrainBar({ bannedUntil, durationSeconds }: MultiTouchBlockProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let frame = 0;

    const tick = () => {
      const ratio = remainingRatio(bannedUntil, durationSeconds);
      const fill = fillRef.current;
      const track = trackRef.current;
      if (fill) {
        fill.style.width = `${ratio * 100}%`;
      }
      track?.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      frame = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frame);
  }, [bannedUntil, durationSeconds]);

  return (
    <div
      ref={trackRef}
      className="h-3 w-64 overflow-hidden rounded-full bg-white/25"
      role="progressbar"
      aria-label="Tempo restante do bloqueio"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={100}
    >
      <div
        ref={fillRef}
        className="h-full rounded-full bg-white"
        style={{ width: '100%' }}
      />
    </div>
  );
}

export default function MultiTouchBlock({
  bannedUntil,
  durationSeconds,
}: MultiTouchBlockProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-70 flex items-center justify-center bg-linear-to-t from-orange-500 to-orange-100 p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label="Bloqueio de multi-toque"
      initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
      animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
      transition={
        reduceMotion
          ? { duration: 0.15, ease: 'easeOut' }
          : { duration: 0.45, ease: 'easeOut' }
      }
    >
      <motion.div
        className="flex flex-col items-center justify-center gap-4"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.3, delay: 0.45, ease: 'easeOut' }
        }
      >
        <div className="flex items-center justify-center">
          <DotLottieReact src="/animations/fire.lottie" loop autoplay />
        </div>
        <h1 className="text-3xl font-black text-white text-center">
          CALMA, MÃOZINHA NERVOSA!
        </h1>
        <p className="text-lg text-muted text-center">
          Isso significa que é hora de uma pausa. <br /> Basta esperar um pouco e você poderá pegar outra tarefa.
        </p>
        <DrainBar bannedUntil={bannedUntil} durationSeconds={durationSeconds} />
      </motion.div>
    </motion.div>,
    document.body,
  );
}
