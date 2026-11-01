'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BadgeInfoIcon,
  Search01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import BoxFeatures from '@/components/box-features'
import Spinner from '@/components/spinner'
import { Button, IconButton } from '@/components/pouf/Button'
import { Input } from '@/components/pouf/Input'
import { Table } from '@/components/pouf/table'
import { useTeamList } from '@/services/team/use-team-list'
import type { Team } from '@/services/team/team.type'
import { StaffTeamInfoSheet } from './staff-team-info-sheet'

type StaffTeamsPanelProps = {
  contestId: string
}

const PAGE_SIZE = 10

function matchesSearch(team: Team, query: string) {
  if (!query) {
    return true
  }

  const haystack = [
    team.id,
    team.name,
    team.usernameTeam,
    team.room ?? '',
    team.machine ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

export function StaffTeamsPanel({ contestId }: StaffTeamsPanelProps) {
  const { teams, setTeams, loading, error } = useTeamList(contestId)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [page, setPage] = useState(1)
  const [infoOpen, setInfoOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const filteredTeams = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return teams
      .filter((team) => matchesSearch(team, query))
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
      )
  }, [teams, deferredSearch])

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredTeams.slice(start, start + PAGE_SIZE)
  }, [filteredTeams, currentPage])

  const rangeStart =
    filteredTeams.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredTeams.length)

  useEffect(() => {
    setPage(1)
  }, [deferredSearch])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (!selectedTeam) return
    const next = teams.find((team) => team.id === selectedTeam.id)
    if (!next) {
      setInfoOpen(false)
      setSelectedTeam(null)
      return
    }
    if (next.updatedAt !== selectedTeam.updatedAt) {
      setSelectedTeam(next)
    }
  }, [teams, selectedTeam])

  function openInfo(team: Team) {
    setSelectedTeam(team)
    setInfoOpen(true)
  }

  function handleUpdated(team: Team) {
    setTeams((current) =>
      current.map((item) => (item.id === team.id ? team : item)),
    )
    setSelectedTeam(team)
  }

  const columns = [
    {
      key: 'info',
      header: 'Info',
      render: (team: Team) => (
        <IconButton
          variant="ghost"
          size="sm"
          tone="orange"
          label={`Informações de ${team.name}`}
          icon={
            <HugeiconsIcon
              icon={BadgeInfoIcon}
              className="size-5"
              strokeWidth={2}
            />
          }
          onClick={() => openInfo(team)}
        />
      ),
    },
    {
      key: 'name',
      header: 'Nome',
      render: (team: Team) => team.name,
    },
  ]

  return (
    <>
      <BoxFeatures
        title="Competidores"
        icon={UserMultiple02Icon}
        blobSize="sm"
        blobTone="orange"
      >
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex w-full justify-start sm:max-w-86">
            <Input
              value={search}
              onChange={setSearch}
              placeholder="Buscar competidores..."
              label="Buscar competidores"
              icon={
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="size-5"
                  strokeWidth={2}
                />
              }
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {loading ? (
            <Spinner />
          ) : error && teams.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Não foi possível carregar a lista.
            </p>
          ) : filteredTeams.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {search.trim()
                ? 'Nenhum competidor encontrado para a busca.'
                : 'Nenhum competidor cadastrado.'}
            </p>
          ) : (
            <>
              <div className="min-h-0 flex-1">
                <Table
                  columns={columns}
                  rows={paginatedTeams}
                  getKey={(team) => team.id}
                />
              </div>

              <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {rangeStart}–{rangeEnd} de {filteredTeams.length}
                  {totalPages > 1
                    ? ` · Página ${currentPage} de ${totalPages}`
                    : null}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="quiet"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      className="size-4"
                      strokeWidth={2}
                    />
                    Anterior
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
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
      </BoxFeatures>

      <StaffTeamInfoSheet
        contestId={contestId}
        team={selectedTeam}
        open={infoOpen}
        onOpenChange={setInfoOpen}
        onUpdated={handleUpdated}
      />
    </>
  )
}
