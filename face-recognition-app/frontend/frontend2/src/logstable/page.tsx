"use client"

import { useEffect, useState } from "react"
import { type Log, columns } from "./columns"
import { DataTable } from "./data-table"

const mockData: Log[] = [
  {
    _id: "1",
    userId: "diana",
    temperatura: 36.7,
    alkohol: 0.05,
    dopuszczony: true,
    czas: new Date().toISOString(),
  },
  {
    _id: "2",
    userId: "diana",
    temperatura: 37.8,
    alkohol: 0.25,
    dopuszczony: false,
    czas: new Date(Date.now() - 3600000).toISOString(), // 1 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "xd",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "lol",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "lol",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "lol",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "lol",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
  {
    _id: "3",
    userId: "lol",
    temperatura: 35.9,
    alkohol: 0.00,
    dopuszczony: true,
    czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
  },
]

export default function DemoPage() {
  const [data, setData] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/logs")
      .then(res => res.json())
      .then((data: Log[]) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Błąd podczas pobierania logów:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="container mx-auto py-10">
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <DataTable columns={columns} data={mockData} />
      )}
    </div>
  )
}
