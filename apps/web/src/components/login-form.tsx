'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/pouf/Button'
import { Field, Input } from '@/components/pouf/Input'
import { Card } from '@/components/pouf/surface'
import Image from 'next/image'
import {
  authClient,
  type StaffSignInResult,
} from '@/lib/auth-client'
import { toast } from '@/components/pouf/toaster'

import { HugeiconsIcon } from '@hugeicons/react'
import {
  Crown03Icon,
  BalloonIcon,
  MailIcon,
  SquareLock01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'

const ADMIN_ROLES = new Set(['admin'])

function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0]
  return part || fullName.trim()
}

function getSignInErrorMessage(error: {
  code?: string | undefined
  message?: string | undefined
}) {
  const code = error.code?.toUpperCase()
  const message = error.message?.trim() ?? ''

  if (
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    code === 'INVALID_PASSWORD' ||
    code === 'USER_NOT_FOUND' ||
    code === 'CREDENTIAL_ACCOUNT_NOT_FOUND' ||
    /invalid email or password|invalid password|user not found|credential account not found/i.test(
      message,
    )
  ) {
    return 'E-mail ou senha inválidos.'
  }

  if (code === 'BANNED_USER' || /banned|banido|desativada/i.test(message)) {
    return 'Sua conta está desativada. Fale com um administrador.'
  }

  if (
    code === 'CONTEST_NOT_FOUND' ||
    /competição não encontrada/i.test(message)
  ) {
    return 'Código da competição inválido.'
  }

  if (
    code === 'CONTEST_INACTIVE' ||
    /acesso dos colaboradores está desabilitado/i.test(message)
  ) {
    return 'O acesso dos colaboradores está desabilitado para esta competição.'
  }

  if (
    code === 'ADMIN_USE_PASSWORD_LOGIN' ||
    /login de administrador/i.test(message)
  ) {
    return 'Use o login de administrador para esta conta.'
  }

  if (
    code === 'COLLABORATOR_ACCESS_DISABLED' ||
    /acesso a esta competição está desabilitado/i.test(message)
  ) {
    return 'Seu acesso a esta competição está desabilitado. Fale com um administrador.'
  }

  return message || 'Falha ao entrar. Verifique suas credenciais.'
}

function getFetchErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const record = error as {
      code?: string
      message?: string
      error?: { code?: string; message?: string }
      status?: number
    }

    return getSignInErrorMessage({
      code: record.error?.code ?? record.code,
      message: record.error?.message ?? record.message,
    })
  }

  return fallback
}

