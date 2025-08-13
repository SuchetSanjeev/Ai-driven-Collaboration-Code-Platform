const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const admin = require('firebase-admin');
const axios = require('axios');

// --- Firebase Admin Setup ---
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const activeClients = {};

// --- /execute endpoint ---
app.post('/execute', async (req, res) => {
  const { language, version, code } = req.body;

  if (!code || !language || !version) {
    return res.status(400).json({ error: 'Language, version, and code are required.' });
  }

  const pistonPayload = {
    language: language,
    version: version,
    files: [{ content: code }],
  };

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', pistonPayload);
    res.json(response.data);
  } catch (error) {
    console.error("Piston API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to execute code.', details: error.response ? error.response.data : null });
  }
});

// --- WebSocket Logic ---
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    // Destructure all possible properties from the message
    const { type, sessionId, code, selectedRuntimeIndex } = data;

    if (type === 'join') {
      ws.sessionId = sessionId;
      if (!activeClients[sessionId]) {
        activeClients[sessionId] = new Set();
      }
      activeClients[sessionId].add(ws);
      console.log(`Client joined session: ${sessionId}`);

      try {
        const docRef = db.collection('sessions').doc(sessionId);
        const doc = await docRef.get();
        if (doc.exists) {
          // Send the full session data (code and language) to the new client
          ws.send(JSON.stringify({ type: 'session_load', data: doc.data() }));
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      }
    }

    if (type === 'code_update') {
      const currentSessionId = ws.sessionId;
      if (activeClients[currentSessionId]) {
        // Broadcast to other clients
        activeClients[currentSessionId].forEach(client => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: 'code_update', code }));
          }
        });
        // Persist the code change to Firestore
        try {
          const docRef = db.collection('sessions').doc(currentSessionId);
          await docRef.set({ code }, { merge: true });
        } catch (error) {
          console.error(`[${currentSessionId}] FAILED to save code:`, error);
        }
      }
    }

    // --- NEW: Handle language changes ---
    if (type === 'language_change') {
        const currentSessionId = ws.sessionId;
        if (activeClients[currentSessionId]) {
            // Broadcast the language change to all clients
            activeClients[currentSessionId].forEach(client => {
                // Send to all, including the original sender, to confirm the change
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({ type: 'language_change', selectedRuntimeIndex }));
                }
            });
            // Persist the language change to Firestore
            try {
                const docRef = db.collection('sessions').doc(currentSessionId);
                await docRef.set({ selectedRuntimeIndex }, { merge: true });
            } catch (error) {
                console.error(`[${currentSessionId}] FAILED to save language:`, error);
            }
        }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const currentSessionId = ws.sessionId;
    if (activeClients[currentSessionId]) {
      activeClients[currentSessionId].delete(ws);
      if (activeClients[currentSessionId].size === 0) {
        delete activeClients[currentSessionId];
        console.log(`Session ${currentSessionId} has no active clients.`);
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server with HTTP and WebSocket started on port ${PORT}`));
