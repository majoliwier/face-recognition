import { Button } from "../ui/button";
import { ArrowUpDown, Camera } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table"
 
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

export type Log = {
  _id: string;
  userId: {
    _id: string;
    imie: string;
  } | null;
  temperatura: number;
  alkohol: number;
  dopuszczony: boolean;
  czas: Date;
};

export type VerifyHandler = (userId: string) => void;

export const createColumns = (onVerify: VerifyHandler): ColumnDef<Log>[] => [
  {
    header: "Name",
    accessorFn: (row) => row.userId?.imie ?? "Unknown",
    id: "userId",
  },
  {
    accessorKey: "alkohol",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Alcohol
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("alkohol") as number;
      return <div>{value.toFixed(2)} ‰</div>;
    },
  },
  {
    accessorKey: "temperatura",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Temperature
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("temperatura") as number;
      return <div>{value.toFixed(1)} °C</div>;
    },
  },
  {
    accessorKey: "dopuszczony",
    header: "Status",
    cell: ({ row }) => {
      const allowed = row.getValue("dopuszczony") as boolean;
      return (
        <div className={allowed ? "text-green-600" : "text-red-600"}>
          {allowed ? "Allowed" : "Denied"}
        </div>
      );
    },
  },
  {
    accessorKey: "czas",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("czas"));
      return <div>{date.toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const userId = row.original.userId?._id;
      
      return (
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (userId) {
              onVerify(userId);
            }
          }}
          disabled={!userId}
        >
          <Camera className="h-4 w-4" />
        </Button>
      );
    },
  },
]