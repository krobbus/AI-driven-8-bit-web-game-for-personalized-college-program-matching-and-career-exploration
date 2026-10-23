export function parseJsonArray(text) {
  const cleanText = text.replace(/```json|```/g, "").trim();
  const jsonMatch = cleanText.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    throw new Error("No JSON array found in AI response");
  }

  return JSON.parse(jsonMatch[0]);
}
