"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import type { AgentCrmClient, ClientType } from "@/types/agent";
import { CLIENT_TYPES } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  Tag,
  Plus,
  X,
  User,
  Home,
  MessageSquare,
  CreditCard,
} from "lucide-react";

type Props = Readonly<{
  client: AgentCrmClient;
}>;

type EditForm = {
  name: string;
  email: string;
  phone: string;
  client_type: ClientType;
};

const CLIENT_TYPE_COLORS: Record<string, string> = {
  buyer: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/10 dark:text-brand-accent",
  seller: "bg-warning-light text-warning dark:bg-warning/10 dark:text-warning",
  renter: "bg-success-light text-success dark:bg-success/10 dark:text-success",
  landlord: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  investor: "bg-success-light text-success dark:bg-success/10 dark:text-success",
};

export function ClientProfile({ client }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(client.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(client.tags ?? []);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { isSubmitting } } =
    useForm<EditForm>({
      defaultValues: {
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        client_type: client.client_type,
      },
    });

  async function onSaveEdit(data: EditForm) {
    try {
      const res = await fetch("/api/agent/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: client.id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          client_type: data.client_type,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Client updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update client");
    }
  }

  async function onSaveNotes() {
    setSaving(true);
    try {
      const res = await fetch("/api/agent/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, notes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  const typeColorClass = CLIENT_TYPE_COLORS[client.client_type] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/agent/crm"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="size-4" strokeWidth={1.25} />
        Back to CRM
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl bg-card shadow-sm overflow-hidden ring-1 ring-border/60">
        {/* Brand accent top strip */}
        <div className="h-1.5 bg-brand-primary" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="size-14 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <User className="size-7 text-accent-foreground" strokeWidth={1.25} />
            </div>

            <div>
              {isEditing ? (
                <form onSubmit={handleSubmit(onSaveEdit)} className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      {...register("name", { required: true })}
                      className="text-xl font-bold h-10 w-64 bg-muted/50 border-border"
                      placeholder="Client name"
                    />
                    <Select
                      defaultValue={client.client_type}
                      onValueChange={(v) => setValue("client_type", v as ClientType)}
                    >
                      <SelectTrigger className="w-36 bg-muted/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="Email"
                      className="w-56 bg-muted/50 border-border"
                    />
                    <Input
                      {...register("phone")}
                      placeholder="Phone"
                      className="w-44 bg-muted/50 border-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="sm"
                      className="bg-brand-primary hover:bg-brand-primary-light text-white"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                    {client.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColorClass}`}>
                      {client.client_type.replace("_", " ")}
                    </span>
                    {client.last_contact_at && (
                      <span className="text-xs text-muted-foreground">
                        Last contact: {new Date(client.last_contact_at).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                  {(client.email || client.phone) && (
                    <div className="mt-2 flex flex-wrap gap-3">
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
                        >
                          <Mail className="size-3.5" strokeWidth={1.25} />
                          {client.email}
                        </a>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
                        >
                          <Phone className="size-3.5" strokeWidth={1.25} />
                          {client.phone}
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-2 shrink-0">
              {client.email && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 gap-1.5"
                >
                  <a href={`mailto:${client.email}`}>
                    <Mail className="size-4" strokeWidth={1.25} />
                    Email
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-9 gap-1.5 bg-brand-primary hover:bg-brand-primary-light text-white"
              >
                <Pencil className="size-4" strokeWidth={1.25} />
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted p-1 gap-1 rounded-xl">
          <TabsTrigger
            value="overview"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-brand-primary gap-1.5"
          >
            <User className="size-3.5" strokeWidth={1.25} />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="properties"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-brand-primary gap-1.5"
          >
            <Home className="size-3.5" strokeWidth={1.25} />
            Properties
          </TabsTrigger>
          <TabsTrigger
            value="communication"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-brand-primary gap-1.5"
          >
            <MessageSquare className="size-3.5" strokeWidth={1.25} />
            Communication
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-brand-primary gap-1.5"
          >
            <CreditCard className="size-3.5" strokeWidth={1.25} />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-accent flex items-center justify-center">
                    <User className="size-3.5 text-accent-foreground" strokeWidth={1.25} />
                  </div>
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                    Email
                  </span>
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="text-brand-primary hover:underline font-medium">
                      {client.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="h-px bg-border/60" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                    Phone
                  </span>
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="text-foreground hover:underline font-medium">
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="h-px bg-border/60" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                    Type
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColorClass}`}>
                    {client.client_type.replace("_", " ")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-accent flex items-center justify-center">
                    <Tag className="size-3.5 text-accent-foreground" strokeWidth={1.25} />
                  </div>
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 min-h-8">
                  {tags.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No tags yet.</span>
                  ) : (
                    tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive transition-colors ml-0.5"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="size-3" strokeWidth={1.25} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    className="bg-muted/50 border-border text-sm h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addTag}
                    className="h-8 gap-1"
                  >
                    <Plus className="size-3.5" strokeWidth={1.25} />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full rounded-xl bg-muted/50 ring-1 ring-border/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card transition-colors min-h-[120px] resize-y placeholder:text-muted-foreground"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this client..."
              />
              <Button
                size="sm"
                onClick={onSaveNotes}
                disabled={saving}
                className="bg-brand-primary hover:bg-brand-primary-light text-white h-8 px-4"
              >
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </CardContent>
          </Card>

          {client.preferences && Object.keys(client.preferences).length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-0">
                  {Object.entries(client.preferences).map(([key, val], i, arr) => (
                    <div key={key}>
                      <div className="flex items-center justify-between py-2.5 text-sm">
                        <dt className="font-semibold text-muted-foreground capitalize text-[11px] uppercase tracking-widest">
                          {key.replace(/_/g, " ")}
                        </dt>
                        <dd className="text-foreground font-medium">
                          {String(val)}
                        </dd>
                      </div>
                      {i < arr.length - 1 && <div className="h-px bg-border/60" />}
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Properties */}
        <TabsContent value="properties" className="mt-4">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="py-14 text-center">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Home className="size-6 text-muted-foreground" strokeWidth={1.25} />
              </div>
              <p className="text-sm font-medium text-foreground">No properties linked</p>
              <p className="text-xs text-muted-foreground mt-1">
                Properties linked to this client will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication */}
        <TabsContent value="communication" className="mt-4">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="py-14 text-center">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="size-6 text-muted-foreground" strokeWidth={1.25} />
              </div>
              <p className="text-sm font-medium text-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Communication history from the messaging system will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="mt-4">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="py-14 text-center">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <CreditCard className="size-6 text-muted-foreground" strokeWidth={1.25} />
              </div>
              <p className="text-sm font-medium text-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Transactions involving this client will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
