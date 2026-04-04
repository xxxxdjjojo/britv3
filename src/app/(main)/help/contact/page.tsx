"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type SubmitStatus = "idle" | "loading" | "success" | "error";

function validateForm(data: FormState): FormErrors {
  const errors: FormErrors = {};

  if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (data.subject.trim().length < 5) {
    errors.subject = "Subject must be at least 5 characters";
  }

  if (data.message.trim().length < 20) {
    errors.message = "Message must be at least 20 characters";
  }

  return errors;
}

export default function HelpContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Contact Support
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          Can&apos;t find what you need in our help articles? Send us a message and
          we&apos;ll get back to you within one business day.
        </p>
      </div>

      {/* Success state */}
      {status === "success" && (
        <div className="rounded-xl bg-card p-6 text-center ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <p className="font-heading text-base font-semibold text-foreground">Message sent!</p>
          <p className="mt-1 font-body text-sm text-neutral-500">
            Thanks for reaching out. Our support team will respond shortly.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 font-body text-sm focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            onClick={() => setStatus("idle")}
          >
            Send another message
          </Button>
        </div>
      )}

      {/* Form */}
      {status !== "success" && (
        <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-body text-sm font-medium text-foreground">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                aria-invalid={!!errors.name}
                className="rounded-lg border border-neutral-200/60 bg-card px-3 py-2 font-body text-sm text-foreground placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-primary/30 dark:border-neutral-700/60"
              />
              {errors.name && (
                <p className="font-body text-xs text-error">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-body text-sm font-medium text-foreground">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className="rounded-lg border border-neutral-200/60 bg-card px-3 py-2 font-body text-sm text-foreground placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-primary/30 dark:border-neutral-700/60"
              />
              {errors.email && (
                <p className="font-body text-xs text-error">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="font-body text-sm font-medium text-foreground">Subject</Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="What do you need help with?"
                aria-invalid={!!errors.subject}
                className="rounded-lg border border-neutral-200/60 bg-card px-3 py-2 font-body text-sm text-foreground placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-primary/30 dark:border-neutral-700/60"
              />
              {errors.subject && (
                <p className="font-body text-xs text-error">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="font-body text-sm font-medium text-foreground">Message</Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Please describe your issue in detail..."
                aria-invalid={!!errors.message}
                className="rounded-lg border border-neutral-200/60 bg-card px-3 py-2 font-body text-sm text-foreground placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-primary/30 dark:border-neutral-700/60"
              />
              {errors.message && (
                <p className="font-body text-xs text-error">{errors.message}</p>
              )}
            </div>

            {status === "error" && (
              <p className="font-body text-sm text-error">
                Something went wrong. Please try again.
              </p>
            )}

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-brand-primary py-2.5 font-body text-sm font-medium text-white hover:bg-brand-primary/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            >
              {status === "loading" ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>
      )}

      <p className="mt-6 text-center font-body text-sm text-neutral-500">
        Looking for quick answers?{" "}
        <Link
          href="/help"
          className="text-brand-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
        >
          Browse our Help Centre
        </Link>
      </p>
    </div>
  );
}
