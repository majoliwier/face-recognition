
import type { ColumnDef } from "@tanstack/react-table"
 
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Log = {
  _id: string             
  userId: string          
  temperatura: number     
  alkohol: number         
  dopuszczony: boolean    
  czas: string            
}
 

 
export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "userId",
    header: "UserId",
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
    header: "Time"
  }
]