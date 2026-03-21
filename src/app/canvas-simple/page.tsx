'use client';

export default function SimpleCanvasPage() {
  return (
    <div style={{ padding: '100px', background: '#FAF8F2' }}>
      <h1 style={{ marginBottom: '20px' }}>Ultra Simple Canvas Test</h1>

      <canvas
        id="test-canvas"
        width="800"
        height="600"
        style={{ border: '2px solid purple', display: 'block' }}
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Fill background
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, 800, 600);

              // Draw red square
              ctx.fillStyle = 'red';
              ctx.fillRect(100, 100, 200, 200);

              // Draw blue circle
              ctx.fillStyle = 'blue';
              ctx.beginPath();
              ctx.arc(500, 300, 100, 0, Math.PI * 2);
              ctx.fill();

              // Draw text
              ctx.fillStyle = 'black';
              ctx.font = '48px sans-serif';
              ctx.fillText('IT WORKS!', 250, 500);

              console.log('Canvas rendered successfully');
            } else {
              console.error('Failed to get 2D context');
              alert('Failed to get 2D context!');
            }
          } else {
            console.error('Canvas element not found');
            alert('Canvas element not found!');
          }
        }}
      />

      <p style={{ marginTop: '20px', fontSize: '14px' }}>
        If you see a red square, blue circle, and "IT WORKS!" text above, canvas is working.
      </p>
      <p style={{ fontSize: '12px', opacity: 0.6 }}>
        Check browser console (F12) for debug messages.
      </p>
    </div>
  );
}
