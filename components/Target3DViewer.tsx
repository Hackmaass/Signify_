import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Box, EyeOff } from 'lucide-react';

// --- Worker Code as String ---
// We use a Blob worker to avoid needing a separate file build step.
// This isolates the MediaPipe WASM module from the main thread, fixing the "Module.arguments" crash.
const WORKER_CODE = `
  self.importScripts('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js');
  
  let hands = null;
  
  self.onmessage = async (e) => {
    const { type, payload } = e.data;
    
    if (type === 'init') {
      try {
        hands = new self.Hands({
          locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/\${file}\`
        });
        
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.3, // Lower confidence for drawings
          minTrackingConfidence: 0.3
        });
        
        hands.onResults((results) => {
          // Extract relevant data to send back (cloneable)
          const landmarks = results.multiHandWorldLandmarks?.[0] || results.multiHandLandmarks?.[0];
          self.postMessage({ type: 'result', landmarks });
        });
        
        self.postMessage({ type: 'ready' });
      } catch (err) {
        self.postMessage({ type: 'error', error: err.toString() });
      }
    } 
    else if (type === 'process') {
      if (!hands) return;
      try {
        await hands.send({ image: payload });
      } catch (err) {
        self.postMessage({ type: 'error', error: err.toString() });
      }
    }
  };
`;

interface Props {
  imageUrl: string;
}

const Target3DViewer: React.FC<Props> = ({ imageUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [landmarks, setLandmarks] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [noHandDetected, setNoHandDetected] = useState(false);

  // 1. Initialize Worker and Process Image
  useEffect(() => {
    setLoading(true);
    setError(false);
    setNoHandDetected(false);
    setLandmarks(null);

    // Create Worker from Blob
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    // Handle Worker Messages
    worker.onmessage = (e) => {
      const { type, landmarks, error } = e.data;
      
      if (type === 'ready') {
        // Worker is ready, load image
        processImage(worker);
      } else if (type === 'result') {
        if (landmarks && landmarks.length > 0) {
          setLandmarks(landmarks);
          setLoading(false);
        } else {
          setNoHandDetected(true);
          setLoading(false);
        }
      } else if (type === 'error') {
        console.warn("Worker Error:", error);
        setError(true);
        setLoading(false);
      }
    };

    // Start Worker Init
    worker.postMessage({ type: 'init' });

    return () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [imageUrl]);

  const processImage = (worker: Worker) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = async () => {
      try {
        // Convert to ImageBitmap to pass to worker
        const bitmap = await createImageBitmap(img);
        worker.postMessage({ type: 'process', payload: bitmap }, [bitmap]);
      } catch (err) {
        console.error("Bitmap creation failed", err);
        setError(true);
        setLoading(false);
      }
    };
    
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
  };

  // 2. Render the Rotating 3D Model
  useEffect(() => {
    if (!landmarks || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let angle = 0;

    const connections = [
        [0,1],[1,2],[2,3],[3,4], // Thumb
        [0,5],[5,6],[6,7],[7,8], // Index
        [0,9],[9,10],[10,11],[11,12], // Middle
        [0,13],[13,14],[14,15],[15,16], // Ring
        [0,17],[17,18],[18,19],[19,20], // Pinky
        [5,9],[9,13],[13,17] // Palm
    ];

    const render = () => {
        angle += 0.015;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const scale = 1000;

        const projected = landmarks.map((lm: any) => {
            const x = -lm.x;
            const y = -lm.y;
            const z = lm.z;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rx = x * cos - z * sin;
            const rz = x * sin + z * cos;
            return {
                x: rx * scale + cx,
                y: y * scale + cy + 50,
                z: rz
            };
        });

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw Bones
        connections.forEach(([i, j]) => {
            const p1 = projected[i];
            const p2 = projected[j];
            if(!p1 || !p2) return;
            
            const avgZ = (p1.z + p2.z) / 2;
            const alpha = Math.max(0.2, Math.min(1, 1 - avgZ * 5)); 
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 6;
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.3})`;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.stroke();
        });

        // Draw Joints
        projected.forEach((p: any) => {
             const size = Math.max(1, 4 - p.z * 10);
             ctx.beginPath();
             ctx.arc(p.x, p.y, size, 0, 2 * Math.PI);
             ctx.fillStyle = '#fff';
             ctx.fill();
        });

        animationFrame = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [landmarks]);

  if (error || noHandDetected) {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/50">
             {noHandDetected ? <EyeOff className="w-8 h-8 opacity-20" /> : <Box className="w-8 h-8 opacity-20" />}
             <span className="text-[10px] mt-2 opacity-50 font-medium">
                {noHandDetected ? 'No 3D Data Found' : '3D Unavailable'}
             </span>
             <p className="text-[9px] opacity-30 mt-1 max-w-[120px] text-center">
                {noHandDetected ? 'Try an image with better lighting or realism.' : 'Could not process image.'}
             </p>
          </div>
      );
  }

  return (
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900/30">
          {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 transition-opacity">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
             </div>
          )}
          <canvas ref={canvasRef} width={320} height={320} className="w-full h-full object-contain cursor-move" />
          
          <div className="absolute bottom-2 right-2 text-[10px] font-bold text-blue-500/50 uppercase tracking-widest pointer-events-none">
             Holographic View
          </div>
      </div>
  );
};

export default Target3DViewer;