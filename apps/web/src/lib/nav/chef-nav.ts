import {
  type AdminNavIcon,
  type AdminNavItem,
} from '@/lib/nav/admin-nav';

const CHEF_PATH_RE = /^\/chef\/([^/]+)/;

export function getChefContestIdFromPathname(pathname: string): string | null {
  const match = pathname.match(CHEF_PATH_RE);
  const contestId = match?.[1];
  if (!contestId || contestId === 'sobre') {
    return null;
  }
  return contestId;
}

export function getChefContestNavItems(contestId: string): AdminNavItem[] {
  const base = `/chef/${contestId}`;
  return [
    {
      title: 'Colaboradores',
      url: `${base}/colaboradores`,
      icon: 'colaboradores',
    },
    {
      title: 'Tarefas',
      url: `${base}/tarefas`,
      icon: 'tarefas',
    },
  ];
}

export function getChefPrimaryNavItems(pathname: string): AdminNavItem[] {
  const contestId = getChefContestIdFromPathname(pathname);
  if (!contestId) {
    return [];
  }

  return [
    {
      title: 'Visão geral',
      url: `/chef/${contestId}`,
      icon: 'overview',
    },
    ...getChefContestNavItems(contestId),
  ];
}

export const chefSecondaryNavItems: AdminNavItem[] = [
  { title: 'Sobre', url: '/chef/sobre', icon: 'sobre' },
];

export type { AdminNavIcon, AdminNavItem };
