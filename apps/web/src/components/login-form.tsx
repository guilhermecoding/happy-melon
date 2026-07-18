import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, LoginCircle01Icon } from '@hugeicons/core-free-icons'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-none border-b-8 border-l-8 rounded-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <Image
                  src="/logo-texto.svg"
                  alt="Logo Happy Melon"
                  className="w-auto h-18 object-contain pointer-events-none"
                  width={100}
                  height={100}
                  loading="eager"
                />
                <p className="text-balance text-base text-muted-foreground">
                  Entre com as credenciais da maratona
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input id="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">
                  Entrar
                  <HugeiconsIcon icon={LoginCircle01Icon} className="size-5" strokeWidth={3} />
                </Button>
              </Field>
              <FieldDescription className="text-center flex justify-center">
                <span className="flex items-center gap-1 hover:underline cursor-pointer">
                  Sou administrador
                  <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" /></span>
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
