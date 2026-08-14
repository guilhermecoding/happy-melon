"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/pouf/Button";
import { Dialog } from "@/components/pouf/controls";
import { Field, Input } from "@/components/pouf/Input";
import type { Tone } from "@/components/pouf/tone";

type AdminPasswordConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  confirmTone?: Tone;
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
  confirmTone = "pink",
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
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
    >
      <form onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Senha de administrador" error={displayError}>
          {(id, describedBy) => (
            <Input
              id={id}
              describedBy={describedBy}
              type="password"
              autoComplete="current-password"
              placeholder="Senha de administrador"
              value={password}
              onChange={setPassword}
              invalid={Boolean(displayError)}
              disabled={isLoading}
            />
          )}
        </Field>

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 xl:flex-row">
          <Button
            variant="quiet"
            size="sm"
            disabled={isLoading}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            tone={confirmTone}
            size="sm"
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
