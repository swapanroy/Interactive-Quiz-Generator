import { GoogleGenAI, Type } from "@google/genai";
import { QuizData, MediaFile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizFromMedia = async (
  mediaFiles: MediaFile[], 
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<QuizData> => {
  
  const mediaParts = mediaFiles.map(file => ({
    inlineData: {
      data: file.data.split(',')[1], // Remove data URL prefix
      mimeType: file.mimeType
    }
  }));

  const prompt = `
    Analyze the provided content. Note: These images may be specific pages selected from a larger book or document.
    1. Identify the main topic covered in these specific pages.
    2. Extract key concepts/terms visible in the text or diagrams.
    3. Generate a ${difficulty} difficulty quiz based ONLY on this content.
    4. Provide 5-8 multiple choice questions.
    5. For each question, provide a clear explanation referencing the content.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        ...mediaParts,
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A short title for the quiz content" },
          summary: { type: Type.STRING, description: "A 2-3 sentence summary of the material" },
          identifiedConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of key concepts found in the text"
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                questionText: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Array of 4 possible answers"
                },
                correctOptionIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
                explanation: { type: Type.STRING, description: "Why the answer is correct, referencing the text" },
                relatedConcept: { type: Type.STRING, description: "Which concept this question tests" }
              },
              required: ["id", "questionText", "options", "correctOptionIndex", "explanation", "relatedConcept"]
            }
          }
        },
        required: ["title", "summary", "identifiedConcepts", "questions"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  const result = JSON.parse(response.text) as QuizData;
  return result;
};