export function normalizeExplanation(question) {
  if (question.source && question.url) {
    return {
      ...question,
      explanation: (question.explanation || "").trim(),
      source: question.source.trim(),
      url: question.url.trim()
    };
  }

  const raw = question.explanation || "";
  const sourceMatch = raw.match(/(?:source(?:\s+title)?|reference)\s*[:\-]\s*(.+)/i);
  const urlMatch = raw.match(/(?:url|link|website)\s*[:\-]\s*(https?:\/\/\S+)/i)
    || raw.match(/(https?:\/\/\S+)/i);
  const bodyEnd = raw.search(/(?:source(?:\s+title)?|reference|url|link|website)\s*[:\-]/i);
  const body = (bodyEnd > 0 ? raw.slice(0, bodyEnd) : raw).trim();

  return {
    ...question,
    explanation: body || "No explanation provided.",
    source: sourceMatch ? sourceMatch[1].trim() : "Unknown Source",
    url: urlMatch ? urlMatch[1].trim() : ""
  };
}
