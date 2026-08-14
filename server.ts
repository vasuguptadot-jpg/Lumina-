import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleGeminiApi } from './server/aiHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High payload limit for image base64 processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side AI Endpoints
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

// Serve static files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lumina Studio Pro Server running on port ${PORT}`);
});
