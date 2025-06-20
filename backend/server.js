const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
require('dotenv').config();
require('./db/mongoConnect'); // Ensure MongoDB connection is established
const  {runAgenticFlow} = require('./shared/agentFlow');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let clients = [];

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Agentic AI backend running on port ${process.env.PORT || 5000}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  clients.push(ws);

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

function broadcast(msg) {
  clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  });
}

app.post('/api/run-task', async (req, res) => {
  const { command } = req.body;
  try {
    const result = await runAgenticFlow(command, broadcast);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error running Agentic Flow:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
