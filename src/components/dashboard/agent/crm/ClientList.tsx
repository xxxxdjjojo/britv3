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
import { Badge } from "@/components/ui/badge";
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

type Props = Readonly<{
  clients: AgentCrmClient[];
}>;

type AddClientForm = {
  name: string;
  email: string;
  phone: string;
  client_type: ClientType;
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
          className="font-medium hover:underline"
        >
          {info.getValue() as string}
        </a>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => (info.getValue() as string | null) ?? "—",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: (info) => (info.getValue() as string | null) ?? "—",
    },
    {
      accessorKey: "client_type",
      header: "Type",
      cell: (info) => (
        <Badge variant="outline" className="capitalize">
          {(info.getValue() as string).replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "last_contact_at",
      header: "Last Contact",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? new Date(val).toLocaleDateString("en-GB") : "—";
      },
    },
    {
      id: "actions",
      header: "",
      cell: (info) => (
        <a href={`/dashboard/agent/crm/${info.row.original.id}`}>
          <Button variant="ghost" size="sm">
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
          <Input
            placeholder="Search clients..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
            <SelectTrigger className="w-40">
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
            <Button>Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddClient)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register("name", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client_type">Client Type</Label>
                <Select
                  defaultValue="buyer"
                  onValueChange={(v) => setValue("client_type", v as ClientType)}
                >
                  <SelectTrigger>
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk action bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">{selectedRows.length} selected</span>
          <a href={`mailto:${selectedEmails}`}>
            <Button variant="outline" size="sm">
              Send Email
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Export coming soon")}
          >
            Export
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={
                      header.column.getCanSort() ? "cursor-pointer select-none" : ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {header.column.getIsSorted() === "asc"
                      ? " ↑"
                      : header.column.getIsSorted() === "desc"
                        ? " ↓"
                        : null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
