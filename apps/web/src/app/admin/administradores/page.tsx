import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import type { Metadata } from 'next';
import { HugeiconsIcon } from '@hugeicons/react';
import { Crown03Icon } from '@hugeicons/core-free-icons';
import { AdministratorsPanel } from './_components/administrators-panel';

export const metadata: Metadata = {
  title: 'Administradores',
};

export default function AdminUsersPage() {
  return (
    <Page>
      <Section>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Crown03Icon}
            className="size-8"
            strokeWidth={2}
          />
          <h1 className="text-3xl font-bold">Administradores do Sistema</h1>
        </div>
      </Section>
      <Section>
        <AdministratorsPanel />
      </Section>
    </Page>
  );
}