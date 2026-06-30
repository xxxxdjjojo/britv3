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
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900">
          Contact Support
        </h1>
        <p className="mt-3 text-base text-neutral-600">
          Can&apos;t find what you need in our help articles? Send us a message and
          we&apos;ll get back to you within one business day.
        </p>
      </div>

      {/* Success state */}
      {status === "success" && (
        <div className="mt-10 rounded-xl border border-success/20 bg-success/10 p-6 text-center">
          <p className="font-medium text-success">Message sent!</p>
          <p className="mt-1 text-sm text-success">
            Thanks for reaching out. Our support team will respond shortly.
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

      {/* Form */}
      {status !== "success" && (
        <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
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
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
          </div>

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
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="What do you need help with?"
              aria-invalid={!!errors.subject}
            />
            {errors.subject && (
              <p className="text-xs text-red-600">{errors.subject}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              rows={6}
              value={form.message}
              onChange={handleChange}
              placeholder="Please describe your issue in detail..."
              aria-invalid={!!errors.message}
            />
            {errors.message && (
              <p className="text-xs text-red-600">{errors.message}</p>
            )}
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600">
              Something went wrong. Please try again.
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

      <p className="mt-8 text-center text-sm text-neutral-500">
        Looking for quick answers?{" "}
        <Link
          href="/help"
          className="text-brand-primary underline underline-offset-4"
        >
          Browse our Help Centre
        </Link>
      </p>
    </div>
  );
}
