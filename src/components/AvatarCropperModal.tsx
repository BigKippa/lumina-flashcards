import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface AvatarCropperModalProps {
    imageFile: File;
    onClose: () => void;
    onSave: (croppedDataUrl: string) => void;
}

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({ imageFile, onClose, onSave }) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const objectUrl = URL.createObjectURL(imageFile);
        setImageSrc(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const handlePointerDown = (clientX: number, clientY: number) => {
        setIsDragging(true);
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        setPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const handleSave = () => {
        if (!imageRef.current || !canvasRef.current || !containerRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // The crop area is essentially a 400x400 circle in the center of the container.
        const CROP_SIZE = 400; // High res save
        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        const img = imageRef.current;

        // Container sizing
        const containerRect = containerRef.current.getBoundingClientRect();

        // The visual diameter of the crop ring is 192px (48 tailwind units)
        const VISUAL_CROP_DIAMETER = 192;

        // The image scales dynamically using object-contain inside the UI, but we must map that exactly to natural pixels.
        // Wait, the image is rendered with max-h-full max-w-full. This means it's scaled down to fit the container natively.
        // We need to figure out its visual pixel size.
        
        // Wait, getBoundingClientRect won't give dimensions BEFORE css transforms. 
        // Best approach: standard math.
        const fitRatio = Math.min(containerRect.width / img.naturalWidth, containerRect.height / img.naturalHeight);
        const baseVisualWidth = img.naturalWidth * fitRatio;
        const baseVisualHeight = img.naturalHeight * fitRatio;
        
        const renderedWidth = baseVisualWidth * scale;
        const renderedHeight = baseVisualHeight * scale;

        // Calculate offset mapping
        // Ratio of the canvas output size to the visual screen diameter
        const renderToSaveRatio = CROP_SIZE / VISUAL_CROP_DIAMETER;

        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
        
        // Save state to make the circle clip
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip(); // Mask strictly to a circle
        
        // We know the center of the crop ring is at containerCenterX, containerCenterY.
        // The image center is at (containerCenterX + position.x), (containerCenterY + position.y).
        const offsetFromCropCenterX = position.x;
        const offsetFromCropCenterY = position.y;

        const scaledDrawWidth = renderedWidth * renderToSaveRatio;
        const scaledDrawHeight = renderedHeight * renderToSaveRatio;

        const drawX = (CROP_SIZE / 2) - (scaledDrawWidth / 2) + (offsetFromCropCenterX * renderToSaveRatio);
        const drawY = (CROP_SIZE / 2) - (scaledDrawHeight / 2) + (offsetFromCropCenterY * renderToSaveRatio);

        ctx.drawImage(
            img,
            drawX,
            drawY,
            scaledDrawWidth,
            scaledDrawHeight
        );

        onSave(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-color1 text-color5 w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-border relative">
                <div className="p-6 border-b border-color3 flex justify-between items-center bg-color3 relative z-30 shadow-sm">
                    <h3 className="font-extrabold text-xl text-color5">Crop Profile Picture</h3>
                    <button onClick={onClose} className="p-2 hover:bg-color3/80 bg-white border-2 border-color3 rounded-full absolute -top-4 -right-4 transition-all shadow-md">
                        <X className="w-5 h-5 text-color5" />
                    </button>
                </div>
                
                <div className="p-6 flex flex-col items-center gap-6">
                    {/* Cropper Work Area */}
                    <div 
                        ref={containerRef}
                        className="w-full h-72 bg-zinc-900 rounded-2xl relative overflow-hidden flex items-center justify-center touch-none select-none cursor-move shadow-inner border-4 border-color2"
                        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={handlePointerUp}
                        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
                        onTouchEnd={handlePointerUp}
                    >
                        {/* The Draggable Image */}
                        <img 
                            ref={imageRef}
                            src={imageSrc} 
                            alt="Crop target" 
                            className="max-h-full max-w-full absolute origin-center pointer-events-none transition-none"
                            style={{ 
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transitionDuration: isDragging ? '0ms' : '150ms'
                            }} 
                        />
                        
                        {/* Literal White Ring to show the exact crop boundary */}
                        <div className="absolute w-48 h-48 rounded-full border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.6)] pointer-events-none z-20 box-border"></div>
                    </div>

                    <div className="w-full space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-color5/70 uppercase">
                            <span>Adjust Size</span>
                            <span>{Math.round(scale * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="3" 
                            step="0.05" 
                            value={scale} 
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-full accent-color4"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-color2 flex gap-3 justify-end bg-color2 relative z-30 shadow-inner rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold hover:bg-color1 bg-white border-2 border-color3 transition-all text-color5 shadow-sm">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center justify-center gap-2 px-6 py-3 bg-color4 text-white rounded-xl hover:bg-color4/90 transition-all font-bold shadow-lg shadow-color4/40 border border-color4/80">
                        <Check className="w-5 h-5" /> Save Picture
                    </button>
                </div>
            </div>
            
            {/* Hidden canvas for extraction */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
