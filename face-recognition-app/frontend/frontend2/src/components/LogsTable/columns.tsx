
import { Button } from "../ui/button";
import { ArrowUpDown } from "lucide-react";
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
 

 
export const columns: ColumnDef<Log>[] = [
  {
    header: "Name",
    accessorFn: (row) => row.userId?.imie ?? "Unknown",
    id: "userId",
  },
  {
    accessorKey: "alkohol",
    header: "Alcohol",
  },
  {
    accessorKey: "temperatura",
    header: "Temperature",
  },
  {
    accessorKey: "dopuszczony",
    header: "Has access?"
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
  }
]