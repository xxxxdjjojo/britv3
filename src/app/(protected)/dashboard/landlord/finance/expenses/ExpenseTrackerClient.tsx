"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { FinancialEntry } from "@/types/landlord";
import { ALL_FINANCIAL_CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/types/landlord";
import {
  Plus,
  Paperclip,
  Pencil,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type Property = {
  id: string;
  address_line_1: string;
  city: string;
  postcode: string;
};

type Props = Readonly<{
  initialEntries: FinancialEntry[];
  properties: Property[];
}>;

function formatGBP(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCategory(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ExpenseTrackerClient({ initialEntries, properties }: Props) {
  const [entries, setEntries] = useState<FinancialEntry[]>(initialEntries);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancialEntry | null>(null);

  // -- Filtered entries -------------------------------------------------------

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterType !== "all" && e.type !== filterType) return false;
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterProperty !== "all" && e.property_id !== filterProperty) return false;
      if (filterMonth !== "all") {
        const entryMonth = e.entry_date.slice(0, 7); // "YYYY-MM"
        if (entryMonth !== filterMonth) return false;
      }
      return true;
    });
  }, [entries, filterType, filterCategory, filterProperty, filterMonth]);

  // -- Totals -----------------------------------------------------------------

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const e of filtered) {
      if (e.type === "income") income += e.amount;
      else expenses += e.amount;
    }
    return { income, expenses, net: income - expenses };
  }, [filtered]);

  // -- Month options from entries ---------------------------------------------

  const monthOptions = useMemo(() => {
    const months = new Set(entries.map((e) => e.entry_date.slice(0, 7)));
    return [...months].sort().reverse();
  }, [entries]);

  // -- Handlers ---------------------------------------------------------------

  function openAddSheet() {
    setEditingEntry(null);
    setSheetOpen(true);
  }

  function openEditSheet(entry: FinancialEntry) {
    setEditingEntry(entry);
    setSheetOpen(true);
  }

  async function handleDelete(entry: FinancialEntry) {
    try {
      const res = await fetch(`/api/landlord/finance/entries/${entry.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.error ?? "Delete failed");
      }
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success("Entry deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleSaved(saved: FinancialEntry) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setSheetOpen(false);
    toast.success(editingEntry ? "Entry updated" : "Entry logged");
  }

  // The FinancialEntryForm needs a propertyId. For the add sheet, we use the
  // first property or let user pick. For edit, use the entry's property_id.
  const sheetPropertyId = editingEntry?.property_id ?? properties[0]?.id ?? "";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/landlord">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/landlord/finance/expenses">Finances</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Expense Tracker</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Expense Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log and manage income and expense entries across your portfolio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/landlord/finance/report">
              <BarChart3 className="size-4" />
              View Report
            </Link>
          </Button>
          <Button onClick={openAddSheet}>
            <Plus className="size-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | "income" | "expense")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {ALL_FINANCIAL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {formatCategory(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterProperty} onValueChange={(v) => setFilterProperty(v ?? "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.address_line_1}, {p.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMonth} onValueChange={(v) => setFilterMonth(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {monthOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            {filtered.length} {filtered.length === 1 ? "Entry" : "Entries"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Receipt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No entries found. Add your first entry using the button above.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => {
                  const isIncome = entry.type === "income";
                  // Find property name from properties list
                  const prop = properties.find((p) => p.id === entry.property_id);
                  const propLabel = prop
                    ? `${prop.address_line_1}, ${prop.city}`
                    : entry.property_id.slice(0, 8) + "…";

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(entry.entry_date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isIncome
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {isIncome ? "Income" : "Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCategory(entry.category)}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                        {propLabel}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {entry.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <span className={isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {isIncome ? "+" : "-"}{formatGBP(entry.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.receipt_url ? (
                          <a
                            href={entry.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center text-brand-primary hover:text-brand-primary/80"
                            title="View receipt"
                          >
                            <Paperclip className="size-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditSheet(entry)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(entry)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {filtered.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="font-medium">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-green-600 dark:text-green-400">
                        <TrendingUp className="mr-1 inline size-3" />
                        {formatGBP(totals.income)}
                      </span>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        <TrendingDown className="mr-1 inline size-3" />
                        {formatGBP(totals.expenses)}
                      </span>
                      <span
                        className={`font-bold ${totals.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        <Minus className="mr-1 inline size-3" />
                        Net: {formatGBP(totals.net)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingEntry ? "Edit Entry" : "Add Entry"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {sheetPropertyId ? (
              <FinancialEntryFormWrapper
                propertyId={sheetPropertyId}
                entry={editingEntry}
                onSaved={handleSaved}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No properties found. Add a property to your portfolio first.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this financial entry. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// -- Wrapper to adapt FinancialEntryForm for edit mode -----------------------

/**
 * Wraps the existing FinancialEntryForm to handle edit mode by intercepting
 * the form submission and calling the PATCH endpoint instead.
 *
 * For new entries: calls POST /api/landlord/finance/entries
 * For edits: calls PATCH /api/landlord/finance/entries/[id]
 */
function FinancialEntryFormWrapper(
  props: Readonly<{
    propertyId: string;
    entry: FinancialEntry | null;
    onSaved: (entry: FinancialEntry) => void;
  }>,
) {
  // The existing FinancialEntryForm calls /api/properties/[id]/financials.
  // For the expense tracker we need the new unified endpoint.
  // We render the form and intercept via a custom fetch shim approach:
  // Instead, we create a thin inline form that reuses the same Zod schema.
  // The simplest correct approach: use FinancialEntryForm for new entries
  // (it already works), and for edits we provide a simpler form here.

  if (!props.entry) {
    // New entry — override the form's fetch to go to the landlord API.
    // We use a custom POST form since FinancialEntryForm hardcodes the
    // /api/properties/[id]/financials URL. We render a standalone form here
    // that mirrors the same UX and calls our new endpoint.
    return (
      <InlineEntryForm
        propertyId={props.propertyId}
        entry={null}
        onSaved={props.onSaved}
      />
    );
  }

  return (
    <InlineEntryForm
      propertyId={props.propertyId}
      entry={props.entry}
      onSaved={props.onSaved}
    />
  );
}

// -- InlineEntryForm ---------------------------------------------------------

type InlineEntryFormProps = Readonly<{
  propertyId: string;
  entry: FinancialEntry | null;
  onSaved: (entry: FinancialEntry) => void;
}>;

function InlineEntryForm({ propertyId, entry, onSaved }: InlineEntryFormProps) {
  const isEdit = entry !== null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<"income" | "expense">(
    entry?.type ?? "expense",
  );
  const [category, setCategory] = useState(entry?.category ?? "");
  const [amount, setAmount] = useState(
    entry?.amount?.toString() ?? "",
  );
  const [entryDate, setEntryDate] = useState(
    entry?.entry_date ?? new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState(entry?.description ?? "");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!category || !amount || isNaN(amountNum) || amountNum <= 0 || !entryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        property_id: propertyId,
        type,
        category,
        amount: amountNum,
        entry_date: entryDate,
        description: description || undefined,
      };

      let res: Response;
      if (isEdit && entry) {
        res = await fetch(`/api/landlord/finance/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, category, amount: amountNum, entry_date: entryDate, description: description || undefined }),
        });
      } else {
        res = await fetch("/api/landlord/finance/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save entry");
      }

      const saved = await res.json() as FinancialEntry;
      onSaved(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => { setType("income"); setCategory(""); }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            type === "income"
              ? "bg-white text-green-700 shadow-sm dark:bg-gray-800 dark:text-green-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => { setType("expense"); setCategory(""); }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            type === "expense"
              ? "bg-white text-red-700 shadow-sm dark:bg-gray-800 dark:text-red-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Expense
        </button>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select category…</option>
          {categories.map((c: string) => (
            <option key={c} value={c}>
              {formatCategory(c)}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium">Amount (GBP)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="0.00"
          className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium">Date</label>
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium">Description (optional)</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEdit ? "Update Entry" : "Log Entry"}
        </Button>
      </div>
    </form>
  );
}
