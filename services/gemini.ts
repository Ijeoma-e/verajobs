import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const evaluateJobFit = async (jobDescription: string, userCV: string, preferences: string) => {
  const prompt = `
    You are an expert career coach and recruiter. 
    Evaluate the following job description against the user's CV and career preferences.
    
    Job Description:
    \${jobDescription}
    
    User CV:
    \${userCV}
    
    User Preferences:
    \${preferences}
    
    Provide a detailed evaluation in JSON format with the following keys:
    - score: (A, B, C, D, or F)
    - fit_summary: (Brief explanation)
    - green_flags: (List of positive matches)
    - red_flags: (List of potential issues or gaps)
    - compensation_estimate: (If possible based on description/preferences)
    - action_plan: (How to approach the application or interview)
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean up potential markdown formatting in JSON response
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    throw error;
  }
};

export const tailorCV = async (jobDescription: string, userCV: string) => {
  const prompt = `
    You are an ATS optimization expert. 
    Tailor the following CV to better match the job description provided.
    Maintain honesty but highlight relevant skills and use keywords from the job description.
    
    Job Description:
    \${jobDescription}
    
    Current CV:
    \${userCV}
    
    Output the tailored CV in a clean, structured JSON format that can be used to populate an HTML template.
    Include keys for personal_info, summary, experience (array), education (array), and skills (array).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini Tailoring Error:", error);
    throw error;
  }
};
