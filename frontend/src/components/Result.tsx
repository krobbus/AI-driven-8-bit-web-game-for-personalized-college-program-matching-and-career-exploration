import React, { useEffect, type CSSProperties } from 'react';
import '../../styles/Result.css';
import '../../styles/Modal.css';
import type { ResultProps } from '../types/props';

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

const Result: React.FC<ResultProps> = ({ onClose, isOpen, results, rawType, courseCode, source }) => {
    const isAssessment = rawType === 'Skill' || rawType === 'Personality';
    const correctCount = results.filter(r => r.correct).length;
    
    const getCode = (str: string) => {
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : str;
    };
    const fixedCode = getCode(courseCode);

    useEffect(() => {
        if (window.game?.input?.keyboard){
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

    const copyToClipboard = (text: any) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("URL copied to clipboard!");
        });
    };

    const handleContinue = () => {
        onClose();
        if (source !== 'dashboard') {
            window.dispatchEvent(new CustomEvent('resultModalClosed'));
        }
    };

    const readOnlyInputStyle: CSSProperties = { 
        fontSize: "1.6vmin", 
        fontFamily: '"Press Start 2P"', 
        color: "#fff",
        textAlign: "right",
        background: "transparent", 
        padding: "0.2vmin",
        border: "none",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "100%"
    };

    if (!isOpen) return null;

    return(
        <div className="modalBackdrop resultBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>
                    
                    <section className="resultContainer">
                        <h1 id="mainTitle">{source === 'dashboard' ? 'ASSESSMENT HISTORY' : 'ASSESSMENT COMPLETE'}</h1>

                        <main>
                            <div className="courseInfo">
                                <label className="courseTitle">{courseNames[fixedCode || ""] || courseCode}</label>
                                <label className="courseDescription">{courseDescription[fixedCode || ""] || "No description available"}</label>
                            </div>

                            {!isAssessment && ( 
                                <label className="mainHeader">TOTAL SCORE: {correctCount} / {results.length}</label>
                            )}

                            {results.map((r, i) => (
                                <div key={i} className="resultEntry">
                                    <p className="resultQuestion">Q{i + 1}: {r.question}</p>

                                    {isAssessment ? (
                                        <div className="answerContainer">
                                            <p className="resultAnswer">Your Answer: {r.answer}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="answerContainer">
                                                <p className={r.correct ? 'resultCorrect' : 'resultWrong'}>Your Answer: {r.selected}</p>
                                                <p className="resultCorrect">Correct Answer: {r.answer}</p>
                                            </div>

                                            <div className="explanationContainer">
                                                {r.explanation && (<p className="resultExplanation">Explanation: {r.explanation}</p>)}
                                                {r.source && (<p className="resultSource">Source: {r.source}</p>)}
                                                {r.url && (
                                                    <div className="urlField">
                                                        <a id="urlLink" href={r.url} target="_blank" rel="noreferrer" style={{ flex: 1, overflow: 'hidden' }}>
                                                            <input className="resultUrl" style={readOnlyInputStyle} value={r.url} readOnly />
                                                        </a>
                                                        
                                                        <img typeof="text/svg" style={{ marginLeft: "10px" }} onClick={() => copyToClipboard(r.url)} src={"assets/WebAssets/Copy.svg"}/>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            <button id="proceedButton" onClick={source === 'dashboard' ? onClose : handleContinue}>
                                {source === 'dashboard' ? 'CLOSE' : 'PROCEED TO HALLWAY'}
                            </button>
                        </main>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default Result;