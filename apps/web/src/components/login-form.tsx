"use client"

import { useState } from "react"
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

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight02Icon,
  BalloonIcon,
  LoginCircle01Icon,
  MailIcon,
  SquareLock01Icon,
} from "@hugeicons/core-free-icons"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isAdmin, setIsAdmin] = useState(false)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden rounded-2xl border-b-8 border-l-8 p-0 shadow-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
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
                  Entre com as credenciais da maratona
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email" className="text-base font-bold">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
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
              <Field>
                <Button type="submit">
                  Entrar
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
                  onClick={() => setIsAdmin((prev) => !prev)}
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
