'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { EyeClosedIcon, SaveIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/pouf/Button'
import { Field, Input } from '@/components/pouf/Input'
import { Sheet } from '@/components/pouf/sheet'
import { toast } from '@/components/pouf/toaster'
import { fieldError } from '@/lib/form'
import { TeamServiceError, getTeamErrorMessage } from '@/services/team/team.error'
import { teamService } from '@/services/team/team.service'
import type { Team } from '@/services/team/team.type'
import { TEAM_PLACEMENT_MAX_LENGTH } from '@repo/shared'
import {
  emptyStaffTeamPlacementValues,
  isPlacementDirty,
  normalizePlacement,
  staffTeamPlacementSchema,
  toPlacementValues,
  type StaffTeamPlacementValues,
} from './staff-team-placement-schema'

type StaffTeamInfoSheetProps = {
  contestId: string
  team: Team | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (team: Team) => void
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[13px] font-black tracking-[0.6px] text-ink uppercase">
        {label}
      </p>
      <p className="text-[15px] font-bold break-all text-ink">{value}</p>
    </div>
  )
}

export function StaffTeamInfoSheet({
  contestId,
  team,
  open,
  onOpenChange,
  onUpdated,
}: StaffTeamInfoSheetProps) {
  const [requestError, setRequestError] = useState<string>()
  const baselineRef = useRef<Team | null>(null)

  const form = useForm({
    defaultValues: emptyStaffTeamPlacementValues satisfies StaffTeamPlacementValues,
    validators: {
      onSubmit: staffTeamPlacementSchema,
    },
    onSubmit: async ({ value }) => {
      const baseline = baselineRef.current
      if (!baseline) return

      setRequestError(undefined)
      try {
        const updatedTeam = await teamService.updatePlacement(
          contestId,
          baseline.id,
          {
            room: normalizePlacement(value.room),
            machine: normalizePlacement(value.machine),
            updatedAt: baseline.updatedAt,
          },
        )
        baselineRef.current = updatedTeam
        onUpdated(updatedTeam)
        toast.success('Sala e máquina atualizadas.')
        handleOpenChange(false)
      } catch (error) {
        if (
          error instanceof TeamServiceError &&
          error.status === 409 &&
          error.team
        ) {
          baselineRef.current = error.team
          form.reset(toPlacementValues(error.team), { keepDefaultValues: true })
          onUpdated(error.team)
          setRequestError(error.message)
          toast.error(error.message)
          return
        }

        const message = getTeamErrorMessage(
          error,
          'Não foi possível atualizar o competidor.',
        )
        setRequestError(message)
        toast.error(message)
      }
    },
  })

  useEffect(() => {
    if (!open) {
      baselineRef.current = null
      form.reset()
      setRequestError(undefined)
      return
    }

    if (!team) return

    const baseline = baselineRef.current
    const sameTeam = baseline?.id === team.id
    const dirty =
      sameTeam && baseline
        ? isPlacementDirty(form.state.values, baseline)
        : false

    if (!sameTeam || !dirty) {
      baselineRef.current = team
      form.reset(toPlacementValues(team), { keepDefaultValues: true })
      if (!sameTeam) setRequestError(undefined)
    }
  }, [open, team, form])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      baselineRef.current = null
      form.reset()
      setRequestError(undefined)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Competidor"
      description="Somente sala e máquina podem ser alteradas."
    >
      {team ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <div className="flex flex-col gap-5">
            <ReadOnlyValue label="ID" value={team.id} />
            <ReadOnlyValue label="Nome" value={team.name} />
            <ReadOnlyValue label="Usuário" value={team.usernameTeam} />

            <form.Field name="room">
              {(field) => (
                <Field label="Sala" error={fieldError(field.state.meta)}>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      name={field.name}
                      describedBy={describedBy}
                      placeholder="Sala do competidor (opcional)"
                      value={field.state.value}
                      maxLength={TEAM_PLACEMENT_MAX_LENGTH}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      invalid={!field.state.meta.isValid}
                    />
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="machine">
              {(field) => (
                <Field label="Máquina" error={fieldError(field.state.meta)}>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      name={field.name}
                      describedBy={describedBy}
                      placeholder="Número da máquina (opcional)"
                      value={field.state.value}
                      maxLength={TEAM_PLACEMENT_MAX_LENGTH}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      invalid={!field.state.meta.isValid}
                    />
                  )}
                </Field>
              )}
            </form.Field>

            {requestError ? (
              <p role="alert" className="text-sm text-destructive">
                {requestError}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col-reverse justify-end gap-2 xl:flex-row">
            <Button variant="quiet" onClick={() => handleOpenChange(false)}>
              <HugeiconsIcon
                icon={EyeClosedIcon}
                className="size-5"
                strokeWidth={3}
              />
              Fechar
            </Button>
            <form.Subscribe
              selector={(state) => ({
                room: state.values.room,
                machine: state.values.machine,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ room, machine, isSubmitting }) => {
                const baseline = baselineRef.current
                const dirty = baseline
                  ? isPlacementDirty({ room, machine }, baseline)
                  : false

                return dirty ? (
                  <Button type="submit" tone="mint" loading={isSubmitting}>
                    <HugeiconsIcon
                      icon={SaveIcon}
                      className="size-5"
                      strokeWidth={3}
                    />
                    Salvar
                  </Button>
                ) : null
              }}
            </form.Subscribe>
          </div>
        </form>
      ) : null}
    </Sheet>
  )
}
