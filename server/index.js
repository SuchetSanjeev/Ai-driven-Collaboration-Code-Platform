const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// This will store all active sessions and the clients within them
const sessions = {};

wss.on('connection', (ws) => {
  // When a client connects, we need them to tell us which session they're joining.
  // For now, we'll just log that they connected.
  console.log('Client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // When a client joins for the first time
    if (data.type === 'join') {
      const sessionId = data.sessionId;
      ws.sessionId = sessionId; // Attach sessionId to the WebSocket client object

      // If the session doesn't exist, create it
      if (!sessions[sessionId]) {
        sessions[sessionId] = new Set();
      }
      // Add the client to the session
      sessions[sessionId].add(ws);
      console.log(`Client joined session: ${sessionId}`);
    }

    // When a client sends a code update
    if (data.type === 'code_update') {
      const sessionId = ws.sessionId;
      if (sessions[sessionId]) {
        // Broadcast the message to all other clients in the same session
        sessions[sessionId].forEach(client => {
          // Send to everyone except the original sender
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: 'code_update', code: data.code }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove the client from their session when they disconnect
    const sessionId = ws.sessionId;
    if (sessions[sessionId]) {
      sessions[sessionId].delete(ws);
      if (sessions[sessionId].size === 0) {
        delete sessions[sessionId]; // Clean up empty sessions
        console.log(`Session ${sessionId} closed.`);
      }
    }
  });
});

const PORT = 3001; // We'll run our backend on a different port
server.listen(PORT, () => console.log(`WebSocket server started on port ${PORT}`));