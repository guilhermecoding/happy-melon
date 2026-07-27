import React from 'react';
import FlashCardOptions from './flash-card-options';
import { File02Icon, UserMultiple02Icon, ThumbsUpIcon } from '@hugeicons/core-free-icons';

export default function BoxContentOptions({
    idContest,
}: {
    idContest: string;
}) {
    return (
        <div className='flex flex-col justify-around h-full gap-4 p-4'>
            <FlashCardOptions title='Prova'
                icon={File02Icon}
                href={`/admin/competicoes/${idContest}/prova`}
            />
            <FlashCardOptions title='Times'
                icon={UserMultiple02Icon}
                href={`/admin/competicoes/${idContest}/times`}
            />
            <FlashCardOptions title='Colaboradores'
                icon={ThumbsUpIcon}
                href={`/admin/competicoes/${idContest}/colaboradores`}
            />
        </div>
    )
}
