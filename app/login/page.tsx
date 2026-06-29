import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { requireCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await requireCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-50">
      <AuthForm />
    </main>
  );
}
