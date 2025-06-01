"use client"

import { useState, useEffect, useRef } from 'react';
import { columns, type Log, type User } from "./columns"
import { DataTable } from "./data-table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Webcam from 'react-webcam';

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [isSelectingUser, setIsSelectingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const videoConstraints = {
    width: 320,
    height: 320,
    facingMode: "user"
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleVerify = async () => {
    if (!webcamRef.current || !selectedLog) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      // Convert base64 to blob
      const base64Data = imageSrc.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      
      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');
      formData.append('userId', selectedLog.userId || '');

      const response = await fetch('http://localhost:3000/api/users/verify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.match) {
        // Update log status based on verification and conditions
        const updatedLog = {
          ...selectedLog,
          verificationStatus: 'Verified',
          dopuszczony: selectedLog.temperatura < 37.5 && selectedLog.alkohol < 0.2
        };
        
        // Update the log in the database
        await fetch(`http://localhost:3000/api/logs/${selectedLog._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedLog),
        });

        await fetchLogs(); // Refresh the logs
      } else {
        // Update log status to Failed
        const updatedLog = {
          ...selectedLog,
          verificationStatus: 'Failed',
          verificationAttempts: (selectedLog.verificationAttempts || 0) + 1,
          dopuszczony: false
        };
        
        await fetch(`http://localhost:3000/api/logs/${selectedLog._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedLog),
        });

        await fetchLogs(); // Refresh the logs
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUserSelect = async (userId: string) => {
    if (!selectedLog) return;

    try {
      // Update the log with the selected user
      const updatedLog = {
        ...selectedLog,
        userId,
        verificationStatus: 'Pending'
      };

      await fetch(`http://localhost:3000/api/logs/${selectedLog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLog),
      });

      await fetchLogs(); // Refresh the logs
      setIsSelectingUser(false);
      setSelectedUser("");
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <DataTable 
        columns={columns} 
        data={logs}
        onSelectUser={(log: Log) => {
          setSelectedLog(log);
          setIsSelectingUser(true);
        }}
        onVerify={(log: Log) => {
          setSelectedLog(log);
          setIsVerifying(true);
        }}
      />

      {/* User Selection Dialog */}
      <Dialog open={isSelectingUser} onOpenChange={setIsSelectingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select User</DialogTitle>
          </DialogHeader>
          <Select
            value={selectedUser}
            onValueChange={(value) => {
              setSelectedUser(value);
              handleUserSelect(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={isVerifying} onOpenChange={setIsVerifying}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full"
              />
            </div>
            <Button onClick={handleVerify} className="w-full">
              Verify
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
