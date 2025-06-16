
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
    name: string;
  } | null;
  
  temperatura: number;
  alkohol: number;
  dopuszczony: boolean;
  czas: Date;
  rejectionReason?: 'None' | 'HighTemperature' | 'HighAlcohol' | 'Both' | 'LowTemperature' | 'LowTemperatureAndHighAlcohol';
};
 

 
export const columns: ColumnDef<Log>[] = [
  {
    header: "Name",
    accessorFn: (row) => row.userId?.name ?? "Unknown",
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
    accessorKey: "rejectionReason",
    header: "Rejection Reason",
    cell: ({ row }) => {
      const reason = row.original.rejectionReason;
      switch (reason) {
        case "HighTemperature":
          return "High temperature";
        case "LowTemperature":
          return "Low temperature";
        case "HighAlcohol":
          return "High alcohol level";
        case "Both":
          return "High temperature and alcohol";
        case "LowTemperatureAndHighAlcohol":
          return "Low temperature and high alcohol";
        default:
          return "-";
      }
    }
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