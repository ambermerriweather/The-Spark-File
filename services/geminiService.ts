import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateText = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (generateText):", error);
        return null;
    }
};

export const generateImage = async (prompt: string, style: string = 'digital art', storyContext: string = ''): Promise<string | null> => {
    try {
        // Enhance the prompt with style and story context for better, more relevant results
        const enhancedPrompt = `For a creative story with the theme "${storyContext}", generate a high-quality image of the following scene: "${prompt}". The desired style is ${style}.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: enhancedPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("Imagen API Error (generateImage):", error);
        return null;
    }
};