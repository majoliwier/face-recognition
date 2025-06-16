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
import { Spinner } from "./Spinner";

export default function Recognition(){

    const webcamRef = useRef<Webcam>(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [isSensorDataDisplayed, setIsSensorDataDisplayed] = useState(false);
    const [userName, setUserName] = useState<string>();
    const [temp, setTemp] = useState<string>();
    const [alc, setAlc] = useState<string>();

    const [noMatch, setNoMatch] = useState(false);

    const handleVerify = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    setIsRecognizing(false);
    setNoMatch(false);

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

        setIsLoading(true);
        await fetch(`http://localhost:3000/api/logs/${result.user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

        await new Promise(resolve => setTimeout(resolve, 7000));

       
        const res = await fetch(`http://localhost:3000/api/logs/latest/${result.user.id}`);
        const log = await res.json();

        if (log && log.temperatura && log.alkohol) {
          setTemp(log.temperatura);
          setAlc(log.alkohol);
          setIsSensorDataDisplayed(true);

          if (!log.dopuszczony) {
              let reason = '';
              switch (log.rejectionReason) {
                case 'HighTemperature':
                  reason = 'Too high temperature';
                  break;
                case 'HighAlcohol':
                  reason = 'Too high alcohol';
                  break;
                case 'Both':
                  reason = 'Too high temperature and alcohol.';
                  break;
            
              }
              alert(reason); // lub ustaw w stanie i pokaż w UI
            }

          setIsLoading(false);
        }

      } else {
        
        setNoMatch(true);
      }
      
    } catch (error) {
      console.error('Verification error:', error);
      setIsLoading(false);

    } finally {
      setIsRecognizing(false);
      setIsLoading(false);
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
          setNoMatch(false);
        }}>Recognize</Button>

        <Dialog open={isRecognizing} onOpenChange={setIsRecognizing}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Recognize User</DialogTitle>
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

        {isLoading && 
        
          <Spinner />}

        {isSensorDataDisplayed && userName && alc && temp && (
          
            <SensorDisplay imie={userName} alkohol={alc} temperatura={temp} />
        )}

        {noMatch && 
        <div className="border rounded-xl p-4 bg-muted/50 shadow">
          <h2>No matching user.</h2>
        </div>
        }
        


        
        </>


     
    )

}
