"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Phone,
} from "lucide-react";

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

const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email us",
    detail: "hello@britestate.co.uk",
    sub: "We reply within one business day",
  },
  {
    icon: Clock,
    title: "Office hours",
    detail: "Mon – Fri, 9am – 6pm",
    sub: "GMT / BST",
  },
  {
    icon: Phone,
    title: "Media enquiries",
    detail: "press@britestate.co.uk",
    sub: "For journalists and press",
  },
];

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
    <div className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
            <MessageSquare className="size-4" />
            <span>We&apos;re here to help</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Contact Us
          </h1>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed">
            Have a question? We&apos;ll get back to you within one business day.
          </p>
        </div>
      </section>

      {/* Contact info strip */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {CONTACT_INFO.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-brand-primary-lighter flex items-center justify-center text-brand-primary shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {item.title}
                    </div>
                    <div className="text-sm text-brand-primary font-medium">
                      {item.detail}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Success state */}
        {status === "success" && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-8">
            <div className="size-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-success" />
            </div>
            <h2 className="font-heading text-xl font-bold text-neutral-900 mb-2">
              Message sent!
            </h2>
            <p className="text-neutral-600 text-sm mb-6">
              Thanks for reaching out. We&apos;ll get back to you within one
              business day.
            </p>
            <Button
              variant="outline"
              onClick={() => setStatus("idle")}
              className="min-h-[44px]"
            >
              Send another message
            </Button>
          </div>
        )}

        {/* Rate limited state */}
        {status === "rate_limited" && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-8">
            <div className="size-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-8 text-warning" />
            </div>
            <h2 className="font-heading text-xl font-bold text-neutral-900 mb-2">
              Too many requests
            </h2>
            <p className="text-neutral-600 text-sm">
              You have sent too many messages in the last hour. Please try again
              later.
            </p>
          </div>
        )}

        {/* Form */}
        {status !== "success" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h2 className="font-heading text-xl font-bold text-neutral-900 mb-6">
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
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
                  className="h-12"
                />
                {errors.name && (
                  <p id="name-error" className="text-xs text-error flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
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
                  className="h-12"
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-error flex items-center gap-1">
                    <AlertCircle className="size-3" />
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
                  className="h-12"
                />
                {errors.subject && (
                  <p id="subject-error" className="text-xs text-error flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message">
                  Message
                  <span className="ml-1 text-xs font-normal text-neutral-400">
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
                  <p id="message-error" className="text-xs text-error flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Error state */}
              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-error bg-error-light rounded-lg px-4 py-3">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Something went wrong. Please try again or email us at{" "}
                    <a href="mailto:hello@britestate.co.uk" className="underline">
                      hello@britestate.co.uk
                    </a>
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-12 text-base font-semibold"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send message"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Help link */}
        <div className="mt-8 bg-brand-primary-lighter rounded-2xl p-6 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900 mb-1">
              Looking for quick answers?
            </div>
            <p className="text-sm text-neutral-600">
              Browse our{" "}
              <Link
                href="/help"
                className="text-brand-primary font-medium underline-offset-4 hover:underline"
              >
                Help Center
              </Link>{" "}
              for guides, FAQs, and step-by-step tutorials.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
