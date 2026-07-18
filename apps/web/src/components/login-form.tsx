"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { authClient } from "@/lib/auth-client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight02Icon,
  BalloonIcon,
  LoginCircle01Icon,
  MailIcon,
  SquareLock01Icon,
} from "@hugeicons/core-free-icons"

const ADMIN_ROLES = new Set(["admin", "staff"])

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!isAdmin) {
      setError("Login de colaborador ainda não está disponível.")
      return
    }

    setIsLoading(true)

    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message ?? "Falha ao entrar. Verifique suas credenciais.")
        return
      }

      const role = data?.user?.role
      if (!role || !ADMIN_ROLES.has(role)) {
        await authClient.signOut()
        setError("Acesso restrito a administradores e staff.")
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      setError("Não foi possível conectar ao servidor de autenticação.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden rounded-2xl border-b-8 border-l-8 p-0 shadow-none">
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
                    ? "Entre com suas credenciais de administrador"
                    : "Entre com as credenciais da maratona"}
                </p>
              </div>
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
                      className="size-5 text-muted-foreground/50"
                      strokeWidth={2}
                    />
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor={isAdmin ? "password" : "marathon-code"}
                  className="text-base font-bold"
                >
                  {isAdmin ? "Senha" : "Código da Maratona"}
                </FieldLabel>
                <Input
                  key={isAdmin ? "password" : "marathon-code"}
                  id={isAdmin ? "password" : "marathon-code"}
                  name={isAdmin ? "password" : "marathonCode"}
                  type={isAdmin ? "password" : "text"}
                  placeholder={
                    isAdmin
                      ? "Digite sua senha"
                      : "Digite o código da maratona"
                  }
                  value={isAdmin ? password : undefined}
                  onChange={
                    isAdmin
                      ? (event) => setPassword(event.target.value)
                      : undefined
                  }
                  autoComplete={isAdmin ? "current-password" : "off"}
                  icon={
                    <HugeiconsIcon
                      icon={isAdmin ? SquareLock01Icon : BalloonIcon}
                      className="size-5 text-muted-foreground/50"
                      strokeWidth={2}
                    />
                  }
                  required
                />
              </Field>
              {error ? (
                <p className="text-center text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Field>
                <Button type="submit" disabled={isLoading || !isAdmin}>
                  {isLoading ? "Entrando..." : "Entrar"}
                  <HugeiconsIcon
                    icon={LoginCircle01Icon}
                    className="size-5"
                    strokeWidth={3}
                  />
                </Button>
              </Field>
              <FieldDescription className="flex justify-center text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdmin((prev) => !prev)
                    setError(null)
                  }}
                  className="flex cursor-pointer items-center gap-1 hover:underline"
                >
                  {isAdmin ? "Sou Colaborador" : "Sou Administrador"}
                  <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
                </button>
              </FieldDescription>
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
