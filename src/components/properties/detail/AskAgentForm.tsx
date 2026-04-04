"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = Readonly<{
  propertyId: string;
  agentId: string;
  agentName: string;
}>;

type FormState = "idle" | "loading" | "success" | "error";

export default function AskAgentForm({ propertyId, agentId, agentName }: Props) {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  // navigator.onLine is unavailable during SSR; the lazy initializer runs only
  // in the browser so this is safe. Defaults to true on the server.
  const [isOnline, setIsOnline] = useState<boolean>(
    () => (typeof window !== "undefined" ? window.navigator.onLine : true),
  );
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const supabase = useRef(createClient());

  // Detect auth state
  useEffect(() => {
    supabase.current.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  // Online/offline detection — subscribe to network events only
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const charsRemaining = 1000 - message.length;
  const isSubmitDisabled =
    formState === "loading" ||
    formState === "success" ||
    !isOnline ||
    message.trim().length === 0 ||
    (!isLoggedIn && (!name.trim() || !email.trim()));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitDisabled) return;

    setFormState("loading");
    setErrorMessage("");

    try {
      const body: Record<string, string> = {
        agentId,
        message: message.trim(),
      };

      if (!isLoggedIn) {
        body.name = name.trim();
        body.email = email.trim();
      }

      const res = await fetch(`/api/properties/${propertyId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          res.status === 429
            ? "Too many messages sent. Please wait a few minutes before trying again."
            : (data as { error?: string }).error ?? "Something went wrong. Please try again.";
        setErrorMessage(msg);
        setFormState("error");
        return;
      }

      setFormState("success");
    } catch {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
      setFormState("error");
    }
  }

  if (isLoggedIn === null) {
    // Auth state not yet resolved — render a minimal skeleton to avoid layout shift
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-neutral-100" />
        <div className="mt-4 h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
      </div>
    );
  }

  if (formState === "success") {
    return (
      <div className="rounded-xl border border-success/20 bg-success-light p-6 text-center shadow-sm">
        <svg
          className="mx-auto mb-3 h-10 w-10 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <p className="text-base font-semibold text-success-dark">Message sent!</p>
        <p className="mt-1 text-sm text-success">The agent will be in touch.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-brand-primary">
        Contact {agentName}
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        Ask about this property — we&apos;ll forward your message to the agent.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Guest-only name + email */}
        {!isLoggedIn && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ask-agent-name"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Your name <span className="text-error" aria-hidden="true">*</span>
              </label>
              <input
                id="ask-agent-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formState === "loading"}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="ask-agent-email"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Email address <span className="text-error" aria-hidden="true">*</span>
              </label>
              <input
                id="ask-agent-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formState === "loading"}
                placeholder="jane@example.com"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60"
              />
            </div>
          </div>
        )}

        {/* Message textarea */}
        <div className="mb-4">
          <label
            htmlFor="ask-agent-message"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Message <span className="text-error" aria-hidden="true">*</span>
          </label>
          <textarea
            id="ask-agent-message"
            rows={5}
            maxLength={1000}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={formState === "loading"}
            placeholder={`Hi ${agentName}, I'm interested in this property and would like to arrange a viewing...`}
            className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60"
          />
          <p
            className={`mt-1 text-right text-xs ${charsRemaining <= 50 ? "text-warning" : "text-neutral-400"}`}
            aria-live="polite"
          >
            {charsRemaining} character{charsRemaining !== 1 ? "s" : ""} remaining
          </p>
        </div>

        {/* Offline notice */}
        {!isOnline && (
          <p
            role="alert"
            className="mb-3 flex items-center gap-1.5 rounded-lg bg-warning-light px-3 py-2 text-sm text-warning"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            No internet connection
          </p>
        )}

        {/* Error message */}
        {formState === "error" && errorMessage && (
          <p
            role="alert"
            className="mb-3 rounded-lg bg-error-light px-3 py-2 text-sm text-error"
          >
            {errorMessage}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {formState === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending…
            </span>
          ) : (
            "Send Message"
          )}
        </button>
      </form>
    </div>
  );
}
