import { Suspense } from 'react';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import type { Metadata } from 'next';
import { Crown03Icon } from '@hugeicons/core-free-icons';
import { ChefsPanel } from './_components/chefs-panel';
import TitlePage from '@/components/title-page';
import Loading from '@/app/loading';

export const metadata: Metadata = {
  title: 'Chefes',
};

async function AdminChefsPageContent({
  params,
}: Omit<PageProps<'/admin/competicoes/[id_contest]/chefes'>, 'searchParams'>) {
  const { id_contest } = await params;

  return (
    <Page>
      <Section>
        <TitlePage title="Chefes da competição" icon={Crown03Icon} />
      </Section>
      <Section className="mt-6 flex flex-col gap-4">
        <ChefsPanel contestId={id_contest} />
      </Section>
    </Page>
  );
}

export default function AdminChefsPage(
  props: PageProps<'/admin/competicoes/[id_contest]/chefes'>,
) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminChefsPageContent params={props.params} />
    </Suspense>
  );
}
