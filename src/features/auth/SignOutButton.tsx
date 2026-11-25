"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, cn } from "@/components/ui";
import { signOut } from "@/server/actions/auth";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function onClick() {
    startTransition(async () => {
      setFailed(false);
      const result = await signOut();
      if (result.ok) {
        router.push(result.data.redirectTo);
        router.refresh();
      } else {
        setFailed(true);
      }
    });
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button variant="secondary" size="sm" onClick={onClick} disabled={pending} className="w-full">
        {pending ? "Saindo..." : "Sair"}
      </Button>
      <p role="alert" className="text-xs font-semibold text-ink">
        {failed ? "Não foi possível sair. Tente de novo." : null}
      </p>
    </div>
  );
}
