import React from 'react';
import '../../styles/CourseItem.css';
import type { CourseItemProps } from "../types/props";
import { db } from '../config/firebase';

const courseNames: Record<string, string> = {
    CITCS: "COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER STUDIES (CITCS)",
    CCJ: "COLLEGE OF CRIMINAL JUSTICE (CCJ)",
    CBA: "COLLEGE OF BUSINESS ADMINISTRATION (CBA)",
    CAS: "COLLEGE OF ARTS AND SCIENCES (CAS)",
    CTE: "COLLEGE OF TEACHER EDUCATION (CTE)",
    COM: "COLLEGE OF MEDICINE (COM)",
    ISW: "INSTITUTE OF SOCIAL WORK (ISW)",
    IPPG: "INSTITUTE OF PUBLIC POLICY AND GOVERNANCE (IPPG)"
};

const courseDescription: Record<string, string> = {
    CITCS: "Computer Science and IT program focusing on software development, database management, and system architecture.",
    CCJ: "Criminal Justice studies focusing on law enforcement, forensics, and criminology.",
    CBA: "Business Administration with management and marketing foundations.",
    CAS: "Arts and Sciences track for critical thinking and creativity.",
    CTE: "Education-focused program for teaching and pedagogy training.",
    COM: "Medicine program centered on healthcare, anatomy, and medical research.",
    ISW: "Social Work institute dedicated to community service and social welfare practices.",
    IPPG: "Public Policy and Governance program focused on leadership and civic management."
};

const CourseItem: React.FC<CourseItemProps> = ({ courseCode, assessments, isPrivateView = false, viewingPlayerID }) => {
    const assessment = assessments || {};

    const getCode = (str: string) => {
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : str;
    };
    const fixedCode = getCode(courseCode);

    const courseRelatedData = assessment[`${fixedCode}_CourseRelated`];
    const skillData = assessment[`${fixedCode}_Skill`];
    const personalityData = assessment[`${fixedCode}_Personality`];

    const hasQuiz = !!courseRelatedData?.lastTakeAt;
    const hasSkill = !!skillData?.lastTakeAt;
    const hasPers = !!personalityData?.lastTakeAt;

    const finishedCount = [hasQuiz, hasSkill, hasPers].filter(Boolean).length;
    const calculatedPercent = Math.round((finishedCount / 3) * 100);

    const quizScore = courseRelatedData?.latestScore?.correct || 0;

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };

    const handleViewHistory = async (type: string) => {
        const playerID = viewingPlayerID || localStorage.getItem("playerID");
        if (!playerID) return;

        try {
            const key = `${fixedCode}_${type}`;
            const snapshot = await db.ref(`webGame/${playerID}/assessments/${key}`).once('value');
            const data = snapshot.val();

            console.log('history data:', data);

            if (!data) return;

            const resultsMap = data.results || {};
            const latestIndex = Object.keys(resultsMap).length - 1;
            const latestTake = resultsMap[latestIndex];
            if (!latestTake) return;

            const questionsMap = latestTake.questions || {};
            const results = Object.values(questionsMap);

            console.log('dispatching results:', results);

            window.dispatchEvent(new CustomEvent('openResultModal', {
                detail: {
                    results,
                    rawType: type,
                    courseCode: fixedCode,
                    source: 'dashboard'
                }
            }));
        } catch (err) {
            console.error("Failed to load history:", err);
        }
    };

    return (
        <div className="courseStatCard">
            <div className="courseInfo">
                <label className="courseTitle">{courseNames[fixedCode || ""] || courseCode}</label>
                <label className="courseDescription">{courseDescription[fixedCode || ""] || "No description available"}</label>
            </div>

            <div className="courseContent">
                <div className="taskGrid">
                    <div className="taskItem">
                        <span className="assessmentTitle">Course-Related Assessment:</span>
                        <span className={hasQuiz ? "statusDone" : "statusPending"}>
                            {hasQuiz ? "Complete" : "Not Complete"}
                            {hasQuiz && (
                                <img typeof="text/svg" onClick={() => handleViewHistory('CourseRelated')} src={"assets/WebAssets/History.svg"}/>
                            )}
                        </span>
                    </div>

                    <div className="taskItem">
                        <span className="assessmentTitle">Personality Assessment:</span>
                        <span className={hasPers ? "statusDone" : "statusPending"}>
                            {hasPers ? "Complete" : "Not Complete"}
                            {hasPers && (
                                <img typeof="text/svg" onClick={() => handleViewHistory('Personality')} src={"assets/WebAssets/History.svg"}/>
                            )}
                        </span>
                    </div>

                    <div className="taskItem">
                        <span className="assessmentTitle">Skill Assessment:</span>
                        <span className={hasSkill ? "statusDone" : "statusPending"}>
                            {hasSkill ? "Complete" : "Not Complete"}
                            {hasSkill && (
                                <img typeof="text/svg" onClick={() => handleViewHistory('Skill')} src={"assets/WebAssets/History.svg"}/>
                            )}
                        </span>
                    </div>

                    <div className="taskItem">
                        <span className="assessmentTitle">Course-Related Score:</span>
                        <span className={hasQuiz ? "statusDone" : "statusPending"}>
                            {hasQuiz ? `${quizScore}/5 points` : "Pending"}
                        </span>
                    </div>

                </div>
            </div>
        
            <div className="courseStatus">
                <div className="courseProgressContainer">
                    <div className="progressBarContainer">
                        <div className="progressBar" style={{ width: `${calculatedPercent}%` }}></div>
                    </div>
                    <span className="progressPercentage">{calculatedPercent}%</span>
                </div>

                {isPrivateView && (
                    <div className="statusRow">
                        <strong>AI Analysis Status:</strong>
                        <span>{(calculatedPercent === 100) ? <a href="#commentContainer" onClick={(e) => handleNavClick(e, 'commentContainer')}>Ready for evaluation</a> : "Data Insufficient"}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseItem;