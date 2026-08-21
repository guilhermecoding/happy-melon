'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/pouf/Button';
import { Field, Input } from '@/components/pouf/Input';
import { Card } from '@/components/pouf/surface';
import Image from 'next/image';
import {
  authClient,
  type StaffSignInResult,
} from '@/lib/auth-client';
import { toast } from '@/components/pouf/toaster';
import { fieldError } from '@/lib/form';
import {
  emptyLoginFormValues,
  loginFormSchema,
  type LoginFormValues,
  type LoginMode,
} from './login-schema';
import { APP_VERSION } from '@repo/shared/app-version';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  Crown03Icon,
  BalloonIcon,
  MailIcon,
  SquareLock01Icon,
  UserIcon,
  LoginCircle01Icon,
} from '@hugeicons/core-free-icons';

const ADMIN_ROLES = new Set(['admin']);

const MODE_COPY: Record<
  LoginMode,
  { description: string; submit: string }
> = {
  collaborator: {
    description: 'Entre com as credenciais da competição',
    submit: 'Entrar',
  },
  admin: {
    description: 'Entre com suas credenciais de administrador',
    submit: 'Entrar',
  },
  register: {
    description: 'Informe seu nome para concluir o primeiro acesso',
    submit: 'Continuar',
  },
};

function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName.trim();
}

function getSignInErrorMessage(error: {
  code?: string | undefined;
  message?: string | undefined;
}) {
  const code = error.code?.toUpperCase();
  const message = error.message?.trim() ?? '';

  if (
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    code === 'INVALID_PASSWORD' ||
    code === 'USER_NOT_FOUND' ||
    code === 'CREDENTIAL_ACCOUNT_NOT_FOUND' ||
    /invalid email or password|invalid password|user not found|credential account not found/i.test(
      message,
    )
  ) {
    return 'E-mail ou senha inválidos.';
  }

  if (code === 'BANNED_USER' || /banned|banido|desativada/i.test(message)) {
    return 'Sua conta está desativada. Fale com um administrador.';
  }

  if (
    code === 'CONTEST_NOT_FOUND' ||
    /competição não encontrada/i.test(message)
  ) {
    return 'Código da competição inválido.';
  }

  if (
    code === 'CONTEST_INACTIVE' ||
    /acesso dos colaboradores está desabilitado/i.test(message)
  ) {
    return 'O acesso dos colaboradores está desabilitado para esta competição.';
  }

  if (
    code === 'ADMIN_USE_PASSWORD_LOGIN' ||
    /login de administrador/i.test(message)
  ) {
    return 'Use o login de administrador para esta conta.';
  }

  if (
    code === 'COLLABORATOR_ACCESS_DISABLED' ||
    /acesso a esta competição está desabilitado/i.test(message)
  ) {
    return 'Seu acesso a esta competição está desabilitado. Fale com um administrador.';
  }

  return message || 'Falha ao entrar. Verifique suas credenciais.';
}

function getFetchErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const record = error as {
      code?: string;
      message?: string;
      error?: { code?: string; message?: string };
      status?: number;
    };

    return getSignInErrorMessage({
      code: record.error?.code ?? record.code,
      message: record.error?.message ?? record.message,
    });
  }

  return fallback;
}

