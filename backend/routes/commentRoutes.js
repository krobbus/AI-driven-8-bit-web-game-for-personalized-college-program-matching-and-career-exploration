import { Router } from "express";
import { smartGenerate } from "../services/geminiService.js";

const router = Router();

router.post("/api/comment", async (req, res) => {
  const { playerName, assessments = {}, tags = [] } = req.body;

  const hasData = (assessment) => {
    if (!assessment || !assessment.results) return false;
    const results = assessment.results;
    return Array.isArray(results) ? results.length > 0 : Object.keys(results).length > 0;
  };

  const courseCodes = ["CITCS", "CCJ", "CBA", "CAS", "CTE", "COM", "ISW", "IPPG"];
  const completeCourseData = [];
  const personalityLogs = [];

  courseCodes.forEach((code) => {
    const courseRelated = assessments[`${code}_CourseRelated`];
    const personality = assessments[`${code}_Personality`];
    const skill = assessments[`${code}_Skill`];

    if (hasData(courseRelated) && hasData(personality) && hasData(skill)) {
      const latestScoreObj = courseRelated.latestScore;
      const score = typeof latestScoreObj === "object"
        ? (latestScoreObj.correct || 0)
        : (latestScoreObj || 0);

      completeCourseData.push({
        course: code,
        score,
        attempts: courseRelated.totalTakes || 1
      });

      const getQuestions = (assessment) => {
        const results = assessment.results;
        const firstResult = Array.isArray(results) ? results[0] : Object.values(results)[0];
        return firstResult?.questions || [];
      };

      const pQuestions = getQuestions(personality);
      const sQuestions = getQuestions(skill);

      const log = [...pQuestions, ...sQuestions]
        .map(question => `[${code}] Statement: "${question.question}" -> User Response: "${question.userResponse || question.answer}"`)
        .join("\n");

      if (log) personalityLogs.push(log);
    }
  });

  const completedCodes = completeCourseData.map(course => course.code);
  const incompleteCourses = courseCodes.filter(code => !completedCodes.includes(code));

  if (completeCourseData.length === 0) {
    return res.json({
      aiText: "I don't have enough data yet! Please complete the Course-Related, Personality, and Skill assessments for at least one course to get your personalized career analysis."
    });
  }

  const skillTags = tags.filter(tag => tag.type === "skill").map(tag => tag.text);
  const personalityTags = tags.filter(tag => tag.type === "personality").map(tag => tag.text);

  const prompt = `
    You are an Expert Career & Educational Counselor AI.
    Your tasks/goals are:
    - Generate accurate, positive, and helpful comments for students based strictly on their performance data.
    - Recommend the best college course for a student by analyzing the "Intersection" between their Academic Performance (IQ) and their Personal Identity/Likert Responses (EQ).

    === STUDENT DATA ===
    Name: ${playerName}
    Declared Skills: ${skillTags.join(", ") || "None listed"}
    Personality Traits: ${personalityTags.join(", ") || "None listed"}

    === ACADEMIC & PSYCHOLOGICAL DATA ===
    Completed Courses: ${JSON.stringify(completeCourseData, null, 2)}
    Incomplete/Locked: ${incompleteCourses.join(", ")}

    === DETAILED LIKERT RESPONSES (The "Passion" Data) ===
    ${personalityLogs.join("\n\n")}

    === RULES ===
    1. For each COMPLETED course, perform a "Match Check":
      - INTEREST: Does their Personality assessment or Global Traits align with this field?
      - SKILL MATCH: Do their Global Skills or Skill assessment answers support their exam score?
    2. Only provide a detailed breakdown for courses in "Completed Course Profiles".
    3. Link their "Skill" and "Personality" score to their specific "Likert Responses".
      - e.g., "You scored high in CITCS, and your response 'I enjoy solving logic puzzles' confirms this is a natural fit.")
    4. Use the "Available/Unfinished Courses" to suggest what they should try next based on their tags.
      - Identify "Hidden Potential": If they have a Global Skill (e.g., "Graphic Design") but haven't taken the related course (e.g., CITCS), suggest it.
    5. If a student's Global Skill, Personality response, and Course Score all align, label it a "TRIFECTA MATCH" or "PERFECT MATCH."

    === STRICT OUTPUT FORMAT ===
    Ensure you use DOUBLE NEWLINES (\\n\\n) between every section and every course for readability.

    LIST OF FINISHED COURSE/S: (Display here all completed course codes)
    ${completeCourseData.map(course => `- ${course.code} [${course.score}/5.0 points]`).join("\\n")}
    (Single Newline (\\n\\n) Here)

    (Repeat the following blocks for EACH completed course)

    INTEREST MATCH: <Completed Course Code> [HIGH/MEDIUM/LOW]
    (Single Newline (\\n\\n) Here)
    <explain based on Personality tags and Likert answers>
    (Single Newline (\\n\\n) Here)

    SKILL ALIGNMENT: <Completed Course Code> [HIGH/MEDIUM/LOW]
    (Single Newline (\\n\\n) Here)
    <explain based on Global Skills and Skill assessment answers>
    (Single Newline (\\n\\n) Here)

    ANALYSIS:
    (Single Newline (\\n\\n) Here)
    <Briefly explain if their performance matches their identity.>
    (Single Newline (\\n\\n) Here)

    (End Repeat Section)

    TOP RECOMMENDATION: <${incompleteCourses.join(", ")}> (Choose ONE or MORE course from the list above that best fits from their Global Skills/Traits)
    (Single Newline (\\n\\n) Here)
    <Deep dive into the TRIFECTA: Score + Skills + Personality. Explain why it's top recommended.>

    Follow the exact formatting shown above, and keep comments professionally encouraging, friendly, and concise.
  `;

  try {
    const aiText = await smartGenerate(prompt);
    res.json({ aiText });
  } catch (err) {
    res.status(429).json({ error: "Comment unavailable due to high traffic." });
  }
});

export default router;
