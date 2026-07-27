import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import TitlePage from '@/components/title-page';
import { File02Icon } from '@hugeicons/core-free-icons';
import BoxQuestions from './_components/box-questions';

async function AdminExamPageContent({
  params,
}: Omit<PageProps<'/admin/competicoes/[id_contest]/prova'>, 'searchParams'>) {
  const { id_contest } = await params;

  return (
    <Page>
      <Section>
        <TitlePage title="Prova" icon={File02Icon} />
      </Section>
      <Section className="mt-6">
        <BoxQuestions contestId={id_contest} />
      </Section>
    </Page>
  );
}

export default function AdminExamPage({
  params,
}: PageProps<'/admin/competicoes/[id_contest]/prova'>) {
  return <AdminExamPageContent params={params} />;
}
