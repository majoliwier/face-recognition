"use client"

import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Register() {
    const [name, setName] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const webcamRef = useRef<Webcam | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const videoConstraints = {
        width: 320,
        height: 320,
        facingMode: "user"
    };

    const handleCapture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImage(imageSrc);
            setIsCapturing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter a name');
            return;
        }

        if (!image) {
            toast.error('Please capture a photo');
            return;
        }

        try {
            // Convert base64 to blob
            const base64Data = image.split(',')[1];
            const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
            
            // Create form data
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('image', blob, 'photo.jpg');

            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                body: formData, // Send as FormData instead of JSON
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            toast.success('User registered successfully!');
            setName('');
            setImage(null);
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Failed to register user');
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>Register New User</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter user name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Photo</Label>
                            {isCapturing ? (
                                <div className="space-y-2">
                                    <div className="overflow-hidden rounded-lg">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={videoConstraints}
                                            className="w-full"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleCapture}
                                        className="w-full"
                                    >
                                        Capture Photo
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {image ? (
                                        <div className="space-y-2">
                                            <div className="overflow-hidden rounded-lg">
                                                <img
                                                    src={image}
                                                    alt="Captured"
                                                    className="w-full"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setImage(null);
                                                    setIsCapturing(true);
                                                }}
                                                className="w-full"
                                            >
                                                Retake Photo
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCapturing(true)}
                                            className="w-full"
                                        >
                                            Take Photo
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full">
                            Register User
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}