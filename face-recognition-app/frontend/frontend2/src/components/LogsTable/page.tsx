"use client"

import { useEffect, useState, useRef } from "react"
import { type Log, createColumns } from "./columns"
import { DataTable } from "./data-table"
import Webcam from "react-webcam"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// const mockData: Log[] = [
//   {
//     _id: "1",
//     userId: "diana",
//     temperatura: 36.7,
//     alkohol: 0.05,
//     dopuszczony: true,
//     czas: new Date().toISOString(),
//   },
//   {
//     _id: "2",
//     userId: "diana",
//     temperatura: 37.8,
//     alkohol: 0.25,
//     dopuszczony: false,
//     czas: new Date(Date.now() - 3600000).toISOString(), // 1 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "xd",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "lol",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "lol",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "lol",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "lol",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
//   {
//     _id: "3",
//     userId: "lol",
//     temperatura: 35.9,
//     alkohol: 0.00,
//     dopuszczony: true,
//     czas: new Date(Date.now() - 7200000).toISOString(), // 2 godz. temu
//   },
// ]

export default function LogsTable() {
  const [data, setData] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const webcamRef = useRef<Webcam | null>(null)

  const videoConstraints = {
    width: 400,
    height: 400,
    facingMode: "user"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/logs');
        const logs = await response.json();
        setData(logs);
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast.error('Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (userId: string) => {
    setSelectedUserId(userId);
    setIsVerifying(true);
  };

  const handleCapture = async () => {
    if (webcamRef.current && selectedUserId) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        toast.error('Failed to capture image');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedUserId,
            image: imageSrc,
          }),
        });

        const result = await response.json();

        if (result.verified) {
          toast.success('Verification successful');
        } else {
          toast.error('Verification failed');
        }
      } catch (error) {
        console.error('Error during verification:', error);
        toast.error('Verification failed');
      } finally {
        setIsVerifying(false);
        setSelectedUserId(null);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const columns = createColumns(handleVerify);

  return (
    <>
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={data} />
      </div>

      <Dialog open={isVerifying} onOpenChange={setIsVerifying}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify User</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="rounded-lg"
            />
            <Button onClick={handleCapture}>
              Verify
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
