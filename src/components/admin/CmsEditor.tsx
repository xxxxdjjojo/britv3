"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { TIPTAP_EXTENSIONS } from "@/lib/tiptap-extensions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

type ArticleType = "blog" | "help" | "landing";

type CmsArticle = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  status: "draft" | "published";
  article_type: ArticleType;
};

type Props = Readonly<{
  article?: CmsArticle;
  articleType: ArticleType;
  backHref: string;
}>;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function CmsEditor({ article, articleType, backHref }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    article?.seo_description ?? "",
  );
  const [ogImageUrl, setOgImageUrl] = useState(article?.og_image_url ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    article?.status ?? "draft",
  );

  const editor = useEditor({
    extensions: TIPTAP_EXTENSIONS,
    content: article?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  });

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!article?.id) {
        setSlug(generateSlug(value));
      }
    },
    [article?.id],
  );

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      const id = article?.id ?? "new";
      const content = editor?.getHTML() ?? "";

      const res = await fetch(`/api/admin/cms/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          seo_title: seoTitle,
          seo_description: seoDescription,
          og_image_url: ogImageUrl,
          status,
          article_type: articleType,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Save failed");
      }

      const data = (await res.json()) as { id?: string };
      toast.success("Article saved");

      if (!article?.id && data.id) {
        router.push(`${backHref}/${data.id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-3">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "draft" | "published")}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            style={{ backgroundColor: "#1B4D3E" }}
            className="text-white hover:opacity-90"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="col-span-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Article title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-slug"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Content</Label>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 border-b border-neutral-200 p-2 bg-muted">
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleBold().run()
                  }
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
                  onClick={() =>
                    editor?.chain().focus().toggleItalic().run()
                  }
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
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    editor?.isActive("heading", { level: 2 })
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    editor?.isActive("heading", { level: 3 })
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  H3
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
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    editor?.isActive("orderedList")
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  OL
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    editor?.isActive("blockquote")
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  &#8220;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt(
                      "Enter URL (must start with https:// or http://):",
                    );
                    if (!url) return;
                    if (!/^https?:\/\//i.test(url)) {
                      alert("URL must start with https:// or http://");
                      return;
                    }
                    editor?.chain().focus().setLink({ href: url }).run();
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    editor?.isActive("link")
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  Link
                </button>
              </div>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input
              id="seo_title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="SEO description (150-160 chars)"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="og_image_url">OG Image URL</Label>
            <Input
              id="og_image_url"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
