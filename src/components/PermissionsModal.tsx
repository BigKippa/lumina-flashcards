import { useState } from 'react';
import { Camera, Mic, MapPin, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
interface PermissionsModalProps {
    onComplete: (permissionsData: {
        camera: boolean;
        mic: boolean;
        location: boolean;
        locationData?: { city: string; country: string; timeZone: string }
    }) => void;
}

export function PermissionsModal({ onComplete }: PermissionsModalProps) {
    const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [micStatus, setMicStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'loading'>('pending');
    const [locationData, setLocationData] = useState<{ city: string; country: string; timeZone: string }>();

    const checkAllComplete = () => {
        return (cameraStatus !== 'pending' && micStatus !== 'pending' && locationStatus !== 'pending' && locationStatus !== 'loading');
    };

    const handleRequestCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setCameraStatus('granted');
        } catch (err) {
            setCameraStatus('denied');
        }
    };

    const handleRequestMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setMicStatus('granted');
        } catch (err) {
            setMicStatus('denied');
        }
    };

    const handleRequestLocation = () => {
        setLocationStatus('loading');
        if (!navigator.geolocation) {
            setLocationStatus('denied');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocoding placeholder (mocked for this isolated component as the original had)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    setLocationData({
                        city: data.address.city || data.address.town || data.address.village || '',
                        country: data.address.country || '',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                    setLocationStatus('granted');
                } catch (e) {
                    setLocationStatus('denied');
                }
            },
            () => {
                setLocationStatus('denied');
            }
        );
    };

    const handleAcceptAll = async () => {
        await handleRequestCamera();
        await handleRequestMic();
        handleRequestLocation();
    };

    const handleComplete = () => {
        onComplete({
            camera: cameraStatus === 'granted',
            mic: micStatus === 'granted',
            location: locationStatus === 'granted',
            locationData
        });
    };

    const renderAction = (status: string, onAllow: () => void, onDeny: () => void) => {
        if (status === 'loading') {
            return <RefreshCcw className="w-5 h-5 text-primary animate-spin" />;
        }
        if (status === 'granted') {
            return <span className="text-sm font-bold text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Allowed</span>;
        }
        if (status === 'denied') {
            return <span className="text-sm font-bold text-destructive">Denied</span>;
        }
        return (
            <div className="flex gap-2">
                <button onClick={onDeny} className="text-xs font-bold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors">Deny</button>
                <button onClick={onAllow} className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Allow</button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 fade-in duration-300">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                    <AlertCircle className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black text-center mb-2">Enhance Your Experience</h2>
                <p className="text-center text-muted-foreground mb-8">
                    Lumina uses your device to provide interactive study sessions. Please configure your permissions below.
                </p>

                <div className="w-full space-y-4 mb-8">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Camera className="w-5 h-5" /></div>
                            <div>
                                <h3 className="font-bold text-sm">Camera</h3>
                                <p className="text-xs text-muted-foreground pointer-events-none">Used for visual feedback</p>
                            </div>
                        </div>
                        {renderAction(cameraStatus, handleRequestCamera, () => setCameraStatus('denied'))}
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Mic className="w-5 h-5" /></div>
                            <div>
                                <h3 className="font-bold text-sm">Microphone</h3>
                                <p className="text-xs text-muted-foreground pointer-events-none">Used for pronunciation</p>
                            </div>
                        </div>
                        {renderAction(micStatus, handleRequestMic, () => setMicStatus('denied'))}
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><MapPin className="w-5 h-5" /></div>
                            <div>
                                <h3 className="font-bold text-sm">Location</h3>
                                <p className="text-xs text-muted-foreground pointer-events-none">Auto-fill timezone and regional settings</p>
                            </div>
                        </div>
                        {renderAction(locationStatus, handleRequestLocation, () => setLocationStatus('denied'))}
                    </div>
                </div>

                <div className="w-full flex gap-2 sm:gap-3">
                    <button
                        onClick={() => {
                            setCameraStatus('denied');
                            setMicStatus('denied');
                            setLocationStatus('denied');
                            setTimeout(() => {
                                onComplete({ camera: false, mic: false, location: false });
                            }, 500);
                        }}
                        className="flex-1 py-3 px-2 rounded-xl border border-border font-bold text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                        Skip All
                    </button>
                    <button
                        onClick={handleAcceptAll}
                        className="flex-1 py-3 px-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/80 transition-colors"
                    >
                        Accept All
                    </button>
                    <button
                        onClick={handleComplete}
                        disabled={!checkAllComplete()}
                        className="flex-1 py-3 px-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
