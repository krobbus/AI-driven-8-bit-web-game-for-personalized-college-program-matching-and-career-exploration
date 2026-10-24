import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function smartGenerate(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash"];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      const isRateLimit = error.status === 429 || error.message.includes("429");

      if (isRateLimit) {
        console.warn(`Rate limit on model ${modelName}. Trying next model...`);
        await sleep(1000);
        continue;
      }
      console.error(`Error with ${modelName}:`, error.message);
    }
  }

  throw new Error("QUOTA_EXHAUSTED: All models have reached their limits.");
}