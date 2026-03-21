'use client';

import { useEffect, useRef } from 'react';

export default function TestCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);

    // Draw test patterns
    ctx.fillStyle = '#FAF8F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw colored rectangles
    ctx.fillStyle = 'red';
    ctx.fillRect(50, 50, 100, 100);
    console.log('Drew red square');

    ctx.fillStyle = 'blue';
    ctx.fillRect(200, 50, 100, 100);
    console.log('Drew blue square');

    ctx.fillStyle = 'green';
    ctx.fillRect(350, 50, 100, 100);
    console.log('Drew green square');

    // Draw a circle
    ctx.fillStyle = 'purple';
    ctx.beginPath();
    ctx.arc(400, 300, 50, 0, Math.PI * 2);
    ctx.fill();
    console.log('Drew purple circle');

    // Draw text
    ctx.fillStyle = 'black';
    ctx.font = '24px monospace';
    ctx.fillText('Canvas Test - If you see this, canvas works!', 50, 500);
    console.log('Drew text');

    // Animate a bouncing ball
    let x = 100;
    let y = 200;
    let vx = 3;
    let vy = 2;

    const animate = () => {
      // Clear
      ctx.fillStyle = 'rgba(250, 248, 242, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update
      x += vx;
      y += vy;

      if (x < 0 || x > canvas.width) vx *= -1;
      if (y < 0 || y > canvas.height) vy *= -1;

      // Draw ball
      ctx.fillStyle = 'rgba(124, 92, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(animate);
    };

    animate();
    console.log('Animation started');

  }, []);

  return (
    <div className="min-h-screen pt-14 flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Canvas Rendering Test</h1>
        <p className="text-sm opacity-60">You should see colored squares, a purple circle, text, and an animated ball</p>
        <canvas
          ref={canvasRef}
          className="border-2"
          style={{ borderColor: 'rgba(124, 92, 255, 0.3)' }}
        />
        <p className="text-xs opacity-40">Open console (F12) to see debug logs</p>
      </div>
    </div>
  );
}
