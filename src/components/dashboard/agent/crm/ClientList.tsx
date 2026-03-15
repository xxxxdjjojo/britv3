"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import type { AgentCrmClient, ClientType, CreateCrmClientInput } from "@/types/agent";
import { CLIENT_TYPES } from "@/types/agent";
import { ChevronUp, ChevronDown, ChevronsUpDown, UserPlus, Mail, Tag, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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

const CLIENT_TYPE_CONFIG: Record<
  ClientType,
  { label: string; className: string }
> = {
  buyer: {
    label: "Buyer",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  seller: {
    label: "Seller",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  landlord: {
    label: "Landlord",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  tenant: {
    label: "Tenant",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
};

// ============================================================================
// Column helper
// ============================================================================

const columnHelper = createColumnHelper<AgentCrmClient>();

// ============================================================================
// Add Client Dialog
// ============================================================================

type AddClientDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCrmClientInput) => Promise<void>;
}>;

function AddClientDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddClientDialogProps) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    client_type: ClientType;
    notes: string;
  }>({
    name: "",
    email: "",
    phone: "",
    client_type: "buyer",
    notes: "",
  });

  function handleChange(field: keyof typeof form, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await onSubmit({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        client_type: form.client_type,
        notes: form.notes || null,
        tags: [],
      });
      setForm({ name: "", email: "", phone: "", client_type: "buyer", notes: "" });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="07700 900000"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="client_type">Type</Label>
            <Select
              value={form.client_type}
              onValueChange={(v) => handleChange("client_type", v)}
            >
              <SelectTrigger id="client_type">
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
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any initial notes..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Add Tag Dialog (for bulk action)
// ============================================================================

type AddTagDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tag: string) => Promise<void>;
  count: number;
}>;

function AddTagDialog({
  open,
  onOpenChange,
  onSubmit,
  count,
}: AddTagDialogProps) {
  const [tag, setTag] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tag.trim()) return;
    startTransition(async () => {
      await onSubmit(tag.trim());
      setTag("");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tag to {count} Client{count !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="tag">Tag</Label>
            <Input
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. vip, mortgage-ready"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add Tag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Sort icon helper
// ============================================================================

function SortIcon({
  state,
}: Readonly<{ state: false | "asc" | "desc" }>) {
  if (state === "asc") return <ChevronUp className="ml-1 inline size-3" />;
  if (state === "desc") return <ChevronDown className="ml-1 inline size-3" />;
  return <ChevronsUpDown className="ml-1 inline size-3 opacity-40" />;
}

// ============================================================================
// ClientList props
// ============================================================================

type ClientListProps = Readonly<{
  initialClients: AgentCrmClient[];
  initialTotal: number;
}>;

// ============================================================================
// Main component
// ============================================================================

export function ClientList({ initialClients, initialTotal }: ClientListProps) {
  const router = useRouter();

  // Table data state
  const [clients, setClients] = useState<AgentCrmClient[]>(initialClients);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 25;

  // Filter / search state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientType | "all">("all");

  // Table sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

  // Row selection
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  // Loading
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setOffset(0);
      fetchClients(value, typeFilter, 0);
    }, 350);
    return () => clearTimeout(timer);
  }, [typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchClients(
    searchTerm: string,
    clientType: ClientType | "all",
    newOffset: number,
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (clientType !== "all") params.set("client_type", clientType);
      params.set("offset", String(newOffset));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/agent/crm?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = (await res.json()) as {
        clients: AgentCrmClient[];
        total: number;
      };
      setClients(data.clients);
      setTotal(data.total);
      setOffset(newOffset);
      setRowSelection({});
    } catch (err) {
      console.error("Failed to fetch CRM clients:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleTypeFilterChange(value: ClientType | "all") {
    setTypeFilter(value);
    setOffset(0);
    fetchClients(debouncedSearch, value, 0);
  }

  // Column definitions
  const columns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">
            {info.row.original.email ?? "—"}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.accessor("client_type", {
      header: "Type",
      cell: (info) => {
        const cfg = CLIENT_TYPE_CONFIG[info.getValue()];
        return (
          <Badge className={cfg.className}>{cfg.label}</Badge>
        );
      },
    }),
    columnHelper.accessor("tags", {
      header: "Tags",
      enableSorting: false,
      cell: (info) => {
        const tags = info.getValue();
        if (!tags.length) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("last_contact_at", {
      header: "Last Contact",
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/agent/crm/${row.original.id}`);
          }}
        >
          View
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    rowCount: total,
    getRowId: (row) => row.id,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedClients = selectedRows.map((r) => r.original);

  // Bulk actions
  function handleBulkEmail() {
    const emails = selectedClients
      .map((c) => c.email)
      .filter((e): e is string => Boolean(e))
      .join(",");
    if (emails) {
      window.location.href = `mailto:${emails}`;
    }
  }

  async function handleBulkAddTag(tag: string) {
    startTransition(async () => {
      await Promise.all(
        selectedClients.map((c) =>
          fetch("/api/agent/crm", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: c.id,
              tags: Array.from(new Set([...c.tags, tag])),
            }),
          }),
        ),
      );
      await fetchClients(debouncedSearch, typeFilter, offset);
    });
  }

  async function handleAddClient(data: CreateCrmClientInput) {
    const res = await fetch("/api/agent/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add client");
    router.refresh();
    await fetchClients(debouncedSearch, typeFilter, offset);
  }

  const hasPrevPage = offset > 0;
  const hasNextPage = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={typeFilter}
            onValueChange={(v) =>
              handleTypeFilterChange(v as ClientType | "all")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {CLIENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {CLIENT_TYPE_CONFIG[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-2 size-4" />
          Add Client
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedClients.length > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">
            {selectedClients.length} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEmail}
          >
            <Mail className="mr-1 size-3" />
            Send Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTagOpen(true)}
          >
            <Tag className="mr-1 size-3" />
            Add Tag
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={
                      header.column.getCanSort() ? "cursor-pointer select-none" : ""
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <SortIcon state={header.column.getIsSorted()} />
                        )}
                      </>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={() =>
                    router.push(`/dashboard/agent/crm/${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total === 0
            ? "No clients"
            : `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClients(debouncedSearch, typeFilter, offset - PAGE_SIZE)}
            disabled={!hasPrevPage || loading}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClients(debouncedSearch, typeFilter, offset + PAGE_SIZE)}
            disabled={!hasNextPage || loading}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddClient}
      />
      <AddTagDialog
        open={tagOpen}
        onOpenChange={setTagOpen}
        onSubmit={handleBulkAddTag}
        count={selectedClients.length}
      />
    </div>
  );
}
