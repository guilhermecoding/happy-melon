"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

type AdminPasswordConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  isLoading?: boolean;
  error?: string;
  onConfirm: (password: string) => void | Promise<void>;
};

export function AdminPasswordConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  confirmVariant = "red",
  isLoading = false,
  error,
  onConfirm,
}: AdminPasswordConfirmDialogProps) {
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string>();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setLocalError(undefined);
    }
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isLoading) return;
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) {
      setLocalError("Informe a senha de administrador para confirmar.");
      return;
    }

    setLocalError(undefined);
    await onConfirm(password);
  }

  const displayError = localError ?? error;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <Field data-invalid={Boolean(displayError)}>
            <Input
              id="admin-confirm-password"
              type="password"
              autoComplete="current-password"
              placeholder="Senha de administrador"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(displayError)}
              disabled={isLoading}
            />
            {displayError && (
              <p role="alert" className="text-sm text-destructive">
                {displayError}
              </p>
            )}
          </Field>

          <DialogFooter className="flex-col justify-stretch sm:flex-row-reverse sm:justify-end">
            <Button
              type="submit"
              variant={confirmVariant}
              size="sm"
              className="w-full"
              loading={isLoading}
            >
              {confirmLabel}
            </Button>
            <Button
              type="button"
              variant="white"
              size="sm"
              className="w-full"
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
