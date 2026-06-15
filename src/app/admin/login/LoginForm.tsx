"use client";

/** Centered login card — POSTs {password} to /api/admin/login. */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!password) {
      setError("Please enter the admin password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return; // keep the button in its busy state during navigation
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Incorrect password. Please try again.");
    } catch {
      setError("Network error — please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="grid min-h-[calc(100svh-var(--header-h))] place-items-center px-6 py-16">
      <div className="card-surface w-full max-w-sm rounded-2xl p-8">
        <p className="font-display text-3xl leading-none">
          <span className="gold-text">The Grace</span>
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted">Admin console</p>
        <div className="gold-rule my-6" aria-hidden="true" />

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="admin-password" className="mb-2 block text-xs font-medium text-ivory">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "admin-password-error" : undefined}
            className="w-full rounded-lg border border-line bg-ink px-4 py-3 text-sm text-ivory placeholder:text-muted/60 transition-colors duration-200 focus:border-gold focus:outline-none"
            placeholder="Enter admin password"
          />
          {error && (
            <p id="admin-password-error" role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="gold"
            size="md"
            className="mt-6 w-full"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Back to{" "}
          <a href="/" className="text-champagne underline-offset-4 hover:underline">
            the storefront
          </a>
        </p>
      </div>
    </div>
  );
}
