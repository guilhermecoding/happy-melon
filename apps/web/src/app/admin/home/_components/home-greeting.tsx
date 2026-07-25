'use client';

import { authClient } from '@/lib/auth-client';
import { formatUserGreeting, getTimeOfDayGreeting } from '@/lib/greeting';

export default function HomeGreeting() {
  const { data: session } = authClient.useSession();
  const name = session?.user.name;

  const text = name
    ? formatUserGreeting(name)
    : `${getTimeOfDayGreeting()}!`;

  return <h1 className="text-3xl font-bold">{text}</h1>;
}
