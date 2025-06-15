import { Button } from "../ui/button"
import Webcam from "react-webcam";
import { useState, useEffect, useRef } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { SensorDisplay } from "./SensorDisplay";

export default function Recognition(){

    const webcamRef = useRef<Webcam>(null);
    const [isRecognizing, setIsRecognizing] = useState(false);

    const [isSensorDataDisplayed, setIsSensorDataDisplayed] = useState(false);
    const [userName, setUserName] = useState<string>();
    const [temp, setTemp] = useState<string>();
    const [alc, setAlc] = useState<string>();

    const handleVerify = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    setIsRecognizing(false);

    try {
      const base64Data = imageSrc.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      console.log(`Blob size: ${blob.size}`)
      
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');

      const response = await fetch('http://localhost:3000/api/users/recognize', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log(result)

      if (result.recognized) {
        setUserName(result.user.name);
        console.log(result.user.id);

        await fetch(`http://localhost:3000/api/logs/${result.user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

            // Odczekaj, aż dane się zapiszą
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Pobierz ostatni log
        const res = await fetch(`http://localhost:3000/api/logs/latest/${result.user.id}`);
        const log = await res.json();

        if (log && log.temperatura && log.alkohol) {
          setTemp(log.temperatura);
          setAlc(log.alkohol);
          setIsSensorDataDisplayed(true);
        }

       



      } else {
        setUserName("No matching face.")
      }
      
    //   if (result.match) {
    //     // Update log status based on verification and conditions
    //     const updatedLog = {
    //       ...selectedLog,
    //       verificationStatus: 'Verified',
    //       dopuszczony: selectedLog.temperatura < 37.5 && selectedLog.alkohol < 0.2
    //     };
        
    //     // Update the log in the database
    //     await fetch(`http://localhost:3000/api/logs/${selectedLog._id}`, {
    //       method: 'PUT',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(updatedLog),
    //     });

    //     await fetchLogs(); // Refresh the logs
    //   } else {
    //     // Update log status to Failed
    //     const updatedLog = {
    //       ...selectedLog,
    //       verificationStatus: 'Failed',
    //       verificationAttempts: (selectedLog.verificationAttempts || 0) + 1,
    //       dopuszczony: false
    //     };
        
    //     await fetch(`http://localhost:3000/api/logs/${selectedLog._id}`, {
    //       method: 'PUT',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(updatedLog),
    //     });

    //     await fetchLogs(); // Refresh the logs
    //   }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsRecognizing(false);
     }
  };

  const videoConstraints = {
    width: 320,
    height: 320,
    facingMode: "user"
  };

  
    return(
        <>
        <Button  
        className="w-[200px] mx-auto"
        onClick={()=>{
          setIsRecognizing(true)
          setIsSensorDataDisplayed(false)
        }}>Recognize</Button>

        <Dialog open={isRecognizing} onOpenChange={setIsRecognizing}>
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
                Take a photo
            </Button>
            </div>
        </DialogContent>
        </Dialog>

        {isSensorDataDisplayed && userName && alc && temp && (
          <SensorDisplay imie={userName} alkohol={alc} temperatura={temp} />
        )}
        

        </>


     
    )

}
