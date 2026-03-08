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

type SubmitStatus = "idle" | "loading" | "success" | "error" | "rate_limited";

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

  if (data.message.trim().length > 2000) {
    errors.message = "Message must not exceed 2000 characters";
  }

  return errors;
}

export default function ContactPage() {
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
      } else if (res.status === 429) {
        setStatus("rate_limited");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900">
          Contact Us
        </h1>
        <p className="mt-3 text-base text-neutral-600">
          Have a question? We&apos;ll get back to you within one business day.
        </p>
      </div>

      {/* Success state */}
      {status === "success" && (
        <div className="mt-10 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-medium text-green-800">Message sent!</p>
          <p className="mt-1 text-sm text-green-700">
            Thanks for reaching out. We&apos;ll get back to you shortly.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setStatus("idle")}
          >
            Send another message
          </Button>
        </div>
      )}

      {/* Rate limited state */}
      {status === "rate_limited" && (
        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">Too many requests</p>
          <p className="mt-1 text-sm text-amber-700">
            You have sent too many messages in the last hour. Please try again
            later.
          </p>
        </div>
      )}

      {/* Form */}
      {status !== "success" && (
        <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="What is your message about?"
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            />
            {errors.subject && (
              <p id="subject-error" className="text-xs text-red-600">
                {errors.subject}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="message">
              Message
              <span className="ml-1 text-xs font-normal text-neutral-500">
                ({form.message.length}/2000)
              </span>
            </Label>
            <Textarea
              id="message"
              name="message"
              rows={6}
              value={form.message}
              onChange={handleChange}
              placeholder="Please describe your question or issue in detail..."
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <p id="message-error" className="text-xs text-red-600">
                {errors.message}
              </p>
            )}
          </div>

          {/* Error state */}
          {status === "error" && (
            <p className="text-sm text-red-600">
              Something went wrong. Please try again or email us directly.
            </p>
          )}

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full"
          >
            {status === "loading" ? "Sending..." : "Send message"}
          </Button>
        </form>
      )}

      {/* Help link */}
      <p className="mt-8 text-center text-sm text-neutral-500">
        Looking for quick answers?{" "}
        <Link href="/help" className="text-brand-primary underline-offset-4 hover:underline">
          Browse our Help Center
        </Link>
      </p>
    </div>
  );
}
