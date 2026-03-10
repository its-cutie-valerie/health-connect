const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory data store
let healthData = [];

// GET / - Show simple dashboard of received data
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Health Data Receiver</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; background: #f0f2f5; color: #1c1e21; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
          h1 { color: #1a73e8; margin-top: 0; }
          .entry { border-bottom: 1px solid #ebedf0; padding: 16px 0; }
          .entry:last-child { border: none; }
          .timestamp { font-size: 0.85em; color: #606770; margin-bottom: 8px; display: block; }
          pre { background: #f5f6f7; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 0.9em; border: 1px solid #dddfe2; }
          .empty-state { color: #8d949e; text-align: center; padding: 40px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Data Ingestion Dashboard</h1>
          <p>Status: Receiving encrypted health data packets.</p>
          <hr style="border: 0; border-top: 1px solid #ebedf0; margin: 24px 0;"/>
          ${healthData.length === 0 ? '<div class="empty-state">No synchronization events recorded.</div>' : ''}
          ${healthData.slice().reverse().map(entry => `
            <div class="entry">
              <span class="timestamp">${entry.receivedAt}</span>
              <pre>${JSON.stringify(entry.data, null, 2)}</pre>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `);
});

// GET /api/data - Raw JSON data
app.get('/api/data', (req, res) => {
  res.json(healthData);
});

// POST /api/health - Receive data from mobile
app.post('/api/health', (req, res) => {
  const data = req.body;
  const entry = {
    receivedAt: new Date().toISOString(),
    data: data
  };
  
  healthData.push(entry);
  
  // Keep only last 50 entries
  if (healthData.length > 50) healthData.shift();

  console.log(`[${new Date().toISOString()}] INFO: Received payload from ${data.platform || 'unknown'}`);
  res.status(200).json({ status: 'success', message: 'Payload acknowledged' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
  console.log(`Local access: http://localhost:${port}`);
  console.log(`API endpoint: http://<HOST_IP>:${port}/api/health`);
});
