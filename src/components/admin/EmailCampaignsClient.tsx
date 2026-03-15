"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { TIPTAP_EXTENSIONS } from "@/lib/tiptap-extensions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { useAdminAction } from "@/hooks/useAdminAction";
import { Mail, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipient_count: number | null;
  scheduled_at: string | null;
  created_at: string;
};

type Props = Readonly<{
  campaigns: Campaign[];
}>;

const ALL_ROLES = [
  "homebuyer",
  "renter",
  "seller",
  "landlord",
  "estate_agent",
  "service_provider",
  "admin",
];

type CreateForm = {
  name: string;
  subject: string;
  target_roles: string[];
  scheduled_at: string;
};

const EMPTY_FORM: CreateForm = {
  name: "",
  subject: "",
  target_roles: [],
  scheduled_at: "",
};

export function EmailCampaignsClient({ campaigns }: Props) {
  const router = useRouter();
  const { execute, isPending } = useAdminAction();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const editor = useEditor({
    extensions: TIPTAP_EXTENSIONS,
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] p-3 focus:outline-none",
      },
    },
  });

  function toggleRole(role: string) {
    setForm((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter((r) => r !== role)
        : [...prev.target_roles, role],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error("Name and subject are required");
      return;
    }

    setCreating(true);
    try {
      const content = editor?.getHTML() ?? "";

      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          subject: form.subject,
          content,
          target_roles: form.target_roles,
          scheduled_at: form.scheduled_at || null,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Failed to create campaign");
      }

      toast.success("Campaign created");
      setForm(EMPTY_FORM);
      editor?.commands.clearContent();
      setShowCreate(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleSend(id: string) {
    if (!confirm("Send this campaign now? This cannot be undone.")) return;
    const ok = await execute(`/api/admin/campaigns/${id}/send`, {
      method: "POST",
    });
    if (ok) toast.success("Campaign marked as sent");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreate((v) => !v)}
          style={{ backgroundColor: "#1B4D3E" }}
          className="text-white hover:opacity-90"
        >
          {showCreate ? (
            <>
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1.5" />
              New Campaign
            </>
          )}
        </Button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-neutral-200 p-4 space-y-4 bg-neutral-50"
        >
          <h3 className="font-semibold text-neutral-800">
            Create Email Campaign
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="campaign_name">Campaign Name *</Label>
              <Input
                id="campaign_name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Spring Update"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campaign_subject">Subject Line *</Label>
              <Input
                id="campaign_subject"
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Here's what's new on Britestate"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Content</Label>
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
              <div className="flex flex-wrap gap-1 border-b border-neutral-200 p-2 bg-neutral-50">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    editor?.isActive("bold")
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-2 py-1 rounded text-xs italic transition-colors ${
                    editor?.isActive("italic")
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    editor?.isActive("bulletList")
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  UL
                </button>
              </div>
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Target Roles</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                    form.target_roles.includes(role)
                      ? "bg-[#1B4D3E] text-white border-[#1B4D3E]"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduled_at">Schedule At (optional)</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              style={{ backgroundColor: "#1B4D3E" }}
              className="text-white hover:opacity-90"
            >
              {creating ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      )}

      {campaigns.length === 0 ? (
        <AdminEmptyState
          icon={Mail}
          title="No campaigns"
          description="Create email campaigns to reach your users."
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Subject
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Recipients
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Scheduled
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">
                    {campaign.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 max-w-xs truncate">
                    {campaign.subject}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {campaign.recipient_count ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {campaign.scheduled_at
                      ? new Date(campaign.scheduled_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {campaign.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(campaign.id)}
                        disabled={isPending}
                        style={{ borderColor: "#1B4D3E", color: "#1B4D3E" }}
                        className="hover:opacity-80"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Send
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
