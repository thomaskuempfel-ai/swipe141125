const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY environment variable not set');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/gemini/generate', async (req, res) => {
    try {
        const { model, config, contents } = req.body;
        
        const generativeModel = ai.getGenerativeModel({ 
            model: model || 'gemini-2.0-flash-exp',
            ...config
        });
        
        const result = await generativeModel.generateContent(contents);
        const response = await result.response;
        
        res.json({
            text: response.text(),
            functionCalls: response.functionCalls?.() || null,
            candidates: response.candidates || null
        });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate content',
            details: error.toString()
        });
    }
});

app.post('/api/gemini/generate-image', async (req, res) => {
    try {
        const { prompt, referenceImages } = req.body;
        
        const model = ai.getGenerativeModel({ model: 'imagen-3.0-generate-001' });
        
        const result = await model.generateImages({
            prompt,
            numberOfImages: 1,
            ...(referenceImages && { referenceImages })
        });
        
        res.json({
            images: result.images || []
        });
    } catch (error) {
        console.error('Image Generation Error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate image',
            details: error.toString()
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Dr. Paws Backend Proxy running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
