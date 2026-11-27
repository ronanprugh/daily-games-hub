"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type ActionResult } from "../app/actions";

export function AuthForm({ inviteRequired }: { inviteRequired: boolean }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const action = mode === "in" ? signIn : signUp;
  const [state, submit, pending] = useActionState<ActionResult, FormData>(action, {});

  return (
    <main className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="text-2xl font-semibold">Daily Games</h1>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">
        {mode === "in" ? "Sign in to track your scores." : "Make an account to start."}
      </p>

      <form action={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            name="username"
            autoComplete="username"
            required
            className="min-h-11 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            required
            className="min-h-11 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3"
          />
          {mode === "up" ? (
            <span className="text-xs text-[var(--muted)]">At least 8 characters.</span>
          ) : null}
        </label>

        {mode === "up" && inviteRequired ? (
          <label className="flex flex-col gap-1 text-sm">
            Invite code
            <input
              name="code"
              required
              className="min-h-11 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3"
            />
          </label>
        ) : null}

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-[var(--accent)] px-4 font-medium text-white disabled:opacity-50"
        >
          {pending ? "…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-4 min-h-11 text-sm text-[var(--muted)] hover:underline"
      >
        {mode === "in" ? "Need an account?" : "Already have one? Sign in"}
      </button>
    </main>
  );
}
