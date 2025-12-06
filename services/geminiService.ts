import { GoogleGenAI, Type } from "@google/genai";
import { QuizData, ImageFile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizFromImages = async (
  images: ImageFile[], 
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<QuizData> => {
  
  const imageParts = images.map(img => ({
    inlineData: {
      data: img.data.split(',')[1], // Remove data URL prefix
      mimeType: img.mimeType
    }
  }));

  const prompt = `
    Analyze the provided images of book pages. 
    1. Identify the main topic and summarize the content briefly.
    2. Extract key concepts/terms.
    3. Generate a ${difficulty} difficulty quiz based ONLY on this content.
    4. Provide 5-8 multiple choice questions.
    5. For each question, provide a clear explanation referencing the content.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        ...imageParts,
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
