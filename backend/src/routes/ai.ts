
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set for Gemini API. AI features will not work.");
}
// Initialize only if API_KEY is available
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// FIX: Add explicit Request and Response types to the route handler.
router.post('/summarize', async (req: Request, res: Response) => {
    if (!ai) {
        return res.status(503).json({ message: 'AI Service is not configured.' });
    }
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: 'Text to summarize is required.' });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following notes concisely for a student management system. Focus on key actions, decisions, and outcomes mentioned. Here are the notes:\n\n---\n\n${text}`
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error("Gemini summarization error:", error);
        res.status(500).json({ message: 'Failed to generate summary from AI.' });
    }
});

// FIX: Add explicit Request and Response types to the route handler.
router.post('/analyze-document', async (req: Request, res: Response) => {
    if (!ai) {
        return res.status(503).json({ message: 'AI Service is not configured.' });
    }
    const { documentText } = req.body;
     if (!documentText) {
        return res.status(400).json({ message: 'Document text is required.' });
    }
    // As per frontend code, documentText is the document name. We'll use this for a placeholder prompt.
    // A real implementation would involve passing document content.
    const prompt = `Based on the document name "${documentText}", infer the document type and provide placeholder information in a valid JSON format with keys "Document Type", "Student Name", and "Key Courses" (as an array of strings).`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        const jsonText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonText);
        res.json({ analysis });

    } catch (error) {
        console.error("Gemini analysis error:", error);
        res.status(500).json({
            analysis: {
                "Document Type": "Analysis Failed",
                "Student Name": "Unknown",
                "Key Courses": ["Could not analyze document."],
            }
        });
    }
});

// FIX: Add explicit Request and Response types to the route handler.
router.post('/draft-email', async (req: Request, res: Response) => {
    if (!ai) {
        return res.status(503).json({ message: 'AI Service is not configured.' });
    }
    const { prompt, studentName } = req.body;
    if (!prompt || !studentName) {
        return res.status(400).json({ message: 'Prompt and student name are required.' });
    }

    const fullPrompt = `You are an assistant for Lyceum Academy. Draft a professional and friendly email to a student named ${studentName}. The purpose of the email is: "${prompt}". Keep the tone helpful and clear. Sign off from "The Lyceum Academy Team".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        res.json({ draft: response.text });
    } catch (error) {
        console.error("Gemini email draft error:", error);
        res.status(500).json({ message: 'Failed to draft email.' });
    }
});

export default router;
