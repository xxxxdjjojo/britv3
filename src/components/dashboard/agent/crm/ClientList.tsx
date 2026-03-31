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
import { Search, UserPlus, Mail, Download, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type Props = Readonly<{
  clients: AgentCrmClient[];
}>;

type AddClientForm = {
  name: string;
  email: string;
  phone: string;
  client_type: ClientType;
};

const CLIENT_TYPE_COLORS: Record<string, string> = {
  buyer: "bg-brand-accent-light text-brand-primary",
  seller: "bg-amber-50 text-amber-700",
  renter: "bg-blue-50 text-blue-700",
  landlord: "bg-purple-50 text-purple-700",
  investor: "bg-emerald-50 text-emerald-700",
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
          className="font-semibold text-[#1a1c1c] hover:text-brand-primary transition-colors"
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
          <a href={`tel:${val}`} className="text-sm hover:underline">{val}</a>
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
        const colorClass = CLIENT_TYPE_COLORS[type] ?? "bg-neutral-100 text-neutral-700";
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
          <span className="text-sm text-[#1a1c1c]">{new Date(val).toLocaleDateString("en-GB")}</span>
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
            className="text-brand-primary hover:bg-brand-accent-light hover:text-brand-primary h-8 px-3 text-xs font-medium"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search clients..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white focus:border-brand-primary transition-colors"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
            <SelectTrigger className="w-40 bg-neutral-50 border-neutral-200">
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
              <UserPlus className="size-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight text-[#1a1c1c]">
                Add New Client
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddClient)} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-[#1a1c1c]">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name", { required: true })}
                  className="bg-neutral-50 border-neutral-200 focus:bg-white focus:border-brand-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-[#1a1c1c]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="bg-neutral-50 border-neutral-200 focus:bg-white focus:border-brand-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-[#1a1c1c]">
                  Phone
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  className="bg-neutral-50 border-neutral-200 focus:bg-white focus:border-brand-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_type" className="text-sm font-medium text-[#1a1c1c]">
                  Client Type
                </Label>
                <Select
                  defaultValue="buyer"
                  onValueChange={(v) => setValue("client_type", v as ClientType)}
                >
                  <SelectTrigger className="bg-neutral-50 border-neutral-200">
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
                  className="border-neutral-200 text-[#1a1c1c] hover:bg-neutral-50"
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
        <div className="flex items-center gap-3 rounded-xl bg-brand-accent-light px-4 py-3 text-sm border-0">
          <span className="font-semibold text-brand-primary">
            {selectedRows.length} selected
          </span>
          <div className="h-4 w-px bg-brand-primary/20" />
          <a href={`mailto:${selectedEmails}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-brand-primary hover:bg-white/60 text-xs font-medium"
            >
              <Mail className="size-3.5" />
              Send Email
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-brand-primary hover:bg-white/60 text-xs font-medium"
            onClick={() => toast.info("Export coming soon")}
          >
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-card overflow-hidden shadow-sm ring-1 ring-border/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-neutral-50/80 hover:bg-neutral-50/80">
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`text-xs font-semibold text-neutral-500 uppercase tracking-wide ${
                        header.column.getCanSort() ? "cursor-pointer select-none hover:text-[#1a1c1c]" : ""
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
                            <ChevronUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-40" />
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
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Search className="size-5 text-neutral-400" />
                    </div>
                    <span className="text-sm">No clients found.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="hover:bg-neutral-50/70 transition-colors data-[state=selected]:bg-brand-accent-light/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm text-[#1a1c1c]">
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
            className="h-8 px-3 text-xs border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-3 text-xs border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
