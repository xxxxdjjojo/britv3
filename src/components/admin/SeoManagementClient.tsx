"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Search, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type SeoArticle = {
  id: string;
  title: string;
  article_type: string;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
};

type Props = Readonly<{
  articles: SeoArticle[];
}>;

type EditState = {
  seo_title: string;
  seo_description: string;
};

export function SeoManagementClient({ articles }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    seo_title: "",
    seo_description: "",
  });
  const [saving, setSaving] = useState(false);

  function startEdit(article: SeoArticle) {
    setEditingId(article.id);
    setEditState({
      seo_title: article.seo_title ?? "",
      seo_description: article.seo_description ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cms/${id}/seo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editState),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Failed to save SEO data");
      }

      toast.success("SEO data updated");
      setEditingId(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (articles.length === 0) {
    return (
      <AdminEmptyState
        icon={Search}
        title="No published articles"
        description="Publish articles to manage their SEO settings here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <div
          key={article.id}
          className="rounded-lg border border-neutral-200 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-neutral-800 truncate">
                  {article.title}
                </span>
                <StatusBadge status={article.article_type} />
                <StatusBadge status={article.status} />
              </div>

              {editingId === article.id ? (
                <div className="space-y-2 mt-3">
                  <Input
                    value={editState.seo_title}
                    onChange={(e) =>
                      setEditState((prev) => ({
                        ...prev,
                        seo_title: e.target.value,
                      }))
                    }
                    placeholder="SEO title"
                    className="text-sm"
                  />
                  <Textarea
                    value={editState.seo_description}
                    onChange={(e) =>
                      setEditState((prev) => ({
                        ...prev,
                        seo_description: e.target.value,
                      }))
                    }
                    placeholder="SEO description (150-160 chars)"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ) : (
                <div className="text-sm text-neutral-500 space-y-0.5 mt-1">
                  <p>
                    <span className="text-neutral-400">Title:</span>{" "}
                    {article.seo_title || (
                      <span className="italic text-neutral-300">not set</span>
                    )}
                  </p>
                  <p>
                    <span className="text-neutral-400">Description:</span>{" "}
                    {article.seo_description || (
                      <span className="italic text-neutral-300">not set</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {editingId === article.id ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveEdit(article.id)}
                    disabled={saving}
                    style={{ backgroundColor: "#1B4D3E" }}
                    className="text-white hover:opacity-90"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(article)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit SEO
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
