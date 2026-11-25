import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";
import { AuthShell } from "@/features/auth/AuthShell";

export const metadata: Metadata = { title: "Entrar | Aprumo" };

export default function SignInPage() {
  return (
    <AuthShell title="Que bom te ver de novo." subtitle="Entre para continuar sua Jornada.">
      <AuthForm mode="signin" />
    </AuthShell>
  );
}
