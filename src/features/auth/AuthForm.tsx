"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui";
import type { AppError } from "@/contracts/errors";
import { ROUTES } from "@/contracts/routes";
import { signIn, signUp } from "@/server/actions/auth";

type Mode = "signin" | "signup";
type FieldName = "email" | "password" | "displayName";

const COPY = {
  signin: {
    submit: "Entrar",
    pending: "Entrando...",
    altText: "Ainda não tem conta?",
    altLink: "Criar conta",
    altHref: ROUTES.signUp,
    autocomplete: "current-password",
  },
  signup: {
    submit: "Criar conta",
    pending: "Criando conta...",
    altText: "Já tem conta?",
    altLink: "Entrar",
    altHref: ROUTES.signIn,
    autocomplete: "new-password",
  },
} as const;

const inputClass =
  "w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink " +
  "placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-purple-dark aria-[invalid=true]:border-coral";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [error, setError] = useState<AppError | null>(null);
  const [pending, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const fieldError = (f: FieldName) => (error?.field === f ? error.message : null);
  const formError = error && !error.field ? error.message : null;
  const emailTaken = error?.code === "CONFLICT";

  function focusField(field: string | undefined) {
    const map = { email: emailRef, password: passwordRef, displayName: nameRef };
    (map[field as FieldName] ?? emailRef).current?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("displayName") ?? "").trim();
    const input =
      mode === "signup" && name ? { email, password, displayName: name } : { email, password };

    startTransition(async () => {
      setError(null);
      const result = mode === "signup" ? await signUp(input) : await signIn(input);
      if (result.ok) {
        router.push(result.data.redirectTo);
        router.refresh();
        return;
      }
      setError(result.error);
      // Leva o foco ao campo com erro após o React atualizar o DOM.
      setTimeout(() => focusField(result.error.field), 0);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-busy={pending}>
      {mode === "signup" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-sm font-bold text-ink">
            Como podemos te chamar? <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            ref={nameRef}
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="given-name"
            maxLength={80}
            className={inputClass}
            aria-invalid={fieldError("displayName") ? true : undefined}
            aria-describedby={fieldError("displayName") ? "displayName-error" : undefined}
          />
          {fieldError("displayName") && (
            <p id="displayName-error" className="text-sm font-semibold text-ink">
              {fieldError("displayName")}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold text-ink">
          E-mail
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className={inputClass}
          aria-invalid={fieldError("email") ? true : undefined}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
        />
        {fieldError("email") && (
          <p id="email-error" className="text-sm font-semibold text-ink">
            {fieldError("email")}
            {emailTaken && (
              <>
                {" "}
                <Link
                  href={ROUTES.signIn}
                  className="text-purple-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
                >
                  Ir para Entrar
                </Link>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold text-ink">
          Senha
        </label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          autoComplete={copy.autocomplete}
          required
          minLength={6}
          maxLength={72}
          className={inputClass}
          aria-invalid={fieldError("password") ? true : undefined}
          aria-describedby={
            [fieldError("password") && "password-error", mode === "signup" && "password-hint"]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {mode === "signup" && (
          <p id="password-hint" className="text-sm text-muted">
            Mínimo de 6 caracteres.
          </p>
        )}
        {fieldError("password") && (
          <p id="password-error" className="text-sm font-semibold text-ink">
            {fieldError("password")}
          </p>
        )}
      </div>

      {/* Região sempre presente para o anúncio do erro de formulário. */}
      <div role="alert" aria-atomic="true">
        {formError && (
          <p className="rounded-md bg-coral-light px-4 py-3 text-sm font-semibold text-ink">
            {formError}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? copy.pending : copy.submit}
      </Button>

      <p className="text-center text-sm text-muted">
        {copy.altText}{" "}
        <Link
          href={copy.altHref}
          className="font-bold text-purple-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-dark"
        >
          {copy.altLink}
        </Link>
      </p>
    </form>
  );
}
