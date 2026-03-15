"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AgentCrmClient, ClientType } from "@/types/agent";
import { CLIENT_TYPES } from "@/types/agent";
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  Save,
  X,
  Tag,
  CalendarPlus,
  MessageSquare,
  Building2,
  CreditCard,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type ConversationMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string | null;
};

type LinkedProperty = {
  id: string;
  title: string;
  address: string;
  price: number | null;
  status: string | null;
};

type LinkedTransaction = {
  id: string;
  type: "offer" | "viewing" | "sale";
  label: string;
  status: string;
  date: string;
  href: string;
};

export type ClientProfileData = {
  client: AgentCrmClient;
  messages: ConversationMessage[];
  properties: LinkedProperty[];
  transactions: LinkedTransaction[];
};

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGBP(pence: number | null): string {
  if (pence === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

const CLIENT_TYPE_CONFIG: Record<
  ClientType,
  { label: string; className: string }
> = {
  buyer: { label: "Buyer", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  seller: { label: "Seller", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  landlord: { label: "Landlord", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  tenant: { label: "Tenant", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

// ============================================================================
// Overview Tab
// ============================================================================

type OverviewTabProps = Readonly<{
  client: AgentCrmClient;
  onSave: (fields: Partial<AgentCrmClient>) => Promise<void>;
}>;

function OverviewTab({ client, onSave }: OverviewTabProps) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    client_type: client.client_type,
    notes: client.notes ?? "",
  });

  function handleChange(field: keyof typeof form, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  function handleSave() {
    startTransition(async () => {
      await onSave({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        client_type: form.client_type,
        notes: form.notes || null,
      });
      setEditing(false);
    });
  }

  function handleCancel() {
    setForm({
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      client_type: client.client_type,
      notes: client.notes ?? "",
    });
    setEditing(false);
  }

  // Handle notes blur — auto-save
  function handleNotesBlur() {
    if (editing) return; // don't double-save in edit mode
    if (form.notes !== (client.notes ?? "")) {
      startTransition(async () => {
        await onSave({ notes: form.notes || null });
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Contact details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Contact Details</CardTitle>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1 size-3" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={form.client_type}
                    onValueChange={(v) => handleChange("client_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {CLIENT_TYPE_CONFIG[t].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={pending}>
                  <Save className="mr-1 size-3" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={pending}
                >
                  <X className="mr-1 size-3" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="font-medium">{client.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd>
                  <Badge
                    className={CLIENT_TYPE_CONFIG[client.client_type].className}
                  >
                    {CLIENT_TYPE_CONFIG[client.client_type].label}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd>
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail className="size-3" />
                      {client.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd>
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="size-3" />
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last Contact</dt>
                <dd>{formatDate(client.last_contact_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Added</dt>
                <dd>{formatDate(client.created_at)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      {Object.keys(client.preferences).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 sm:grid-cols-2">
              {Object.entries(client.preferences).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="text-sm font-medium">
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="size-4" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={5}
            placeholder="Add notes about this client..."
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            onBlur={handleNotesBlur}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Notes save automatically when you click away.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Properties Tab
// ============================================================================

type PropertiesTabProps = Readonly<{
  properties: LinkedProperty[];
  clientType: ClientType;
}>;

function PropertiesTab({ properties, clientType }: PropertiesTabProps) {
  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
          <p>
            No linked properties found for this{" "}
            {CLIENT_TYPE_CONFIG[clientType].label.toLowerCase()}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((prop) => (
        <Card key={prop.id} className="hover:bg-muted/50 transition-colors">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Building2 className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{prop.title}</p>
                <p className="text-sm text-muted-foreground">{prop.address}</p>
              </div>
            </div>
            <div className="text-right">
              {prop.price !== null && (
                <p className="font-medium">{formatGBP(prop.price)}</p>
              )}
              {prop.status && (
                <Badge variant="outline" className="text-xs">
                  {prop.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Communication Tab
// ============================================================================

type CommunicationTabProps = Readonly<{
  messages: ConversationMessage[];
}>;

function CommunicationTab({ messages }: CommunicationTabProps) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
          <p>No communication history found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <Card key={msg.id}>
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {msg.sender_name ?? "Unknown sender"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {msg.content}
                  </p>
                </div>
              </div>
              <time className="shrink-0 text-xs text-muted-foreground">
                {formatDateTime(msg.created_at)}
              </time>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Transactions Tab
// ============================================================================

type TransactionsTabProps = Readonly<{
  transactions: LinkedTransaction[];
}>;

function TransactionsTab({ transactions }: TransactionsTabProps) {
  const router = useRouter();

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
          <p>No transactions found for this client.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <Card
          key={tx.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push(tx.href)}
        >
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{tx.label}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {tx.type}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-xs">
                {tx.status}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(tx.date)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Main ClientProfile component
// ============================================================================

type ClientProfileProps = Readonly<ClientProfileData>;

export function ClientProfile({
  client: initialClient,
  messages,
  properties,
  transactions,
}: ClientProfileProps) {
  const router = useRouter();
  const [client, setClient] = useState<AgentCrmClient>(initialClient);
  const [, startTransition] = useTransition();

  async function handleSave(fields: Partial<AgentCrmClient>) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/crm", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: client.id, ...fields }),
        });
        if (!res.ok) throw new Error("Failed to save");
        const updated = (await res.json()) as AgentCrmClient;
        setClient(updated);
      } catch (err) {
        console.error("Failed to save client:", err);
      }
    });
  }

  const cfg = CLIENT_TYPE_CONFIG[client.client_type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/agent/crm")}
          >
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {client.name}
              </h1>
              <Badge className={cfg.className}>{cfg.label}</Badge>
            </div>
            {client.last_contact_at && (
              <p className="text-sm text-muted-foreground">
                Last contacted {formatDate(client.last_contact_at)}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {client.email && (
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${client.email}`}>
                <Mail className="mr-1 size-4" />
                Send Email
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm">
            <CalendarPlus className="mr-1 size-4" />
            Schedule Viewing
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">
            Properties
            {properties.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {properties.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="communication">
            Communication
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {messages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions
            {transactions.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {transactions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab client={client} onSave={handleSave} />
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <PropertiesTab
            properties={properties}
            clientType={client.client_type}
          />
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <CommunicationTab messages={messages} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
