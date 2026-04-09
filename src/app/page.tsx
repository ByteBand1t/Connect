import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <main className="flex flex-col items-center text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ConnectAsset
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            B2B Asset & Supply Chain Management
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="default" size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
