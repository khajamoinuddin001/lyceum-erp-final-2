import { apiFetch } from './api';
import type { DocumentAnalysisResult } from '../types';

// This file now proxies to our backend API endpoints.
// The backend will be responsible for securely calling the actual Gemini API.

export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await apiFetch<{ summary: string }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return response.summary;
  } catch (error) {
    console.error("Error calling backend for summary:", error);
    return `Error: Could not summarize notes.`;
  }
}

export async function analyzeDocument(documentText: string): Promise<DocumentAnalysisResult> {
  try {
    const response = await apiFetch<{ analysis: DocumentAnalysisResult }>('/ai/analyze-document', {
      method: 'POST',
      body: JSON.stringify({ documentText }),
    });
    return response.analysis;
  } catch (error) {
    console.error("Error calling backend for document analysis:", error);
    throw new Error("Failed to analyze document.");
  }
}

export async function draftEmail(prompt: string, studentName: string): Promise<string> {
  try {
    const response = await apiFetch<{ draft: string }>('/ai/draft-email', {
      method: 'POST',
      body: JSON.stringify({ prompt, studentName }),
    });
    return response.draft;
  } catch (error) {
    console.error("Error calling backend for email draft:", error);
    return `Error: Could not draft email. Please try again.`;
  }
}
