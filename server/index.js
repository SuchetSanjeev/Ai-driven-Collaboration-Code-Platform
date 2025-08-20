require('dotenv').config(); // Loads environment variables from .env file
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

// --- NEW: /explain-code endpoint ---
app.post('/explain-code', async (req, res) => {
    const { code, language } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on the server.' });
    }
    if (!code) {
        return res.status(400).json({ error: 'Code snippet is required.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const prompt = `Explain the following ${language} code snippet. Focus on its purpose, how it works, and any key concepts demonstrated. Format the output nicely using markdown:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        // Safely access the response text
        const explanation = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (explanation) {
            res.json({ explanation });
        } else {
            throw new Error("Invalid response structure from Gemini API.");
        }

    } catch (error) {
        console.error("Gemini API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get explanation from the AI model.' });
    }
});

// --- WebSocket Logic ---
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
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
          ws.send(JSON.stringify({ type: 'session_load', data: doc.data() }));
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      }
    }

    if (type === 'code_update') {
      const currentSessionId = ws.sessionId;
      if (activeClients[currentSessionId]) {
        activeClients[currentSessionId].forEach(client => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: 'code_update', code }));
          }
        });
        try {
          const docRef = db.collection('sessions').doc(currentSessionId);
          await docRef.set({ code }, { merge: true });
        } catch (error) {
          console.error(`[${currentSessionId}] FAILED to save code:`, error);
        }
      }
    }

    if (type === 'language_change') {
        const currentSessionId = ws.sessionId;
        if (activeClients[currentSessionId]) {
            activeClients[currentSessionId].forEach(client => {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({ type: 'language_change', selectedRuntimeIndex }));
                }
            });
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
