import React from 'react';
import FlashCardOptions from './flash-card-options';
import {
  ClipboardCheckIcon,
  Crown03Icon,
  File02Icon,
  ThumbsUpIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';

export type ContestOptionItem = {
  title: string;
  url: string;
  icon: string;
};

const contestCardIcons: Record<string, IconSvgElement> = {
  colaboradores: ThumbsUpIcon,
  prova: File02Icon,
  tarefas: ClipboardCheckIcon,
  times: UserMultiple02Icon,
  chefes: Crown03Icon,
};

export default function BoxContentOptions({
  items,
}: {
  items: ContestOptionItem[];
}) {
  return (
    <div className="flex flex-col justify-around h-full gap-4 p-4">
      {items.map((item, index) => {
        const icon = contestCardIcons[item.icon];
        if (!icon) return null;
        return (
          <FlashCardOptions
            key={item.url}
            title={item.title}
            icon={icon}
            href={item.url}
            index={index}
          />
        );
      })}
    </div>
  );
}
