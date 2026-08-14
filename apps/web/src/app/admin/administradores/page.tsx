import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import type { Metadata } from 'next';
import { Crown03Icon } from '@hugeicons/core-free-icons';
import { AdministratorsPanel } from './_components/administrators-panel';
import TitlePage from '@/components/title-page';

export const metadata: Metadata = {
  title: 'Administradores',
};

export default function AdminUsersPage() {
  return (
    <Page>
      <Section>
        <TitlePage title="Administradores do Sistema" icon={Crown03Icon} />
      </Section>
      <Section className="mt-6 flex flex-col gap-4">
        <AdministratorsPanel />
      </Section>
    </Page>
  );
}