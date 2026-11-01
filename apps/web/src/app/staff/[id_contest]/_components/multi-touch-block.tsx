'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function MultiTouchBlock() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label="Bloqueio de multi-toque"
    >
      <p className="max-w-md text-center text-xl font-bold text-white">
        Você está temporariamente impedido de pegar tarefas.
      </p>
    </div>,
    document.body,
  );
}
