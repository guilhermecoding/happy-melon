import BoxFeatures from '@/components/box-features';
import { FilterVerticalIcon, UserIcon } from '@hugeicons/core-free-icons';
import type { Contest } from '@/services/contest/contest.type';
import BoxAccessControllCollab from './box-access-controll-collab';
import BoxListCollaborators from './box-list-collaborators';

export function CollaboratorsGeralPanel({ contest }: { contest: Contest }) {
    return (
        <div className="mt-4 flex flex-col gap-4 @5xl/main:flex-row">
            <div className="w-full @5xl/main:w-3/5">
                <BoxFeatures title="Lista de colaboradores"
                    icon={UserIcon}
                    blobSize="sm"
                    blobTone="yellow"
                >
                    <BoxListCollaborators contestId={contest.id} />
                </BoxFeatures>
            </div>
            <div className="w-full @5xl/main:w-2/5">
                <BoxFeatures title="Controle e acesso"
                    icon={FilterVerticalIcon}
                    blobSize="sm"
                    blobTone="mint"
                >
                    <BoxAccessControllCollab contest={contest} />
                </BoxFeatures>
            </div>
        </div>
    );
}
