"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AgentCrmClient, ClientType } from "@/types/agent";
import { CLIENT_TYPES } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = Readonly<{
  client: AgentCrmClient;
}>;

type EditForm = {
  name: string;
  email: string;
  phone: string;
  client_type: ClientType;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <a
            href="/dashboard/agent/crm"
            className="mb-2 inline-block text-sm text-muted-foreground hover:underline"
          >
            ← Back to CRM
          </a>

          {isEditing ? (
            <form onSubmit={handleSubmit(onSaveEdit)} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  {...register("name", { required: true })}
                  className="text-2xl font-bold h-10 w-64"
                  placeholder="Client name"
                />
                <Select
                  defaultValue={client.client_type}
                  onValueChange={(v) => setValue("client_type", v as ClientType)}
                >
                  <SelectTrigger className="w-36">
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
                <Input {...register("email")} type="email" placeholder="Email" className="w-56" />
                <Input {...register("phone")} placeholder="Phone" className="w-44" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} size="sm">
                  {isSubmitting ? "Saving..." : "Save"}
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
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {client.client_type.replace("_", " ")}
                </Badge>
                {client.last_contact_at && (
                  <span>
                    Last contact:{" "}
                    {new Date(client.last_contact_at).toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-2">
            {client.email && (
              <a href={`mailto:${client.email}`}>
                <Button variant="outline" size="sm">
                  Send Email
                </Button>
              </a>
            )}
            <Button size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client.email ? (
                <div>
                  <span className="font-medium">Email: </span>
                  <a href={`mailto:${client.email}`} className="hover:underline">
                    {client.email}
                  </a>
                </div>
              ) : (
                <div>
                  <span className="font-medium">Email: </span>
                  <span className="text-muted-foreground">—</span>
                </div>
              )}
              {client.phone ? (
                <div>
                  <span className="font-medium">Phone: </span>
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </div>
              ) : (
                <div>
                  <span className="font-medium">Phone: </span>
                  <span className="text-muted-foreground">—</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this client..."
              />
              <Button size="sm" onClick={onSaveNotes} disabled={saving}>
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No tags yet.</span>
                ) : (
                  tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    className="max-w-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {client.preferences && Object.keys(client.preferences).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1 text-sm">
                  {Object.entries(client.preferences).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <dt className="font-medium capitalize">
                        {key.replace(/_/g, " ")}:
                      </dt>
                      <dd className="text-muted-foreground">
                        {String(val)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Properties */}
        <TabsContent value="properties" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Properties linked to this client would appear here.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication */}
        <TabsContent value="communication" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Communication history from the messaging system would appear here.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Transactions involving this client would appear here.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
