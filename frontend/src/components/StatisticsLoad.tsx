import React, { useState } from 'react';
import '../../styles/StatisticsLoad.css';
import { jsPDF } from 'jspdf';
import type { StatisticsProps } from '../types/props';
import CourseItem from './CourseItem';

const StatisticsLoad: React.FC<StatisticsProps> = ({ stats, userData, isGeneratingAI, onGenerateAI, isPrivateView = false, isOwnerView, viewingPlayerID }) => {
    const [isSelectedOpen, setIsSelectedOpen] = useState(true);
    const [isNonselectedOpen, setIsNonselectedOpen] = useState(false);

    if (!stats) return null;
    const { assessments, hasOneCompleteCourse } = stats;
    const hasExistingComment = !!userData?.comment;

    const handleDownloadPDF = () => {
        if (!userData?.comment) return;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const centerX = pageWidth / 2;
        const currentYear = new Date().getFullYear();

        const headers = [
            "LIST OF FINISHED COURSE/S:",
            "INTEREST MATCH:",
            "SKILL ALIGNMENT:",
            "ANALYSIS:",
            "TOP RECOMMENDATION:"
        ];

        const drawPageDecorations = () => {
            const prevFontSize = doc.getFontSize();
            const prevTextColor = doc.getTextColor();

            doc.setLineWidth(1);
            doc.setDrawColor(52, 78, 65);
            doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
            doc.setLineWidth(2);
            doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(58, 90, 64);

            const copyrightText = `© ${currentYear} | An AI-Driven 8-bit Web Game For Personalized College Program Matching and Career Exploration | Pamantasan ng Lungsod ng Muntinlupa`;
            const wrappedFooter = doc.splitTextToSize(copyrightText, pageWidth - (margin * 2));
            const footerY = pageHeight - 15;

            doc.setDrawColor(58, 90, 64);
            doc.setLineWidth(0.5);
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
            doc.text(wrappedFooter, centerX, footerY, { align: 'center' });

            doc.setFontSize(prevFontSize);
            doc.setTextColor(prevTextColor);
        };

        drawPageDecorations();

        doc.setFontSize(22);
        doc.setFont("times", "bold");
        doc.setTextColor(52, 78, 65);
        doc.text("AI CAREER PATH ANALYSIS REPORT", centerX, 30, { align: 'center' });                       // title
    
        doc.setFontSize(12);
        doc.setFont("times", "italic");
        doc.text("Official Educational Assessment Result", centerX, 38, { align: 'center' });               // subtitle

        doc.setDrawColor(200, 200, 200);                                                                    // candidate info
        doc.line(margin, 45, pageWidth - margin, 45);

            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);

            doc.setFont("helvetica", "bold");
            doc.text("CANDIDATE EMAIL:", margin, 53);
            doc.setFont("helvetica", "normal");
            doc.text(userData.email || "N/A", margin + 58, 53);

            doc.setFont("helvetica", "bold");
            doc.text("CANDIDATE NAME:", margin, 59);
            doc.setFont("helvetica", "normal");
            doc.text(userData.name || "Guest", margin + 58, 59);

            doc.setFont("helvetica", "bold");
            doc.text("DATE OF ISSUE:", margin, 65);
            doc.setFont("helvetica", "normal");
            doc.text(new Date().toLocaleDateString(), margin + 58, 65);

        doc.setDrawColor(200, 200, 200);                                                                    // end of candidate info
        doc.line(margin, 70, pageWidth - margin, 70);

        doc.setFont("helvetica", "bold");                                                                   // header
        doc.setTextColor(58, 90, 64);
        doc.setFontSize(16);
        doc.text("PROFESSIONAL EVALUATION", centerX, 87, { align: 'center'});

        let currentY = 100;                                                                                 // main content - comment
        const maxLineWidth = pageWidth - (margin * 2);
        const rawLines = userData.comment.split('\n');

        const bottomThreshold = pageHeight - 35;                                                            // safe spacing for footer

        rawLines.forEach((line: string) => {
            let isHeader = false;
            let lineText = line.trim();
            
            if (!lineText) {
                currentY += 4;
                return;
            }

            headers.forEach(header => { 
                if (lineText.toUpperCase().includes(header)) { isHeader = true; }
            });

            if (isHeader) { 
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(58, 90, 64);
            } 
            else { 
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
            }

            const splitLines = doc.splitTextToSize(lineText, maxLineWidth);

            splitLines.forEach((singleLine: string) => {
                if (currentY > bottomThreshold) {
                    doc.addPage();
                    drawPageDecorations();
                    currentY = 25; 

                    if (isHeader) {
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(14);
                        doc.setTextColor(58, 90, 64);
                    } else {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(12);
                        doc.setTextColor(0, 0, 0);
                    }
                }
                doc.text(singleLine, margin, currentY);
                currentY += 6;                                                                             // line spacing
            });
            currentY += 2;                                                                                 // blocks/paragraph spacing
        });

        doc.save(`${userData.name || "Player"}_Career_Report.pdf`);
    };

    return (
        <div id="statisticContainer" className="statisticContainer">
            <label className="mainHeader">STATISTICS</label>

            <div className="selectedCourses">
                <div className="selectedCoursesHeader">
                    <label className="subHeader">SELECTED COURSES</label>

                    <img 
                        className={`drawerArrow ${isSelectedOpen ? 'open' : ''}`}
                        src={`assets/WebAssets/Drawer.png`}
                        onClick={() => setIsSelectedOpen(!isSelectedOpen)}
                    />
                </div>

                <div className={`drawerContent ${isSelectedOpen ? 'show' : 'hide'}`}>
                    {stats.selectedCourses.map(courseCode => (
                        <CourseItem 
                            key={courseCode}
                            courseCode={courseCode}
                            assessments={assessments}
                            isPrivateView={isPrivateView}
                            viewingPlayerID={viewingPlayerID ?? ''}
                        />
                    ))}
                </div>
            </div>
            
            <div className="nonselectedCourses">
                <div className="nonselectedCoursesHeader">
                    <label className="subHeader">OTHER AVAILABLE COURSES</label>
                    
                    <img 
                        className={`drawerArrow ${isNonselectedOpen ? 'open' : ''}`}
                        src={`assets/WebAssets/Drawer.png`}
                        onClick={() => setIsNonselectedOpen(!isNonselectedOpen)}
                    />
                </div>
                
                <div className={`drawerContent ${isNonselectedOpen ? 'show' : 'hide'}`}>
                    {stats.nonselectedCourses.map(courseCode => (
                        <CourseItem 
                            key={courseCode}
                            courseCode={courseCode}
                            assessments={assessments}
                            isPrivateView={isPrivateView}
                            viewingPlayerID={viewingPlayerID ?? ''}
                        />
                    ))}
                </div>
            </div>         

            <section id="skillsPersonalityContainer" className="skillsPersonalityContainer">
                <div className="tagsContainer">
                    <label className="subHeader">YOUR SKILLS</label>

                    <div className="skillList">
                        {stats.skills.length > 0 ? (
                            <ul>
                                {stats.skills.map((skill, index) => (
                                    <li key={index}>[{index + 1}] {skill.text}</li>
                                ))}
                            </ul>
                        ) : ( <p>No skills validated yet</p> )}
                    </div>
                </div>
          
                <div className="personalityContainer">
                    <label className="subHeader">YOUR PERSONALITY</label>

                    <div className="personalityList">
                        {stats.personalities.length > 0 ? (
                            <ul>
                                {stats.personalities.map((personalities, index) => (
                                    <li key={index}>[{index + 1}] {personalities.text}</li>
                                ))}
                            </ul>
                        ) : ( <p>No personalities validated yet</p> )}
                    </div>
                </div>
            </section>

            <section id="commentContainer" className="commentContainer">
                <label className="subHeader">AI COMMENT AND SUGGESTIONS</label>
                
                {isOwnerView && (
                    <div className="commentButtons">
                        <button
                            onClick={onGenerateAI} 
                            disabled={isGeneratingAI || !hasOneCompleteCourse}
                        >
                            {isGeneratingAI 
                                ? "ANALYZING..." : 
                                hasExistingComment ? "RE-GENERATE AI ANALYSIS" : "GENERATE AI ANALYSIS"
                            }
                        </button>

                        {hasExistingComment && (<button onClick={handleDownloadPDF}> DOWNLOAD AS PDF </button>)}
                    </div>
                )}

                <div className="aiCommentBox">
                    {userData?.comment || "Complete courses to unlock AI analysis..."}
                </div>
            </section>
        </div>
    );
};

export default StatisticsLoad;