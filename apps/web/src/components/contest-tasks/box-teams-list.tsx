"use client";

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft01Icon,
    ArrowRight01Icon,
    Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { isResolvedBalloonStatus } from '@repo/shared';
import { Button } from '@/components/ui/button';
import { balloonService } from '@/services/balloon/balloon.service';
import type { BalloonDelivery } from '@/services/balloon/balloon.type';
import { teamService } from '@/services/team/team.service';
import { getTeamErrorMessage } from '@/services/team/team.error';
import type { Team } from '@/services/team/team.type';
import { questionService } from '@/services/question/question.service';
import { TeamBalloonsDialog } from './team-balloons-dialog';
import FlashCardTeam from './flash-card-team';
import Spinner from '@/components/spinner';
import EmptyIcon from '@/components/empty-icon';
import { Input } from '../pouf/Input';

type BoxTeamsListProps = {
    contestId: string;
    onDeliveryChanged?: () => void;
};

const PAGE_SIZE = 21;

function matchesSearch(team: Team, query: string) {
    if (!query) {
        return true;
    }

    const haystack = `${team.name} ${team.usernameTeam}`.toLowerCase();
    return haystack.includes(query);
}

function countConqueredBalloons(deliveries: BalloonDelivery[]) {
    const counts = new Map<string, number>();

    for (const delivery of deliveries) {
        if (!isResolvedBalloonStatus(delivery.status)) {
            continue;
        }

        counts.set(delivery.teamId, (counts.get(delivery.teamId) ?? 0) + 1);
    }

    return counts;
}

export default function BoxTeamsList({
    contestId,
    onDeliveryChanged,
}: BoxTeamsListProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [deliveries, setDeliveries] = useState<BalloonDelivery[]>([]);
    const [questionsCount, setQuestionsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [page, setPage] = useState(1);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [achievementsOpen, setAchievementsOpen] = useState(false);

    const conqueredCountByTeamId = useMemo(
        () => countConqueredBalloons(deliveries),
        [deliveries],
    );

    const rankedTeams = useMemo(
        () =>
            [...teams].sort((a, b) => {
                const aCount = conqueredCountByTeamId.get(a.id) ?? 0;
                const bCount = conqueredCountByTeamId.get(b.id) ?? 0;

                if (bCount !== aCount) {
                    return bCount - aCount;
                }

                return a.name.localeCompare(b.name, 'pt-BR', {
                    sensitivity: 'base',
                });
            }),
        [teams, conqueredCountByTeamId],
    );

    const filteredTeams = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();
        if (!query) {
            return rankedTeams;
        }

        return rankedTeams.filter((team) => matchesSearch(team, query));
    }, [rankedTeams, deferredSearch]);

    const rankByTeamId = useMemo(() => {
        const ranks = new Map<string, number>();
        rankedTeams.forEach((team, index) => {
            ranks.set(team.id, index + 1);
        });
        return ranks;
    }, [rankedTeams]);

    const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);

    const paginatedTeams = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredTeams.slice(start, start + PAGE_SIZE);
    }, [filteredTeams, currentPage]);

    const rangeStart =
        filteredTeams.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredTeams.length);

    useEffect(() => {
        setPage(1);
    }, [deferredSearch]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    useEffect(() => {
        let active = true;

        async function loadData() {
            setLoading(true);
            setError(undefined);

            try {
                const [teamsData, questionsData, deliveriesData] =
                    await Promise.all([
                        teamService.list(contestId),
                        questionService.list(contestId),
                        balloonService.listDeliveries(contestId),
                    ]);

                if (!active) return;

                setTeams(teamsData);
                setQuestionsCount(questionsData.length);
                setDeliveries(deliveriesData);
            } catch (loadError) {
                if (active) {
                    setError(
                        getTeamErrorMessage(
                            loadError,
                            'Não foi possível carregar os times.',
                        ),
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadData();

        return () => {
            active = false;
        };
    }, [contestId]);

    function openAchievements(team: Team) {
        setSelectedTeam(team);
        setAchievementsOpen(true);
    }

    function applyDelivery(delivery?: BalloonDelivery) {
        if (delivery) {
            setDeliveries((current) => {
                const index = current.findIndex(
                    (item) =>
                        item.id === delivery.id ||
                        (item.teamId === delivery.teamId &&
                            item.questionId === delivery.questionId),
                );

                if (index >= 0) {
                    const next = [...current];
                    next[index] = delivery;
                    return next;
                }

                return [...current, delivery];
            });
        }
        onDeliveryChanged?.();
    }

    return (
        <>
            <div className="flex flex-col gap-4 p-4">
                <div className="w-full @3xl/main:max-w-86 flex justify-end">
                    <Input
                        value={search}
                        onChange={(value) => setSearch(value)}
                        placeholder="Buscar por nome do time ou usuário..."
                        aria-label="Buscar times"
                        icon={
                            <HugeiconsIcon
                                icon={Search01Icon}
                                className="size-5"
                                strokeWidth={2}
                            />
                        }
                    />
                </div>

                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}

                {loading ? (
                    <Spinner />
                ) : filteredTeams.length === 0 ? (
                    <div className="flex h-56 w-full flex-col items-center justify-center gap-2">
                        <EmptyIcon className="size-14 text-muted-foreground opacity-70" />
                        <p className="text-center text-sm text-muted-foreground">
                            {search.trim()
                                ? 'Nenhum time encontrado para a busca.'
                                : 'Nenhum time cadastrado.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {paginatedTeams.map((team) => (
                                <FlashCardTeam
                                    key={team.id}
                                    index={rankByTeamId.get(team.id) ?? 0}
                                    name={team.name}
                                    usernameTeam={team.usernameTeam}
                                    teamId={team.id}
                                    balloonsCount={
                                        conqueredCountByTeamId.get(team.id) ?? 0
                                    }
                                    balloonsTotal={questionsCount}
                                    onClick={() => openAchievements(team)}
                                />
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {rangeStart}–{rangeEnd} de {filteredTeams.length}
                                {totalPages > 1
                                    ? ` · Página ${currentPage} de ${totalPages}`
                                    : null}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="white"
                                    size="sm"
                                    className="w-full sm:w-fit"
                                    disabled={currentPage <= 1}
                                    onClick={() =>
                                        setPage((current) => Math.max(1, current - 1))
                                    }
                                >
                                    <HugeiconsIcon
                                        icon={ArrowLeft01Icon}
                                        className="size-4"
                                        strokeWidth={2}
                                    />
                                    Anterior
                                </Button>
                                <Button
                                    type="button"
                                    variant="white"
                                    size="sm"
                                    className="w-full sm:w-fit"
                                    disabled={currentPage >= totalPages}
                                    onClick={() =>
                                        setPage((current) => Math.min(totalPages, current + 1))
                                    }
                                >
                                    Próxima
                                    <HugeiconsIcon
                                        icon={ArrowRight01Icon}
                                        className="size-4"
                                        strokeWidth={2}
                                    />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <TeamBalloonsDialog
                contestId={contestId}
                team={selectedTeam}
                open={achievementsOpen}
                onDeliveryChanged={applyDelivery}
                onOpenChange={(nextOpen) => {
                    setAchievementsOpen(nextOpen);
                    if (!nextOpen) {
                        setSelectedTeam(null);
                    }
                }}
            />
        </>
    );
}
