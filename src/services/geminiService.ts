
import {GoogleGenAI} from "@google/genai";
import {Batch} from '../types';

// Initialize the Gemini API client according to guidelines
// API key is obtained exclusively from environment variables
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export const analyzeFermentation = async (batch: Batch): Promise<string> => {
  try {
    const prompt = `
      Act as a Chemical Engineering Consultant for a brewery. Analyze the following fermentation batch data:
      
      Recipe: ${batch.recipeName}
      Original Gravity (OG): ${batch.originalGravity}
      Current Gravity (SG): ${batch.currentGravity}
      Target Gravity (FG): ${batch.targetGravity}
      Temperature: ${batch.temperature}°C
      pH: ${batch.ph}
      Day of Fermentation: Approx ${(new Date().getTime() - new Date(batch.brewDate).getTime()) / (1000 * 3600 * 24)} days

      Please provide:
      1. Estimated Alcohol By Volume (ABV) currently.
      2. Attenuation percentage.
      3. A brief technical assessment of the fermentation health (temperature vs gravity).
      4. Any corrective actions if parameters seem off for this style.
      
      Keep the response concise and technical.
    `;

    // Using gemini-3-pro-preview for complex technical analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    // Directly access the .text property from GenerateContentResponse
    return response.text || "Analysis could not be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Analysis service.";
  }
};

export const suggestRecipeAdjustments = async (inventory: string): Promise<string> => {
    try {
        // Using gemini-3-flash-preview for creative summarization tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Given the following available inventory summary: ${inventory}. Suggest a creative seasonal brew recipe that optimizes stock usage.`,
        });
        // Directly access the .text property from GenerateContentResponse
        return response.text || "No suggestion generated.";
    } catch (e) {
        console.error("Gemini API Error:", e);
        return "Error generating suggestion.";
    }
}
