import React from 'react';
import FlashCardOptions from './flash-card-options';
import {
  File02Icon,
  UserMultiple02Icon,
  ThumbsUpIcon,
  ClipboardCheckIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { getContestNavItems, type AdminNavIcon } from '@/lib/nav/admin-nav';

const contestCardIcons: Partial<Record<AdminNavIcon, IconSvgElement>> = {
  colaboradores: ThumbsUpIcon,
  prova: File02Icon,
  tarefas: ClipboardCheckIcon,
  times: UserMultiple02Icon,
};

export default function BoxContentOptions({
  idContest,
}: {
  idContest: string;
}) {
  const items = getContestNavItems(idContest);

  return (
    <div className="flex flex-col justify-around h-full gap-4 p-4">
      {items.map((item) => {
        const icon = contestCardIcons[item.icon];
        if (!icon) return null;
        return (
          <FlashCardOptions
            key={item.url}
            title={item.title}
            icon={icon}
            href={item.url}
          />
        );
      })}
    </div>
  );
}
