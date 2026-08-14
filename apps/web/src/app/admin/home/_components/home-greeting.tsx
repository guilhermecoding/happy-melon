'use client';

import { useSyncExternalStore } from 'react';

import GreetingSkeleton from '@/components/skeletons/gretting-skeleton';
import { authClient } from '@/lib/auth-client';
import { formatUserGreeting, getTimeOfDayGreeting } from '@/lib/greeting';

function subscribe() {
  return () => {};
}

export default function HomeGreeting() {
  const { data: session, isPending } = authClient.useSession();
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  if (!isClient || isPending) {
    return <GreetingSkeleton />;
  }

  const name = session?.user.name;
  const text = name
    ? formatUserGreeting(name)
    : `${getTimeOfDayGreeting()}!`;

  return <h1 className="text-3xl font-bold">{text}</h1>;
}
