import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4
].filter(Boolean);

console.log(`System loaded ${apiKeys.length} API keys.`);

apiKeys.forEach((key, index) => {
  console.log(`Key ${index + 1}: ${key.substring(0, 5)}...`);
});

let currentKeyIndex = 0;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function smartGenerate(prompt) {
  let keyAttempts = 0;
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash"];

  while (keyAttempts < apiKeys.length) {
    const currentKey = apiKeys[currentKeyIndex];
    const genAI = new GoogleGenerativeAI(currentKey);

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        const isRateLimit = error.status === 429 || error.message.includes("429");

        if (isRateLimit) {
          console.warn(`Rate limit on Key ${currentKeyIndex + 1}, Model ${modelName}. Trying next model/key...`);
          await sleep(1000);
          continue;
        }
        console.error(`Error with ${modelName}:`, error.message);
      }
    }
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    keyAttempts++;
    console.log(`Rotating to Key ${currentKeyIndex + 1}...`);
  }

  throw new Error("QUOTA_EXHAUSTED: All keys and models have reached their limits.");
}