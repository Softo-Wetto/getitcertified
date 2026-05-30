"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithPassword } from "@/lib/pocketbase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await signUpWithPassword(email.trim(), password);
      setMessage("Account created.");
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed.";
      setError(message);
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-5xl place-items-center px-6 py-16">
      <div className="cyber-panel w-full max-w-md rounded-3xl p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold text-slate-50">Create access</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create an account to manage bookmarks and resource downloads.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">
            Sign up
          </button>
        </form>
      </div>
    </main>
  );
}
