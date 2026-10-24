import { Router } from "express";
import { smartGenerate } from "../services/geminiService.js";
import { normalizeExplanation } from "../utils/normalizeExplanation.js";
import { parseJsonArray } from "../utils/parseJsonArray.js";

const router = Router();

const courseDescriptions = {
  CITCS: "Computer Science & IT program focusing on coding, AI, and systems.",
  CCJ: "Criminal Justice studies focusing on law enforcement, forensics, and criminology.",
  CBA: "Business Administration with management and marketing foundations.",
  CAS: "Arts and Sciences track for critical thinking and creativity.",
  CTE: "Education-focused program for teaching and pedagogy training.",
  COM: "Medicine program centered on healthcare, anatomy, and medical research.",
  ISW: "Social Work institute dedicated to community service and social welfare practices.",
  IPPG: "Public Policy and Governance program focused on leadership and civic management."
};

router.post("/api/generate-course-related", async (req, res) => {
  const { courseName } = req.body;
  const numQuestions = 5;
  const numOptions = 4;
  const courseInfo = courseDescriptions[courseName] || "General academic program.";

  const prompt = `
  YOU MUST generate quiz questions in STRICT JSON ONLY.

  === COURSE INFORMATION ===
  Course Code: ${courseName}
  Course Meaning: "${courseInfo}"

  === STRICT OUTPUT RULES ===
  - Return a JSON array of EXACTLY ${numQuestions} question objects.
  - Each object MUST have EXACTLY these 4 keys: "question", "options", "answer", "explanation".
  - "options" MUST contain EXACTLY ${numOptions} unique, meaningful strings. NO MORE, NO LESS.
  - The correct answer MUST appear verbatim as one of the 3 options.
  - DO NOT add a 4th option under any circumstance. STOP at 3 options.
  - DO NOT use "None of the above" or "All of the above" as options.
  - Questions must cover fundamental concepts, definitions, and core principles.
  - Mix easy and medium difficulty. Avoid obscure trivia.
  - Every question MUST have an "explanation".

  === FIELD DEFINITIONS (follow exactly) ===
  "explanation" : 1–2 sentences explaining WHY the answer is correct. Plain text. No labels, no URLs inside this field.
  "source" : The website or publication title only (e.g. "Khan Academy", "Britannica", "CDC.gov"). Prefer .edu / .org / .gov. No URL here.
  "url" : A single valid full URL to the source (must start with https://). No extra text, just the URL.

  === JSON SCHEMA (repeat ${numQuestions} times) ===
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "answer": "...",
    "explanation": "...",
    "source": "...",
    "url": "https://..."
  }

  Output a raw JSON array ONLY. No markdown, no preamble, no trailing text.
  `;

  try {
    let questions = parseJsonArray(await smartGenerate(prompt));
    questions = questions
      .slice(0, numQuestions)
      .map(question => {
        question.options = (question.options || []).slice(0, numOptions);
        return normalizeExplanation(question);
      });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate quiz. Try again in 60s." });
  }
});

router.post("/api/generate-skill-pers", async (req, res) => {
  const { courseName, quizType } = req.body;
  const numQuestions = 5;
  const numOptions = 5;
  const courseInfo = courseDescriptions[courseName] || "General academic program.";

  const prompt = `
  YOU MUST generate test questions in STRICT JSON ONLY.

  === COURSE INFORMATION ===
  Course Code: ${courseName}
  Course Meaning: ${courseInfo}
  Assessment Type: ${quizType}

  === TASKS ===
  You are an educational guidance AI designed to evaluate whether a student’s personality traits and skills align with a specific college course.
  Generate ${numQuestions} first-person statements to evaluate if a student's ${quizType} matches this course.
  Your task is to generate two distinct sets of questions:
  - If type is PERSONALITY: focusing on interests, preferences, work habits, motivation, and attitudes.
  - If type is SKILL: focusing on abilities, problem-solving approaches, and task-related competencies.

  === STRICT OUTPUT RULES ===
  - NO academic/fact-based questions.. Instead, they should assess what the student likes or dislikes, how they think and behave, and how they approach tasks related to the course.
  - The purpose is to help the AI determine whether the student’s overall profile aligns with the selected course and to generate personalized feedback after the assessment.
  - Each question MUST have EXACTLY ${numOptions} options.
  - Organize each set under clear headings (Personality and Skills), with short thematic subcategories if needed.
  - Statements must be in the FIRST PERSON ("I am...", "I enjoy...", "I can...") and answered using a 5-point Likert scale: { Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree }.

  === JSON SCHEMA (repeat ${numQuestions} times) ===
  {
    "question": "...",
    "options": ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
    "category": "..."
  }

  Output a raw JSON array ONLY. No markdown, no preamble, no trailing text.
  `;

  try {
    const questions = parseJsonArray(await smartGenerate(prompt));
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate test questions. Try again in 60s." });
  }
});

export default router;
