import React from 'react';
import { Suspense } from 'react';
import TitlePage from '@/components/title-page';
import { Wrench01Icon } from '@hugeicons/core-free-icons';
import GreetingSkeleton from '@/components/skeletons/gretting-skeleton';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';

async function TitleContestPageManagerFetch({
    idContest,
}: {
    idContest: string;
}) {
    let contest;
    try {
        contest = await contestService.get(idContest);
    } catch (error) {
        return (
            <div className="p-4">
                <p role="alert" className="text-sm text-destructive">
                    {getContestErrorMessage(error, 'Não foi possível carregar a competição.')}
                </p>
            </div>
        );
    }

    return (
        <TitlePage
            title={`Gerenciar ${contest.name}`}
            icon={Wrench01Icon}
        />
    )
}

export default function TitleContestPageManager({
    idContest,
}: {
    idContest: string;
}) {
    return (
        <Suspense fallback={<GreetingSkeleton />}>
            <TitleContestPageManagerFetch idContest={idContest} />
        </Suspense>
    )
}
