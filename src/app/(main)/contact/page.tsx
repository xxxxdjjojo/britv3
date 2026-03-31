"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, MessageSquare, ArrowRight, CheckCircle } from "lucide-react";

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
    label: "Email",
    value: "hello@britestate.co.uk",
    href: "mailto:hello@britestate.co.uk",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "020 1234 5678",
    href: "tel:02012345678",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "1 Liverpool Street, London, EC2M 7QD",
    href: undefined,
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
    <>
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold backdrop-blur-sm">
              <MessageSquare className="size-4" />
              <span>Get in touch</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Contact Us
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
              Have a question, feedback, or need help? We&apos;ll get back to
              you within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-neutral-50 py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left: Contact Info */}
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">
                  Talk to the team
                </h2>
                <p className="text-neutral-600 leading-relaxed">
                  Whether you&apos;re a homebuyer with a question, an agent
                  interested in joining, or a tradesperson looking to grow your
                  business — we&apos;re here to help.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex items-start gap-4 p-5 rounded-xl bg-white shadow-sm border border-neutral-100">
                    <div className="size-10 rounded-lg bg-brand-primary-lighter text-brand-primary flex items-center justify-center shrink-0">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">
                        {item.label}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-neutral-800 font-medium hover:text-brand-primary transition-colors text-sm"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="text-neutral-800 font-medium text-sm">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-brand-primary-lighter p-6">
                <h3 className="font-heading font-bold text-brand-primary mb-2">
                  Looking for quick answers?
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Our Help Centre has answers to the most common questions.
                </p>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-brand-primary font-semibold text-sm hover:underline"
                >
                  Browse Help Centre
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
              {/* Success state */}
              {status === "success" && (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="size-16 rounded-full bg-success-light text-success flex items-center justify-center">
                    <CheckCircle className="size-8" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-neutral-900 mb-2">
                      Message sent!
                    </h3>
                    <p className="text-neutral-500 text-sm">
                      Thanks for reaching out. We&apos;ll get back to you within
                      one business day.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setStatus("idle")}
                  >
                    Send another message
                  </Button>
                </div>
              )}

              {/* Rate limited state */}
              {status === "rate_limited" && (
                <div className="rounded-xl border border-warning bg-warning-light p-6 text-center mb-6">
                  <p className="font-medium text-warning">Too many requests</p>
                  <p className="mt-1 text-sm text-warning">
                    You have sent too many messages in the last hour. Please try
                    again later.
                  </p>
                </div>
              )}

              {/* Form */}
              {status !== "success" && (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-neutral-900 mb-1">
                      Send us a message
                    </h3>
                    <p className="text-sm text-neutral-500">
                      We typically respond within one business day.
                    </p>
                  </div>

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
                      <p id="name-error" className="text-xs text-error">
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
                      <p id="email-error" className="text-xs text-error">
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
                      <p id="subject-error" className="text-xs text-error">
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
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Please describe your question or issue in detail..."
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" className="text-xs text-error">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Error state */}
                  {status === "error" && (
                    <p className="text-sm text-error">
                      Something went wrong. Please try again or email us
                      directly.
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full h-11"
                  >
                    {status === "loading" ? "Sending..." : "Send message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
