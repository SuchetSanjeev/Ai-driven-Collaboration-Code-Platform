require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors'); // Import the cors package

// --- Firebase Admin Setup ---
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();

// --- UPDATED: Use the cors middleware to handle all CORS requests correctly ---
app.use(cors());
app.use(express.json());

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

// --- /explain-code endpoint ---
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

        const explanation = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (explanation) {
            res.json({ explanation });
        } else {
            throw new Error("Invalid response structure from Gemini API.");
        }

    } catch (error) {
        console.error("Gemini API Error (explain-code):", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get explanation from the AI model.' });
    }
});

// --- NEW: /fix-code endpoint ---
app.post('/fix-code', async (req, res) => {
    const { code, language } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured.' });
    }
    if (!code) {
        return res.status(400).json({ error: 'Code is required.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const prompt = `Analyze the following ${language} code snippet for bugs, logical errors, or anti-patterns. 
    If you find any issues, provide a brief explanation of the problem and the corrected code. 
    Respond ONLY with a valid JSON object containing two keys: "explanation" (a markdown string explaining the bug) and "fixedCode" (a string containing ONLY the corrected code snippet).
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\``;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const rawText = response.data.candidates[0].content.parts[0].text;
        
        // Clean the response to ensure it's valid JSON before parsing
        const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResponse = JSON.parse(jsonString);

        res.json(parsedResponse);

    } catch (error) {
        console.error("Gemini API Error (fix-code):", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get fix from AI.' });
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
