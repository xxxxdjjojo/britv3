
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Plus, Pencil, FileText } from "lucide-react";

type CmsArticle = {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  created_at: string;
};

type Props = Readonly<{
  articles: CmsArticle[];
  newHref: string;
  editHrefPrefix: string;
  emptyMessage: string;
}>;

export function CmsArticleList({
  articles,
  newHref,
  editHrefPrefix,
  emptyMessage,
}: Props) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link href={newHref}>
          <Button
            style={{ backgroundColor: "#1B4D3E" }}
            className="text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Article
          </Button>
        </Link>
      </div>

      {articles.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="No articles yet"
          description={emptyMessage}
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">
                  Published
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">
                    {article.title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" },
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`${editHrefPrefix}/${article.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </Link>
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
