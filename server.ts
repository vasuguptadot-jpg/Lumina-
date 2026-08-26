import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleGeminiApi } from './server/aiHandler.ts';
import { handleDeveloperApi } from './server/devApiHandler.ts';
import { handleGroqApi } from './server/groqHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High payload limit for image base64 processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Developer & Enterprise API v1 Endpoints
app.all('/api/v1/*', async (req, res) => {
  try {
    const result = await handleDeveloperApi(req.path, req.method, req.headers, req.body);
    res.json(result);
  } catch (error: any) {
    console.error(`Dev API Error (${req.path}):`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Developer API Server Error',
    });
  }
});

// Server-side AI Endpoints (Gemini Native)
app.post('/api/ai/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const result = await handleGeminiApi(action, req.body);
    res.json(result);
  } catch (error: any) {
    console.error(`AI API Error (${req.params.action}):`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal AI Server Error',
    });
  }
});

// Server-side Groq BYOK & Proxy Endpoints
app.post('/api/groq/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const result = await handleGroqApi(action, req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    console.error(`Groq API Error (${req.params.action}):`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Groq Server Error',
    });
  }
});

// Serve static files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lumina Studio Pro Server running on port ${PORT}`);
});
