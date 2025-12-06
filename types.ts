export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  relatedConcept: string;
}

export interface QuizData {
  title: string;
  summary: string;
  identifiedConcepts: string[];
  questions: Question[];
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS'
}

export interface ImageFile {
  id: string;
  data: string; // Base64
  mimeType: string;
}
