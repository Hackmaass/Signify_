import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Results } from '../types';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

interface HandTrackingCanvasProps {
  onHandsDetected: (detected: boolean) => void;
  show3DView?: boolean;
}

export interface HandTrackingRef {
  getSnapshot: () => string | null;
}

const HandTrackingCanvas = forwardRef<HandTrackingRef, HandTrackingCanvasProps>(({ onHandsDetected, show3DView = true }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      if (videoRef.current) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth || 640;
        tempCanvas.height = videoRef.current.videoHeight || 360;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          // We want the snapshot to match what the user sees (mirrored) for intuitive consistency
          ctx.translate(tempCanvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
          return tempCanvas.toDataURL('image/jpeg', 0.85);
        }
      }
      return null;
    }
  }));

  const draw2DOverlay = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    const connections = window.HAND_CONNECTIONS;

    // Thicker, more visible lines
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // High contrast gradient for skeleton
    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
    gradient.addColorStop(0, '#00ff88'); // Bright Green
    gradient.addColorStop(1, '#00ccff'); // Bright Blue

    ctx.strokeStyle = gradient;
    ctx.fillStyle = '#FFFFFF';

    if (connections) {
      for (const connection of connections) {
        const start = landmarks[connection[0]];
        const end = landmarks[connection[1]];

        const x1 = start.x * ctx.canvas.width;
        const y1 = start.y * ctx.canvas.height;
        const x2 = end.x * ctx.canvas.width;
        const y2 = end.y * ctx.canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Larger joints with borders for visibility
    for (const landmark of landmarks) {
      const x = landmark.x * ctx.canvas.width;
      const y = landmark.y * ctx.canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();
    }
  };

  const draw3DVisualizer = (ctx: CanvasRenderingContext2D, results: Results) => {
    // 1. Clear & Background
    ctx.fillStyle = '#101010';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 2. Grid Lines (Crosshair)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ctx.canvas.width / 2, 0);
    ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
    ctx.moveTo(0, ctx.canvas.height / 2);
    ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
    ctx.stroke();

    const allLandmarks = results.multiHandLandmarks;
    if (!allLandmarks || allLandmarks.length === 0) return;

    // 3. Auto-Center Logic (Fit all hands)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Flatten to find global bounds of all hands
    allLandmarks.forEach(hand => {
      hand.forEach(lm => {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;
      });
    });

    // Avoid division by zero
    if (minX === Infinity) return;

    const width = maxX - minX || 0.1;
    const height = maxY - minY || 0.1;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Add generous padding so hands don't touch edges (40% padding)
    const padding = 0.4;
    const scale = Math.min(
      (ctx.canvas.width * (1 - padding)) / width,
      (ctx.canvas.height * (1 - padding)) / height
    );

    // 4. Draw All Hands
    const connections = window.HAND_CONNECTIONS;

    allLandmarks.forEach(landmarks => {
      // Draw Connections
      if (connections) {
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6'; // Blue-500
        ctx.lineWidth = 2;
        for (const connection of connections) {
          const start = landmarks[connection[0]];
          const end = landmarks[connection[1]];

          // Project: Center the cluster, scale it, then move to canvas center
          const x1 = (start.x - cx) * scale + ctx.canvas.width / 2;
          const y1 = (start.y - cy) * scale + ctx.canvas.height / 2;

          const x2 = (end.x - cx) * scale + ctx.canvas.width / 2;
          const y2 = (end.y - cy) * scale + ctx.canvas.height / 2;

          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }

      // Draw Joints
      ctx.fillStyle = '#ffffff';
      for (const landmark of landmarks) {
        const x = (landmark.x - cx) * scale + ctx.canvas.width / 2;
        const y = (landmark.y - cy) * scale + ctx.canvas.height / 2;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI); // Small white dots
        ctx.fill();
      }
    });

    // 5. Active Indicator
    ctx.fillStyle = '#22c55e'; // Green
    ctx.beginPath();
    ctx.arc(ctx.canvas.width - 12, 12, 4, 0, 2 * Math.PI);
    ctx.fill();
  };

  const onResults = (results: Results) => {
    // 1. Main Canvas Draw
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && videoRef.current) {
      // Ensure dimensions match video
      if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mirror view for natural interaction
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      ctx.drawImage(results.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        onHandsDetected(true);
        for (const landmarks of results.multiHandLandmarks) {
          draw2DOverlay(ctx, landmarks);
        }
      } else {
        onHandsDetected(false);
      }
      ctx.restore();
    }

    // 2. 3D Visualizer Draw
    if (show3DView && visualizerRef.current) {
      const vCtx = visualizerRef.current.getContext('2d');
      if (vCtx) {
        draw3DVisualizer(vCtx, results);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!videoRef.current) return;

      if (window.Hands) {
        const hands = new window.Hands({
          locateFile: (file: string) => {
            // Ensure this version matches the one in index.html exactly
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
          }
        });

        handsRef.current = hands;

        // Robustness Tuning:
        // - modelComplexity 1: Slower but more accurate (essential for education)
        // - minDetectionConfidence 0.7: Filters out noise/ghost hands (Increased for robustness)
        // - minTrackingConfidence 0.7: Ensures we don't lose tracking easily (Increased for stability)
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);

        if (window.Camera && videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && handsRef.current) {
                try {
                  await handsRef.current.send({ image: videoRef.current });
                } catch (e) {
                  console.warn("Frame processing error:", e);
                }
              }
            },
            width: 1280,
            height: 720,
            facingMode: 'user'
          });
          cameraRef.current = camera;

          try {
            await camera.start();
          } catch (err) {
            console.error("Camera start failed:", err);
          }
        }
      }
    };

    const timer = setTimeout(init, 500);

    return () => {
      clearTimeout(timer);
      if (cameraRef.current) {
        // Stop camera safely
        try {
          // @mediapipe/camera_utils sometimes doesn't expose clean stop, 
          // but we can try to pause the video element or stop tracks manually if needed.
          cameraRef.current.stop();
        } catch (e) { console.error(e) }
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full bg-black/80 rounded-3xl overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover hidden"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover rounded-3xl"
      />

      {/* 3D World View Overlay */}
      {show3DView && (
        <div className="absolute bottom-4 right-4 w-48 h-48 bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-20">
          <canvas ref={visualizerRef} width={192} height={192} className="w-full h-full" />
          <div className="absolute bottom-2 left-3 text-[10px] font-bold text-zinc-500 tracking-wider pointer-events-none">3D WORLD VIEW</div>
        </div>
      )}
    </div>
  );
});

export default HandTrackingCanvas;