export function LoginForm({
  className,
  contestCode,
  ...props
}: {
  contestCode?: string
} & React.ComponentProps<'div'>) {
  const contestCodeToUse = contestCode ?? '';
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAdmin, setIsAdmin] = useState(false)
  const [needsRegistration, setNeedsRegistration] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [competitionCode, setCompetitionCode] = useState(contestCodeToUse)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function clearForm(nextContestCode = '') {
    setEmail('')
    setPassword('')
    setName('')
    setError(null)
    setNeedsRegistration(false)
    setIsLoading(false)
    setIsAdmin(false)
    setCompetitionCode(nextContestCode)
  }

  /* Wipe credentials whenever this screen is shown again — soft nav remount,
   * sign-out redirect, or the browser restoring the page from bfcache. Keep
   * only a contest_code from the URL, if present. */
  useEffect(() => {
    const codeFromUrl = searchParams.get('contest_code') ?? contestCodeToUse
    clearForm(codeFromUrl)

    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return
      const code =
        new URLSearchParams(window.location.search).get('contest_code') ??
        contestCodeToUse
      clearForm(code)
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
    // Intentionally mount-only: returning to /entrar remounts this form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function completeStaffLogin(contestId: string, userName: string) {
    toast.success(`Que bom ter você aqui, ${firstName(userName)}!`)
    router.push(`/staff/${contestId}`)
    router.refresh()
  }

  async function handleStaffSignIn() {
    const { data, error: signInError } = await authClient.$fetch<StaffSignInResult>(
      '/staff/sign-in',
      {
        method: 'POST',
        body: {
          email: email.trim(),
          contestCode: competitionCode.trim(),
        },
      },
    )

    if (signInError) {
      setError(getFetchErrorMessage(signInError, 'Falha ao entrar.'))
      return
    }

    if (!data) {
      setError('Falha ao entrar. Tente novamente.')
      return
    }

    if (data.status === 'needsRegistration') {
      setNeedsRegistration(true)
      setError(null)
      return
    }

    await completeStaffLogin(data.contestId, data.user.name)
  }

  async function handleStaffRegister() {
    const { data, error: registerError } = await authClient.$fetch<StaffSignInResult>(
      '/staff/register',
      {
        method: 'POST',
        body: {
          email: email.trim(),
          contestCode: competitionCode.trim(),
          name: name.trim(),
        },
      },
    )

    if (registerError) {
      setError(
        getFetchErrorMessage(registerError, 'Não foi possível criar sua conta.'),
      )
      return
    }

    if (!data || data.status !== 'authenticated') {
      setError('Não foi possível criar sua conta. Tente novamente.')
      return
    }

    await completeStaffLogin(data.contestId, data.user.name)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!isAdmin) {
        if (needsRegistration) {
          await handleStaffRegister()
        } else {
          await handleStaffSignIn()
        }
        return
      }

      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
      })

      if (signInError) {
        setError(getSignInErrorMessage(signInError))
        return
      }

      const role = data?.user?.role
      if (!role || !ADMIN_ROLES.has(role)) {
        await authClient.signOut()
        setError('Acesso restrito a administradores.')
        return
      }

      // Full navigation so the session cookie is available to the proxy/middleware
      window.location.assign('/admin')
    } catch {
      setError('Não foi possível conectar ao servidor de autenticação.')
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmitAdmin =
    email.trim().length > 0 && password.trim().length > 0
  const canSubmitCollaborator =
    email.trim().length > 0 && competitionCode.trim().length > 0
  const canSubmitRegistration = name.trim().length > 0
  const canSubmit = isAdmin
    ? canSubmitAdmin
    : needsRegistration
      ? canSubmitRegistration
      : canSubmitCollaborator

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card variant="flush">
        {/* The photo bleeds to the card edge, so the clip lives on this inner
            wrapper — Card itself paints the cushion and must not be clipped. */}
        <div className="grid overflow-hidden rounded-card md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <Image
                  src="/logo-texto.svg"
                  alt="Logo Happy Melon"
                  className="pointer-events-none h-18 w-auto object-contain"
                  width={100}
                  height={100}
                  loading="eager"
                />
                <p className="text-balance text-base text-muted-foreground">
                  {isAdmin
                    ? 'Entre com suas credenciais de administrador'
                    : needsRegistration
                      ? 'Informe seu nome para concluir o primeiro acesso'
                      : 'Entre com as credenciais da competição'}
                </p>
              </div>

              {needsRegistration && !isAdmin ? (
                <Field label="Nome">
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      name="name"
                      describedBy={describedBy}
                      type="text"
                      placeholder="Digite seu nome"
                      value={name}
                      onChange={setName}
                      autoComplete="name"
                      autoFocus
                      icon={
                        <HugeiconsIcon
                          icon={UserIcon}
                          className="size-5"
                          strokeWidth={2}
                        />
                      }
                      required
                    />
                  )}
                </Field>
              ) : (
                <>
                  <Field label="Email">
                    {(id, describedBy) => (
                      <Input
                        id={id}
                        name="email"
                        describedBy={describedBy}
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={setEmail}
                        autoComplete="email"
                        icon={
                          <HugeiconsIcon
                            icon={MailIcon}
                            className="size-5"
                            strokeWidth={2}
                          />
                        }
                        required
                      />
                    )}
                  </Field>
                  <Field label={isAdmin ? 'Senha' : 'Código da Competição'}>
                    {(id, describedBy) => (
                      <Input
                        key={isAdmin ? 'password' : 'competition-code'}
                        id={id}
                        name={isAdmin ? 'password' : 'competitionCode'}
                        describedBy={describedBy}
                        type={isAdmin ? 'password' : 'text'}
                        placeholder={
                          isAdmin
                            ? 'Digite sua senha'
                            : 'Digite o código da competição'
                        }
                        value={isAdmin ? password : competitionCode}
                        onChange={isAdmin ? setPassword : setCompetitionCode}
                        autoComplete={isAdmin ? 'current-password' : 'off'}
                        icon={
                          <HugeiconsIcon
                            icon={isAdmin ? SquareLock01Icon : BalloonIcon}
                            className="size-5"
                            strokeWidth={2}
                          />
                        }
                        required
                      />
                    )}
                  </Field>
                </>
              )}

              {error ? (
                <p className="text-center text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  block
                  loading={isLoading}
                  disabled={!canSubmit}
                >
                  {needsRegistration && !isAdmin ? 'Continuar' : 'Entrar'}
                </Button>
                {needsRegistration && !isAdmin ? (
                  <Button
                    variant="quiet"
                    block
                    onClick={() => {
                      setNeedsRegistration(false)
                      setName('')
                      setError(null)
                    }}
                  >
                    Voltar
                  </Button>
                ) : (
                  <Button
                    variant="quiet"
                    size="sm"
                    block
                    onClick={() => {
                      setIsAdmin((prev) => !prev)
                      setNeedsRegistration(false)
                      setName('')
                      setError(null)
                    }}
                  >
                    <HugeiconsIcon
                      icon={isAdmin ? BalloonIcon : Crown03Icon}
                      className="size-5"
                      strokeWidth={2.5}
                    />
                    {isAdmin ? 'Sou Colaborador' : 'Sou Administrador'}
                  </Button>
                )}
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/thumb_todos.jpg"
              alt="Imagem de login"
              className="absolute inset-0 h-full w-full object-cover"
              width={1000}
              height={1000}
              loading="eager"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
