'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import {
  authClient,
  type StaffSignInResult,
} from '@/lib/auth-client'

import { HugeiconsIcon } from '@hugeicons/react'
import {
  Crown03Icon,
  BalloonIcon,
  MailIcon,
  SquareLock01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'

const ADMIN_ROLES = new Set(['admin', 'staff'])

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

  useEffect(() => {
    const contestCode = searchParams.get('contest_code')
    if (contestCode) {
      setCompetitionCode(contestCode)
      setIsAdmin(false)
    }
  }, [searchParams])

  async function completeStaffLogin(contestId: string) {
    router.push(`/admin/competicoes/${contestId}/tarefas`)
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

    await completeStaffLogin(data.contestId)
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

    await completeStaffLogin(data.contestId)
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
        setError('Acesso restrito a administradores e staff.')
        return
      }

      router.push('/admin')
      router.refresh()
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
      <Card className="overflow-hidden rounded-2xl border-6 p-0 shadow-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
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
                <Field>
                  <FieldLabel htmlFor="name" className="text-base font-bold">
                    Nome
                  </FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Digite seu nome"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    autoFocus
                    icon={
                      <HugeiconsIcon
                        icon={UserIcon}
                        className="size-5 opacity-50"
                        strokeWidth={2}
                      />
                    }
                    required
                  />
                </Field>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="email" className="text-base font-bold">
                      Email
                    </FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      icon={
                        <HugeiconsIcon
                          icon={MailIcon}
                          className="size-5 opacity-50"
                          strokeWidth={2}
                        />
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor={isAdmin ? 'password' : 'competition-code'}
                      className="text-base font-bold"
                    >
                      {isAdmin ? 'Senha' : 'Código da Competição'}
                    </FieldLabel>
                    <Input
                      key={isAdmin ? 'password' : 'competition-code'}
                      id={isAdmin ? 'password' : 'competition-code'}
                      name={isAdmin ? 'password' : 'competitionCode'}
                      type={isAdmin ? 'password' : 'text'}
                      placeholder={
                        isAdmin
                          ? 'Digite sua senha'
                          : 'Digite o código da competição'
                      }
                      value={isAdmin ? password : competitionCode}
                      onChange={
                        isAdmin
                          ? (event) => setPassword(event.target.value)
                          : (event) => setCompetitionCode(event.target.value)
                      }
                      autoComplete={isAdmin ? 'current-password' : 'off'}
                      icon={
                        <HugeiconsIcon
                          icon={isAdmin ? SquareLock01Icon : BalloonIcon}
                          className="size-5 opacity-50"
                          strokeWidth={2}
                        />
                      }
                      required
                    />
                  </Field>
                </>
              )}

              {error ? (
                <p className="text-center text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Field>
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading || !canSubmit}
                >
                  {needsRegistration && !isAdmin ? 'Continuar' : 'Entrar'}
                </Button>
                {needsRegistration && !isAdmin ? (
                  <Button
                    type="button"
                    variant="white"
                    onClick={() => {
                      setNeedsRegistration(false)
                      setName('')
                      setError(null)
                    }}
                    className="w-full"
                  >
                    Voltar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="white"
                    size="sm"
                    onClick={() => {
                      setIsAdmin((prev) => !prev)
                      setNeedsRegistration(false)
                      setName('')
                      setError(null)
                    }}
                    className="w-full"
                  >
                    <HugeiconsIcon
                      icon={isAdmin ? BalloonIcon : Crown03Icon}
                      className="size-5"
                      strokeWidth={2.5}
                    />
                    {isAdmin ? 'Sou Colaborador' : 'Sou Administrador'}
                  </Button>
                )}
              </Field>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/thumb_todos.jpg"
              alt="Imagem de login"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              width={1000}
              height={1000}
              loading="eager"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
