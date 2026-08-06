export type AdminNavIcon =
  | 'home'
  | 'competicoes'
  | 'administradores'
  | 'overview'
  | 'colaboradores'
  | 'prova'
  | 'tarefas'
  | 'times'
  | 'sobre';

export type AdminNavItem = {
  title: string;
  url: string;
  icon: AdminNavIcon;
};

const CONTEST_PATH_RE = /^\/admin\/competicoes\/([^/]+)/;

export function getContestIdFromPathname(pathname: string): string | null {
  const match = pathname.match(CONTEST_PATH_RE);
  return match?.[1] ?? null;
}

/** Feature links shared by contest hub cards and in-contest sidebar. */
export function getContestNavItems(contestId: string): AdminNavItem[] {
  const base = `/admin/competicoes/${contestId}`;
  return [
    {
      title: 'Colaboradores',
      url: `${base}/colaboradores`,
      icon: 'colaboradores',
    },
    {
      title: 'Prova',
      url: `${base}/prova`,
      icon: 'prova',
    },
    {
      title: 'Tarefas',
      url: `${base}/tarefas`,
      icon: 'tarefas',
    },
    {
      title: 'Times',
      url: `${base}/times`,
      icon: 'times',
    },
  ];
}

export function getPrimaryNavItems(pathname: string): AdminNavItem[] {
  const contestId = getContestIdFromPathname(pathname);

  if (contestId) {
    return [
      {
        title: 'Visão geral',
        url: `/admin/competicoes/${contestId}`,
        icon: 'overview',
      },
      ...getContestNavItems(contestId),
    ];
  }

  return [
    { title: 'Início', url: '/admin/home', icon: 'home' },
    { title: 'Competições', url: '/admin/competicoes', icon: 'competicoes' },
    {
      title: 'Administradores',
      url: '/admin/administradores',
      icon: 'administradores',
    },
  ];
}

export const secondaryNavItems: AdminNavItem[] = [
  { title: 'Sobre', url: '/admin/sobre', icon: 'sobre' },
];

export function isNavItemActive(pathname: string, url: string): boolean {
  if (pathname === url) return true;
  // Contest hub and competition list: exact only (nested routes use other items)
  if (
    url === '/admin/competicoes' ||
    /^\/admin\/competicoes\/[^/]+$/.test(url)
  ) {
    return false;
  }
  return pathname.startsWith(`${url}/`);
}
