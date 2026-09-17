import BoxFeatures from '@/components/box-features';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import { BadgeInfoIcon, CustomizeIcon } from '@hugeicons/core-free-icons';
import BoxContentContest from '@/components/contest/box-content-contest';
import TitleContestPageManager from '@/components/contest/title-contest-page-manager';
import BoxContentOptions from '@/components/contest/box-content-options';
import { getChefContestNavItems } from '@/lib/nav/chef-nav';
import Loading from '@/app/loading';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Competição',
};

async function ChefContestPageContent({
  params,
}: Omit<PageProps<'/chef/[id_contest]'>, 'searchParams'>) {
  const { id_contest } = await params;

  return (
    <Page>
      <Section>
        <TitleContestPageManager idContest={id_contest} />
      </Section>
      <Section className="mt-6 flex flex-col @2xl:flex-row gap-4">
        <div className="w-full @5xl/main:w-3/5">
          <BoxFeatures
            title="Detalhes da competição"
            icon={BadgeInfoIcon}
            blobSize="sm"
            blobTone="blue"
          >
            <BoxContentContest idContest={id_contest} editable={false} />
          </BoxFeatures>
        </div>
        <div className="w-full @5xl/main:w-2/5">
          <BoxFeatures
            title="Opções"
            icon={CustomizeIcon}
            blobSize="sm"
            blobTone="yellow"
          >
            <BoxContentOptions items={getChefContestNavItems(id_contest)} />
          </BoxFeatures>
        </div>
      </Section>
    </Page>
  );
}

export default function ChefContestPage({
  params,
}: PageProps<'/chef/[id_contest]'>) {
  return (
    <Suspense fallback={<Loading />}>
      <ChefContestPageContent params={params} />
    </Suspense>
  );
}
