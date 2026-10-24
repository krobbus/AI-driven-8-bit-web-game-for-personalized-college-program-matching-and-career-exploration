import React, { useState, useEffect, useMemo } from 'react';
import type { PlayerData, LeaderboardProps } from '../types/props';
import { db } from '../config/firebase';
import '../../styles/Modal.css';
import '../../styles/Leaderboard.css';

const courseNames: Record<string, string> = {
    ALL: "ALL COURSES",
    CITCS: "COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER STUDIES (CITCS)",
    CCJ: "COLLEGE OF CRIMINAL JUSTICE (CCJ)",
    CBA: "COLLEGE OF BUSINESS ADMINISTRATION (CBA)",
    CAS: "COLLEGE OF ARTS AND SCIENCES (CAS)",
    CTE: "COLLEGE OF TEACHER EDUCATION (CTE)",
    COM: "COLLEGE OF MEDICINE (COM)",
    ISW: "INSTITUTE OF SOCIAL WORK (ISW)",
    IPPG: "INSTITUTE OF PUBLIC POLICY AND GOVERNANCE (IPPG)"
};

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose , isOpen, courseCode = "ALL" }) => {
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>(courseCode || "ALL");

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        const webGameRef = db.ref('webGame');

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                const playerList: PlayerData[] = Object.keys(data)
                    .filter(key => data[key]?.adminMode !== true)
                    .map((key) => ({
                    id: key,
                    ...data[key],
                    playerId: data[key].playerID || key, 
                    name: data[key].name || "Anonymous",
                    score: data[key].score || 0,
                    gender: data[key].gender || "Male",
                    assessments: data[key].assessments || {},
                    course: Array.isArray(data[key].course) ? data[key].course : []
                    }));
                setPlayers(playerList);
            }
            setLoading(false);
        };

        webGameRef.on('value', handleData);
        return () => webGameRef.off('value', handleData);
    }, [isOpen]);

    const getAssessmentData = (player: PlayerData, course: string, type: 'Skill' | 'Personality') => {
        const assessments = player.assessments || {};
        
        if (course === 'ALL') {
            const matchingKeys = Object.keys(assessments).filter(key => key.endsWith(`_${type}`));
            if (matchingKeys.length === 0) return null;

            return matchingKeys.map(k => assessments[k]).reduce((latest, current) => {
                const latestDate = new Date(latest?.lastTakeAt || 0).getTime();
                const currentDate = new Date(current?.lastTakeAt || 0).getTime();
                return currentDate > latestDate ? current : latest;
            }, null);
        }

        const key = `${course.toUpperCase()}_${type}`;
        return assessments[key] || null;
    };

    const quizScore = (player: PlayerData, course: string) => {
        if (course === 'ALL') {
            const assessmentScores = Object.values(player.assessments || {}).map((a: any) => a?.latestScore?.correct || 0);
            return Math.max(player.score || 0, ...assessmentScores, 0);
        }
        const key = `${course.toUpperCase()}_CourseRelated`;
        const score = player.assessments?.[key]?.latestScore?.correct;
        return typeof score === 'number' ? score : 0;
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => { setSelectedCourse(courseCode || "ALL"); }, [courseCode]);

    useEffect(() => {
        if (window.game?.input?.keyboard){
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

    const processedPlayers = useMemo(() => {
        return players
            .filter(player => quizScore(player, selectedCourse) > 0)
            .sort((a, b) => quizScore(b, selectedCourse) - quizScore(a, selectedCourse));
    }, [players, selectedCourse]);

    const skillCompleters = useMemo(() => {
        return players
            .map(player => ({ player, data: getAssessmentData(player, selectedCourse, 'Skill') }))
            .filter(item => item.data && item.data.lastTakeAt)
            .sort((a, b) => new Date(b.data.lastTakeAt).getTime() - new Date(a.data.lastTakeAt).getTime());
    }, [players, selectedCourse]);

    const personalityCompleters = useMemo(() => {
        return players
            .map(player => ({ player, data: getAssessmentData(player, selectedCourse, 'Personality') }))
            .filter(item => item.data && item.data.lastTakeAt)
            .sort((a, b) => new Date(b.data.lastTakeAt).getTime() - new Date(a.data.lastTakeAt).getTime());
    }, [players, selectedCourse]);

    const topThree = [processedPlayers[0] || null, processedPlayers[1] || null, processedPlayers[2] || null];

    if (!isOpen) return null;

    return(
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>

                    <section className="leaderboardContainer">
                        <h1 id="mainTitle">LEADERBOARD</h1>

                        {loading ? (
                            <div className="loadingContainer">
                                <p className="loadingText">LOADING LEADERBOARD DATA...</p>
                            </div>
                        ) : (
                            <>
                                <div className="filterContainer">
                                    {Object.keys(courseNames).map((courseKey) => (
                                        <button 
                                            key={courseKey} 
                                            className={`filterBtn ${selectedCourse === courseKey ? 'active' : ''}`}
                                            onClick={() => setSelectedCourse(courseKey)}
                                            title={courseNames[courseKey]}
                                        >
                                            {courseKey}
                                        </button>
                                    ))}
                                </div>

                                <div className="leaderboardDataContainer">
                                    <label className="mainHeader">{courseNames[selectedCourse]} RANKING</label>

                                    <div className="podiumContainer">
                                        {[1, 0, 2].map((rankIndex) => (
                                            <div key={rankIndex} className={`podiumColumn rank${rankIndex === 0 ? 'One' : rankIndex === 1 ? 'Two' : 'Three'}`}>
                                                <div className="avatarContainer">
                                                    {topThree[rankIndex] && <img src={`assets/Character/Static${topThree[rankIndex].gender}.gif`} alt="Avatar" />}
                                                </div>

                                                <div className={`columnBlock color${rankIndex === 0 ? 'One' : rankIndex === 1 ? 'Two' : 'Three'}`}>
                                                    <div className="plateContainer">
                                                        <img src={`assets/WebAssets/Top${rankIndex === 0 ? 'One' : rankIndex === 1 ? 'Two' : 'Three'}.png`} alt="Avatar" />
                                                        <span className="playerName">{topThree[rankIndex]?.name.toUpperCase() || "NONE"}</span>
                                                        <span className="playerScore">{topThree[rankIndex] ? quizScore(topThree[rankIndex], selectedCourse) : 0}pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="listContainer">
                                        <label className="subHeader">COURSE-RELATED ASSESSMENT COMPLETERS</label>

                                        {processedPlayers.length > 0 ? 
                                            processedPlayers.map((player, index) => (
                                                <div key={player.id || index} className="listItem">
                                                    <span className="listRank">#{index + 1}</span>
                                                    <span className="listId">{player.playerId}</span>
                                                    <span className="listName">{player.name}</span>
                                                    <span className="listScore">{quizScore(player, selectedCourse)}pts</span>
                                                </div>
                                            )
                                        ) : <div className="emptyState">No players found with scores in this category</div>}
                                    </div>

                                    <div className="listContainer">
                                        <label className="subHeader">SKILL ASSESSMENT COMPLETERS</label>

                                        {skillCompleters.length > 0 ? 
                                            skillCompleters.map((item) => (
                                            <div key={item.player.id} className="listItem">
                                                <span className="listId">{item.player.playerId}</span>
                                                <span className="listName">{item.player.name}</span>
                                                <span className="listScore">{formatTimestamp(item.data.lastTakeAt)}</span>
                                            </div>
                                        )) : <p className="emptyState">No players found completed in this category</p>}
                                    </div>

                                    <div className="listContainer">
                                        <label className="subHeader">PERSONALITY ASSESSMENT COMPLETERS</label>

                                        {personalityCompleters.length > 0 ? 
                                            personalityCompleters.map((item) => (
                                            <div key={item.player.id} className="listItem">
                                                <span className="listId">{item.player.playerId}</span>
                                                <span className="listName">{item.player.name}</span>
                                                <span className="listScore">{formatTimestamp(item.data.lastTakeAt)}</span>
                                            </div>
                                        )) : <p className="emptyState">No players found completed in this category</p>}
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default Leaderboard;