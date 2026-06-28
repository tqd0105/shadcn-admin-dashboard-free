"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { MoreHorizontal, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: { id: string; name: string };
  avatar_url?: string;
  created_at: string;
};

interface UsersDataTableProps {
  data: UserRow[];
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  loading?: boolean;
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}

export default function UsersDataTable({
  data,
  pageCount,
  pageIndex,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  loading,
  onEdit,
  onDelete
}: UsersDataTableProps) {
  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "full_name",
      header: "Tên hiển thị",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatar_url || ""} />
            <AvatarFallback>
              {row.original.full_name?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="font-medium">{row.original.full_name || "N/A"}</div>
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "N/A"
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => {
        const roleName = row.original.role?.name || "N/A";
        return <span className="capitalize">{roleName}</span>;
      }
    },
    {
      accessorKey: "created_at",
      header: "Ngày tạo",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("vi-VN")
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(user)}>Chỉnh sửa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">Xóa tài khoản</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination: {
        pageIndex,
        pageSize
      }
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm email, tên..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow>
                 <TableCell colSpan={columns.length} className="h-24 text-center">
                   Đang tải dữ liệu...
                 </TableCell>
               </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không tìm thấy kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 pt-4">
        <div className="text-sm text-muted-foreground">
          Trang {pageIndex + 1} / {pageCount || 1}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!table.getCanPreviousPage() || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!table.getCanNextPage() || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
