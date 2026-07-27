import { HugeiconsIcon } from '@hugeicons/react';
import { BalloonIcon, ViewIcon, DateTimeIcon } from '@hugeicons/core-free-icons';
import { Suspense } from 'react';
import { formatDateTime } from '@/lib/format-data';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { cn } from '@/lib/utils';

function BoxContentContesSkeleton() {
    return (
        <div className='p-4 flex flex-col gap-2'>
            {Array.from({ length: 4 }).map((_, index) => (
                <React.Fragment key={index}>
                    <Skeleton className='w-20 h-3 bg-muted-foreground/20' />
                    <Skeleton className='w-50 h-5 bg-muted-foreground/20' />
                </React.Fragment>
            ))}
        </div>
    )
}

async function BoxContentContestFetch({
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
                    {getContestErrorMessage(
                        error,
                        'Não foi possível carregar a competição.',
                    )}
                </p>
            </div>
        );
    }

    return (
        <div className='p-4 flex flex-col gap-2'>
            {/* Nome da competição */}
            <div className='flex flex-col'>
                <div className='flex items-center gap-1 text-muted-foreground font-medium'>
                    <HugeiconsIcon
                        icon={BalloonIcon}
                        className="size-4 shrink-0"
                        strokeWidth={2}
                    />
                    <span>Competição</span>
                </div>
                <span className='text-lg font-bold'>{contest.name}</span>
            </div>

            {/* ID da competição */}
            <div className='flex flex-col'>
                <div className='flex items-center gap-1 text-muted-foreground font-medium'>
                    #
                    <span>ID</span>
                </div>
                <span className='text-lg font-bold'>{contest.id}</span>
            </div>

            {/* Status da competição */}
            <div className='flex flex-col'>
                <div className='flex items-center gap-1 text-muted-foreground font-medium'>
                    <HugeiconsIcon
                        icon={ViewIcon}
                        className="size-4 shrink-0"
                        strokeWidth={2}
                    />
                    <span>Status</span>
                </div>
                <span className={cn(
                    'text-lg font-bold',
                    contest.status === 'active' ? 'text-green-500' : 'text-red-500'
                )}>
                    {contest.status === 'active' ? 'Habilitada' : 'Desabilitada'}
                </span>
            </div>

            {/* Data e hora de início e término da competição */}
            <div className='flex flex-col'>
                <div className='flex items-center gap-1 text-muted-foreground font-medium'>
                    <HugeiconsIcon
                        icon={DateTimeIcon}
                        className="size-4 shrink-0"
                        strokeWidth={2}
                    />
                    <span>Período de prova</span>
                </div>
                <span className='text-lg font-bold'>
                    {formatDateTime(new Date(contest.startsAt))} &bull;{' '}
                    {formatDateTime(new Date(contest.endsAt))}
                </span>
            </div>
        </div>
    );
}

export default function BoxContentContest({
    idContest,
}: {
    idContest: string;
}) {
    return (
        <Suspense fallback={<BoxContentContesSkeleton />}>
            <BoxContentContestFetch idContest={idContest} />
        </Suspense>
    )
}
