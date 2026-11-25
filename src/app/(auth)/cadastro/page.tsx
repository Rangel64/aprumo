import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";
import { AuthShell } from "@/features/auth/AuthShell";

export const metadata: Metadata = { title: "Criar conta | Aprumo" };

export default function SignUpPage() {
  return (
    <AuthShell title="Crie sua conta." subtitle="Leva menos de um minuto para começar.">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
