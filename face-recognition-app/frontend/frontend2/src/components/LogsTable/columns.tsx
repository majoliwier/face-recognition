"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// export type Log = {
//   _id: string             
//   userId: string          
//   temperatura: number     
//   alkohol: number         
//   dopuszczony: boolean    
//   czas: string            
// }

export interface User {
  _id: string;
  name: string;
}

export interface Log {
  _id: string;
  userId?: string;
  user?: User;
  temperatura: number;
  alkohol: number;
  dopuszczony: boolean;
  czas: string;
  verificationStatus: 'Unknown' | 'Pending' | 'Verified' | 'Failed';
  verificationAttempts: number;
}

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "czas",
    header: "Time",
    cell: ({ row }) => {
      const date = new Date(row.getValue("czas"));
      return date.toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
  },
  {
    accessorKey: "user",
    header: "User",
    filterFn: (row, id, value) => {
      return row.original.user?.name?.toLowerCase().includes(value.toLowerCase()) || false;
    },
    cell: ({ row, table }) => {
      const log = row.original;
      return log.user?.name || (
        <Button
          variant="outline"
          onClick={() => {
            // @ts-ignore - we'll add this to the table meta
            table.options.meta?.onSelectUser(log);
          }}
        >
          Select User
        </Button>
      );
    },
  },
  {
    accessorKey: "temperatura",
    header: "Temperature",
    cell: ({ row }) => {
      const temp = parseFloat(row.getValue("temperatura"));
      return `${temp.toFixed(1)}°C`;
    },
  },
  {
    accessorKey: "alkohol",
    header: "Alcohol",
    cell: ({ row }) => {
      const alcohol = parseFloat(row.getValue("alkohol"));
      return alcohol.toFixed(2);
    },
  },
  {
    accessorKey: "verificationStatus",
    header: "Status",
    cell: ({ row }) => {
      const log = row.original;
      return log.verificationStatus === 'Verified'
        ? (log.dopuszczony ? 'Allowed' : 'Denied')
        : log.verificationStatus;
    },
  },
  {
    accessorKey: "verificationAttempts",
    header: "Verification",
    cell: ({ row }) => {
      const attempts = row.getValue("verificationAttempts") as number;
      return `${attempts || 0} attempts`;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const log = row.original;
      return log.userId && log.verificationStatus !== 'Verified' ? (
        <Button
          onClick={() => {
            // @ts-ignore - we'll add this to the table meta
            table.options.meta?.onVerify(log);
          }}
        >
          Verify
        </Button>
      ) : null;
    },
  },
];