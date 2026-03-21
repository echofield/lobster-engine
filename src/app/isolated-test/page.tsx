'use client';

export default function IsolatedTestPage() {
  return (
    <div style={{
      padding: '50px',
      background: '#FAF8F2',
      fontFamily: 'sans-serif',
      minHeight: '100vh'
    }}>
      <h1 style={{ marginBottom: '30px', color: '#1a1a1a' }}>
        🎨 Isolated Canvas Test - No Global Components
      </h1>

      <div style={{ marginBottom: '30px' }}>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          This page is completely isolated - no Navigation, no other project interference.
        </p>
        <p style={{ fontSize: '14px', opacity: 0.6 }}>
          If you see shapes below, canvas works. If not, there's a browser/system issue.
        </p>
      </div>

      <canvas
        id="isolated-canvas"
        width="800"
        height="600"
        style={{
          border: '3px solid purple',
          display: 'block',
          marginBottom: '20px',
          background: 'white'
        }}
        ref={(canvas) => {
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            alert('❌ Failed to get canvas 2D context!');
            return;
          }

          // Clear background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 800, 600);

          // Draw colorful test pattern
          // Red square
          ctx.fillStyle = 'red';
          ctx.fillRect(50, 50, 150, 150);

          // Green square
          ctx.fillStyle = 'green';
          ctx.fillRect(250, 50, 150, 150);

          // Blue square
          ctx.fillStyle = 'blue';
          ctx.fillRect(450, 50, 150, 150);

          // Yellow circle
          ctx.fillStyle = 'yellow';
          ctx.strokeStyle = 'orange';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(150, 350, 80, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Purple circle
          ctx.fillStyle = 'purple';
          ctx.beginPath();
          ctx.arc(400, 350, 80, 0, Math.PI * 2);
          ctx.fill();

          // Pink circle
          ctx.fillStyle = 'hotpink';
          ctx.beginPath();
          ctx.arc(650, 350, 80, 0, Math.PI * 2);
          ctx.fill();

          // Big success text
          ctx.fillStyle = '#1a1a1a';
          ctx.font = 'bold 48px sans-serif';
          ctx.fillText('✅ CANVAS WORKS!', 180, 520);

          // Smaller info text
          ctx.font = '20px sans-serif';
          ctx.fillText('You should see: 3 squares + 3 circles + this text', 100, 560);

          console.log('✅ Canvas rendered successfully in isolated environment');
        }}
      />

      <div style={{
        padding: '20px',
        background: 'rgba(124, 92, 255, 0.1)',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Expected Result:</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ 3 colored squares (red, green, blue) at the top</li>
          <li>✅ 3 colored circles (yellow, purple, pink) in the middle</li>
          <li>✅ Black text saying "CANVAS WORKS!" at the bottom</li>
        </ul>
        <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
          Check browser console (F12) for debug messages.
        </p>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: '#f0f0f0',
        borderLeft: '4px solid purple'
      }}>
        <strong>What browser are you using?</strong>
        <p style={{ fontSize: '13px', marginTop: '5px', opacity: 0.7 }}>
          Chrome, Edge, Firefox, Safari? Check if hardware acceleration is enabled in browser settings.
        </p>
      </div>
    </div>
  );
}