export function LoginForm({
  className,
  contestCode,
  ...props
}: {
  contestCode?: string;
} & React.ComponentProps<'div'>) {
  const contestCodeToUse = contestCode ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requestError, setRequestError] = useState<string>();

  const form = useForm({
    defaultValues: emptyLoginFormValues(contestCodeToUse),
    validators: {
      onSubmit: loginFormSchema,
    },
    onSubmit: async ({ value }) => {
      setRequestError(undefined);

      try {
        if (value.mode === 'register') {
          await handleStaffRegister(value);
          return;
        }

        if (value.mode === 'collaborator') {
          await handleStaffSignIn(value);
          return;
        }

        const { data, error: signInError } = await authClient.signIn.email({
          email: value.email.trim(),
          password: value.password,
        });

        if (signInError) {
          setRequestError(getSignInErrorMessage(signInError));
          return;
        }

        const role = data?.user?.role;
        if (!role || !ADMIN_ROLES.has(role)) {
          await authClient.signOut();
          setRequestError('Acesso restrito a administradores.');
          return;
        }

        // Full navigation so the session cookie is available to the proxy
        window.location.assign('/admin');
      } catch {
        setRequestError('Não foi possível conectar ao servidor de autenticação.');
      }
    },
  });

  function resetForm(competitionCode: string) {
    form.reset(emptyLoginFormValues(competitionCode), {
      keepDefaultValues: true,
    });
    setRequestError(undefined);
  }

  function setMode(mode: LoginMode) {
    const values = form.state.values;
    form.reset(
      {
        mode,
        email: values.email,
        password: values.password,
        competitionCode: values.competitionCode,
        name: '',
      },
      { keepDefaultValues: true },
    );
    setRequestError(undefined);
  }

  /* Wipe credentials whenever this screen is shown again — soft nav remount,
   * sign-out redirect, or the browser restoring the page from bfcache. Keep
   * only a contest_code from the URL, if present. */
  useEffect(() => {
    const codeFromUrl = searchParams.get('contest_code') ?? contestCodeToUse;
    resetForm(codeFromUrl);

    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      const code =
        new URLSearchParams(window.location.search).get('contest_code') ??
        contestCodeToUse;
      resetForm(code);
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
    // Intentionally mount-only: returning to /entrar remounts this form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function completeStaffLogin(contestId: string, userName: string) {
    toast.success(`Que bom ter você aqui, ${firstName(userName)}!`);
    router.push(`/staff/${contestId}`);
    router.refresh();
  }

  async function handleStaffSignIn(value: LoginFormValues) {
    const { data, error: signInError } = await authClient.$fetch<StaffSignInResult>(
      '/staff/sign-in',
      {
        method: 'POST',
        body: {
          email: value.email.trim(),
          contestCode: value.competitionCode.trim(),
        },
      },
    );

    if (signInError) {
      setRequestError(getFetchErrorMessage(signInError, 'Falha ao entrar.'));
      return;
    }

    if (!data) {
      setRequestError('Falha ao entrar. Tente novamente.');
      return;
    }

    if (data.status === 'needsRegistration') {
      form.setFieldValue('mode', 'register');
      return;
    }

    await completeStaffLogin(data.contestId, data.user.name);
  }

  async function handleStaffRegister(value: LoginFormValues) {
    const { data, error: registerError } = await authClient.$fetch<StaffSignInResult>(
      '/staff/register',
      {
        method: 'POST',
        body: {
          email: value.email.trim(),
          contestCode: value.competitionCode.trim(),
          name: value.name.trim(),
        },
      },
    );

    if (registerError) {
      setRequestError(
        getFetchErrorMessage(registerError, 'Não foi possível criar sua conta.'),
      );
      return;
    }

    if (!data || data.status !== 'authenticated') {
      setRequestError('Não foi possível criar sua conta. Tente novamente.');
      return;
    }

    await completeStaffLogin(data.contestId, data.user.name);
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card variant="flush">
        {/* The photo bleeds to the card edge, so the clip lives on this inner
            wrapper — Card itself paints the cushion and must not be clipped. */}
        <div className="grid overflow-hidden rounded-card md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
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
                <form.Subscribe selector={(state) => state.values.mode}>
                  {(mode) => (
                    <p className="text-balance text-base text-muted-foreground">
                      {MODE_COPY[mode].description}
                    </p>
                  )}
                </form.Subscribe>
              </div>

              <form.Subscribe selector={(state) => state.values.mode}>
                {(mode) =>
                  mode === 'register' ? (
                    <form.Field name="name">
                      {(field) => (
                        <Field
                          label="Nome"
                          error={fieldError(field.state.meta)}
                        >
                          {(id, describedBy) => (
                            <Input
                              id={id}
                              name={field.name}
                              describedBy={describedBy}
                              type="text"
                              placeholder="Digite seu nome"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={field.handleChange}
                              invalid={!field.state.meta.isValid}
                              autoComplete="name"
                              autoFocus
                              icon={
                                <HugeiconsIcon
                                  icon={UserIcon}
                                  className="size-5"
                                  strokeWidth={2}
                                />
                              }
                            />
                          )}
                        </Field>
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <form.Field name="email">
                        {(field) => (
                          <Field
                            label="Email"
                            error={fieldError(field.state.meta)}
                          >
                            {(id, describedBy) => (
                              <Input
                                id={id}
                                name={field.name}
                                describedBy={describedBy}
                                type="email"
                                placeholder="Digite seu email"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={field.handleChange}
                                invalid={!field.state.meta.isValid}
                                autoComplete="email"
                                icon={
                                  <HugeiconsIcon
                                    icon={MailIcon}
                                    className="size-5"
                                    strokeWidth={2}
                                  />
                                }
                              />
                            )}
                          </Field>
                        )}
                      </form.Field>
                      {mode === 'admin' ? (
                        <form.Field name="password">
                          {(field) => (
                            <Field
                              label="Senha"
                              error={fieldError(field.state.meta)}
                            >
                              {(id, describedBy) => (
                                <Input
                                  id={id}
                                  name={field.name}
                                  describedBy={describedBy}
                                  type="password"
                                  placeholder="Digite sua senha"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={field.handleChange}
                                  invalid={!field.state.meta.isValid}
                                  autoComplete="current-password"
                                  icon={
                                    <HugeiconsIcon
                                      icon={SquareLock01Icon}
                                      className="size-5"
                                      strokeWidth={2}
                                    />
                                  }
                                />
                              )}
                            </Field>
                          )}
                        </form.Field>
                      ) : (
                        <form.Field name="competitionCode">
                          {(field) => (
                            <Field
                              label="Código da Competição"
                              error={fieldError(field.state.meta)}
                            >
                              {(id, describedBy) => (
                                <Input
                                  id={id}
                                  name={field.name}
                                  describedBy={describedBy}
                                  type="text"
                                  placeholder="Digite o código da competição"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={field.handleChange}
                                  invalid={!field.state.meta.isValid}
                                  autoComplete="off"
                                  icon={
                                    <HugeiconsIcon
                                      icon={BalloonIcon}
                                      className="size-5"
                                      strokeWidth={2}
                                    />
                                  }
                                />
                              )}
                            </Field>
                          )}
                        </form.Field>
                      )}
                    </>
                  )
                }
              </form.Subscribe>

              {requestError ? (
                <span
                  className="pouf-error self-center text-center text-[13px] font-extrabold text-(--on-accent) bg-orange rounded-xl py-(--s2) px-(--s3) max-w-full"
                  role="alert"
                >
                  {requestError}
                </span>
              ) : null}

              <div className="flex flex-col gap-2">
                <form.Subscribe
                  selector={(state) =>
                    [state.values.mode, state.isSubmitting] as const
                  }
                >
                  {([mode, isSubmitting]) => (
                    <>
                      <Button type="submit" block loading={isSubmitting}>
                        <HugeiconsIcon icon={LoginCircle01Icon} className="size-5" strokeWidth={2.5} />
                        {MODE_COPY[mode].submit}
                      </Button>
                      {mode === 'register' ? (
                        <Button
                          variant="quiet"
                          block
                          onClick={() => setMode('collaborator')}
                        >
                          Voltar
                        </Button>
                      ) : (
                        <div className="flex justify-end mt-4">
                          <div className="w-full sm:w-fit">
                            <Button
                              variant="quiet"
                              size="sm"
                              block
                              onClick={() =>
                                setMode(
                                  mode === 'admin' ? 'collaborator' : 'admin',
                                )
                              }
                            >
                              <HugeiconsIcon
                                icon={
                                  mode === 'admin' ? BalloonIcon : Crown03Icon
                                }
                                className="size-5"
                                strokeWidth={2.5}
                              />
                              {mode === 'admin' ? 'Colaborador' : 'Administrador'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </form.Subscribe>
              </div>
            </div>
            <div className="flex justify-center flex-col items-center gap-2 mt-4">
              <span className="text-xs text-muted-foreground text-center">
                © Todos os direitos reservados - {new Date().getFullYear()}
              </span>
              <span className="text-xs text-muted-foreground text-center">
                {APP_VERSION}
              </span>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/thumb_todos.JPG"
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
  );
}
