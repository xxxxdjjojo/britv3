"use client";

import { useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import type { AgentCrmClient, ClientType, CreateCrmClientInput } from "@/types/agent";
import { CLIENT_TYPES } from "@/types/agent";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  UserPlus,
  Mail,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Users,
} from "lucide-react";

type Props = Readonly<{
  clients: AgentCrmClient[];
}>;

type AddClientForm = {
  name: string;
  email: string;
  phone: string;
  client_type: ClientType;
};

// CSS-var-compatible badge classes — semantic colors from design system
const CLIENT_TYPE_COLORS: Record<string, string> = {
  buyer: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/10 dark:text-brand-accent",
  seller: "bg-warning-light text-warning dark:bg-warning/10 dark:text-warning",
  renter: "bg-success-light text-success dark:bg-success/10 dark:text-success",
  landlord: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  investor: "bg-success-light text-success dark:bg-success/10 dark:text-success",
};

export function ClientList({ clients }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm<AddClientForm>({
    defaultValues: { name: "", email: "", phone: "", client_type: "buyer" },
  });

  const handleSearchChange = useCallback(
    (val: string) => {
      setSearchInput(val);
      const t = setTimeout(() => {
        setGlobalFilter(val);
      }, 300);
      return () => clearTimeout(t);
    },
    [],
  );

  const columns: ColumnDef<AgentCrmClient>[] = [
    {
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
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: (info) => (
        <a
          href={`/dashboard/agent/crm/${info.row.original.id}`}
          className="font-semibold text-foreground hover:text-brand-primary transition-colors"
        >
          {info.getValue() as string}
        </a>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? (
          <a href={`mailto:${val}`} className="text-brand-primary hover:underline text-sm">
            {val}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? (
          <a href={`tel:${val}`} className="text-sm text-foreground hover:underline">{val}</a>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "client_type",
      header: "Type",
      cell: (info) => {
        const type = info.getValue() as string;
        const colorClass = CLIENT_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground";
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
            {type.replace("_", " ")}
          </span>
        );
      },
    },
    {
      accessorKey: "last_contact_at",
      header: "Last Contact",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? (
          <span className="text-sm text-foreground">{new Date(val).toLocaleDateString("en-GB")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: (info) => (
        <a href={`/dashboard/agent/crm/${info.row.original.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-primary hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs font-medium"
          >
            View
          </Button>
        </a>
      ),
    },
  ];

  const filteredData =
    typeFilter === "all"
      ? clients
      : clients.filter((c) => c.client_type === typeFilter);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 25 } },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedEmails = selectedRows
    .map((r) => r.original.email)
    .filter(Boolean)
    .join(",");

  async function onAddClient(data: AddClientForm) {
    setSubmitting(true);
    try {
      const body: Partial<CreateCrmClientInput> = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        client_type: data.client_type,
      };
      const res = await fetch("/api/agent/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to add client");
      toast.success("Client added successfully");
      reset();
      setAddOpen(false);
    } catch {
      toast.error("Failed to add client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative max-w-xs flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              strokeWidth={1.25}
            />
            <Input
              placeholder="Search clients..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-muted/50 border-border focus:bg-background focus:border-ring transition-colors"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
            <SelectTrigger className="w-40 bg-muted/50 border-border">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {CLIENT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-primary hover:bg-brand-primary-light text-white gap-2 shrink-0">
              <UserPlus className="size-4" strokeWidth={1.25} />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground font-heading">
                Add New Client
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddClient)} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: true })}
                  className="bg-muted/50 border-border focus:bg-background focus:border-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="bg-muted/50 border-border focus:bg-background focus:border-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  className="bg-muted/50 border-border focus:bg-background focus:border-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_type" className="text-sm font-medium text-foreground">
                  Client Type
                </Label>
                <Select
                  defaultValue="buyer"
                  onValueChange={(v) => setValue("client_type", v as ClientType)}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
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
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-primary hover:bg-brand-primary-light text-white"
                >
                  {submitting ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk action bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-accent px-4 py-3 text-sm shadow-sm">
          <span className="font-semibold text-accent-foreground">
            {selectedRows.length} selected
          </span>
          <div className="h-4 w-px bg-accent-foreground/20" />
          <a href={`mailto:${selectedEmails}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-accent-foreground hover:bg-background/40 text-xs font-medium"
            >
              <Mail className="size-3.5" strokeWidth={1.25} />
              Send Email
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-accent-foreground hover:bg-background/40 text-xs font-medium"
            onClick={() => toast.info("Export coming soon")}
          >
            <Download className="size-3.5" strokeWidth={1.25} />
            Export
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-card overflow-hidden shadow-sm ring-1 ring-border/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`text-[11px] font-semibold text-muted-foreground uppercase tracking-widest ${
                        header.column.getCanSort() ? "cursor-pointer select-none hover:text-foreground" : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {header.column.getCanSort() && (
                          sorted === "asc" ? (
                            <ChevronUp className="size-3.5" strokeWidth={1.25} />
                          ) : sorted === "desc" ? (
                            <ChevronDown className="size-3.5" strokeWidth={1.25} />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-40" strokeWidth={1.25} />
                          )
                        )}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                      <Users className="size-6 text-muted-foreground" strokeWidth={1.25} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No clients found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {clients.length === 0
                          ? "Add your first client to get started."
                          : "Try adjusting your search or filter."}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="hover:bg-muted/30 transition-colors data-[state=selected]:bg-accent/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-sm text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span className="text-xs">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
          {" · "}
          {filteredData.length} {filteredData.length === 1 ? "client" : "clients"}
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-3 text-xs disabled:opacity-40"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-3 text-xs disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
