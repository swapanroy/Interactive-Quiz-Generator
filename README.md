# Quiz Me: Revolutionizing Active Recall with Gemini 2.5 & Real-time Voice Interaction

## 1. The Problem: The "Passive Learning" Trap
Students and lifelong learners face a common bottleneck: the time gap between *reading* material and *testing* their understanding.
*   **The Struggle:** Manually creating flashcards or quizzes from 500-page textbooks takes longer than studying the material itself.
*   **The Result:** Learners stick to passive reading, which is scientifically less effective than "Active Recall."

## 2. The Solution: Quiz Me
**Quiz Me** is a multimodal AI study companion that instantly transforms static content—textbook photos, diagrams, or massive PDFs—into interactive, gamified assessments. It features a "Quiz Master" Voice Mode that allows users to study hands-free using real-time conversational AI.

## 3. Key Technical Innovations

### A. Smart PDF Sampling (Client-Side Intelligence)
Processing a 1,000-page PDF would typically blow through token limits and cost a fortune.
*   **The Fix:** We implemented a **Client-Side Semantic Search** using `pdf.js`.
*   **How it works:** Instead of uploading the whole file, the browser locally scans the text, scores pages based on keyword density relative to the user's topic, and converts *only* the top 5 most relevant pages into images.
*   **Benefit:** Zero server load, minimal token usage, and high-precision context for the LLM.

### B. Multimodal Quiz Generation (Gemini 2.5 Flash)
We utilize `gemini-2.5-flash` for its speed and vision capabilities.
*   **Input:** The model ingests raw images of diagrams and text.
*   **Output:** Structured JSON containing questions, correct answers, detractors, and detailed explanations linking back to specific concepts in the text.

### C. The "Quiz Master" Voice Mode (Gemini Live API)
This is the flagship feature. Using the **Gemini Live API** via WebSockets:
*   **Real-time Interaction:** Users talk to the app naturally (e.g., *"Quiz me on the diagram on page 2"*).
*   **Bidirectional Audio:** The app captures microphone input (16kHz PCM), sends it to Gemini, and streams back raw audio.
*   **Visual Grounding:** We implemented **Function Calling (`displayQuestion`)**. When the AI asks a quiz question verbally, it triggers a UI event to display the text and options on screen simultaneously, ensuring clarity.

## 4. Architecture & Stack
*   **Frontend:** React 19 + TypeScript + Vite
*   **Styling:** Tailwind CSS (Glassmorphism design system)
*   **AI Model (Logic):** `gemini-2.5-flash`
*   **AI Model (Voice):** `gemini-2.5-flash-native-audio-preview`
*   **PDF Processing:** `pdfjs-dist` (Client-side rendering)
*   **Visualization:** Recharts for performance tracking

## 5. Challenges & Solutions

| Challenge | Solution |
| :--- | :--- |
| **PDF Token Limits** | Implemented a TF-IDF style heuristic search in the browser to slice PDFs before sending to API. |
| **Audio Latency** | Used raw PCM audio streaming with a custom `nextStartTime` buffer queue to ensure gapless, robotic-free playback. |
| **Voice Hallucinations** | Used System Instructions to enforce a "Quiz Master" persona and Function Calling to force the AI to sync verbal questions with visual UI elements. |

## 6. How to Run It

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/quiz-me.git
    cd quiz-me
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your Google Gemini API Key:
    ```env
    API_KEY=your_google_ai_studio_api_key_here
    ```
    *Note: Get your key from [Google AI Studio](https://aistudiogoogle.com).*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
 5. Direct link: https://aistudio.google.com/apps/drive/17RWZF58FuQFRecLXNYzyzWy9kMk5Z-VY?showAssistant=true&resourceKey=&showPreview=true

5.  **Usage:**
    *   Upload images or a PDF.
    *   For PDFs, enter a topic to extract relevant pages.
    *   Click "Start Quiz" for the visual mode.
    *   Or, click the **Microphone Icon** in the bottom right to talk to the Quiz Master!

## 7. Future Improvements
*   **Spaced Repetition:** Saving user progress to a database to resurface weak questions after 1, 3, and 7 days.
*   **Multi-Voice Support:** Allowing users to choose different AI personas (e.g., "Strict Professor" vs. "Study Buddy").
*   **Mobile App:** Wrapping the PWA into a native container for better background audio handling.
