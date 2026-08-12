import { Suspense } from 'react';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import Loading from '@/app/loading';
import { ClipboardCheckIcon } from '@hugeicons/core-free-icons';
import { Metadata } from 'next';
import TasksBoard from '@/app/admin/competicoes/[id_contest]/tarefas/_components/tasks-board';

export const metadata: Metadata = {
  title: 'Tarefas',
};

async function AdminTasksPageContent({
  params,
}: Omit<PageProps<'/admin/competicoes/[id_contest]/tarefas'>, 'searchParams'>) {
  const { id_contest } = await params;

  return (
    <Page>
      <Section>
        <TitlePage title="Tarefas" icon={ClipboardCheckIcon} />
      </Section>

      <Section className="mt-6 flex flex-col gap-4 @5xl:flex-row">
        <TasksBoard contestId={id_contest} />
      </Section>
    </Page>
  );
}

export default function AdminTasksPage({
  params,
}: PageProps<'/admin/competicoes/[id_contest]/tarefas'>) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminTasksPageContent params={params} />
    </Suspense>
  );
}
