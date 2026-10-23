import React, { useEffect, useState, useMemo, type SyntheticEvent, type CSSProperties } from 'react';
import type { ModalProps } from '../types/props';
import { db } from '../config/firebase';
import '../../styles/Modal.css';
import '../../styles/Dashboard.css';
import StatisticsLoad from './StatisticsLoad';

const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:10000' : 'https://eight-bit-backend.onrender.com';

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

const Dashboard: React.FC<ModalProps> = ({onClose , isOpen}) => {
    const [loading, setLoading] = useState(true);

    const loggedInPlayerID = localStorage.getItem("playerID");
    const [searchID, setSearchID] = useState("");
    const [activeViewID, setActiveViewID] = useState(loggedInPlayerID);
    const [isAdmin, setIsAdmin] = useState(false);

    const [userData, setUserData] = useState<any>(null);
    const [showPin, setShowPin] = useState(false);

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<any>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    useEffect(() => {
        if (!loggedInPlayerID) return;
        db.ref(`webGame/${loggedInPlayerID}/adminMode`).once('value', snapshot => {
            setIsAdmin(snapshot.val() === true);
        });
    }, [loggedInPlayerID]);

    useEffect(() => {
        if (!isOpen || !activeViewID) return;
        setUserData(null);
        setLoading(true);
        
        const userRef = db.ref(`webGame/${activeViewID}`);
        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            setUserData(data || null);
            setLoading(false);
        };

        userRef.on('value', handleData);
        return () => userRef.off('value', handleData);
    }, [isOpen, activeViewID]);

    const hasFullAccess = activeViewID === loggedInPlayerID || isAdmin;
    const isPrivateView = hasFullAccess;

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault();

        const trimmedID = searchID.trim();
        if (trimmedID) {
            setActiveViewID(trimmedID === loggedInPlayerID ? loggedInPlayerID : trimmedID);
        }
    };

    const resetToOwnProfile = () => {
        if (loggedInPlayerID) {
            setActiveViewID(loggedInPlayerID);
            setSearchID("");
        } else {
            alert("No logged-in Player ID found in storage.");
        }
    };

    useEffect(() => {
        if (window.game?.input?.keyboard){
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

    const stats = useMemo(() => {
        if (!userData) return { 
            assessments: {},
            hasOneCompleteCourse: false,
            selectedCourses: [],
            nonselectedCourses: [],
            skills: [], 
            personalities: []
        };

        const tags = userData.tags || [];
        const selectedCourses = userData.courses || [];
        const assessments = userData.assessments || {};

        const allCourseNames = Object.keys(courseNames);
        const notselectedCourses = allCourseNames.filter(code => {
            const isAlreadySelected = selectedCourses.some((fullString: string) => 
                fullString.toUpperCase().includes(code.toUpperCase())
            );

            return !isAlreadySelected;
        });

        const hasOneCompleteCourse = selectedCourses.some((courseCode: string) => {
            const match = courseCode.match(/\(([^)]+)\)/);
            const code = match ? match[1] : courseCode;

            const hasCourseRelated = assessments[`${code}_CourseRelated`] !== undefined;
            const hasSkill = assessments[`${code}_Skill`] !== undefined;
            const hasPers = assessments[`${code}_Personality`] !== undefined;

            return hasCourseRelated && hasSkill && hasPers;
        });

        return {
            assessments: assessments,
            hasOneCompleteCourse: hasOneCompleteCourse,
            selectedCourses: selectedCourses,
            nonselectedCourses: notselectedCourses,
            skills: tags.filter((t: any) => t.type === "skill" && t.status === "valid").slice(0, 5),
            personalities: tags.filter((t: any) => t.type === "personality" && t.status === "valid").slice(0, 5)
        };
    }, [userData]);

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

    const editData = (fieldName: string, currentValue: any) => {
        if (!isAdmin) {
            alert("Restricted: Only Admins can modify player data.");
            return;
        }
        setEditingField(fieldName);
        setEditValue(currentValue);
    };

    const saveEdit = async () => {
        if (!editingField || !activeViewID) return;

        try {
            let updateData = {};
            
            if (editingField === 'role') {
                updateData = {
                    adminMode: editValue === 'Admin',
                    playerMode: true 
                };
            } else {
                updateData = { [editingField]: editValue };
            }

            await db.ref(`webGame/${activeViewID}`).update(updateData);
            setEditingField(null);
            alert("Update successful!");
        } catch (error) {
            alert("Failed to update data.");
        }
    };

    const handleGenerateAI = async () => {
        if (isGeneratingAI) return;
        setIsGeneratingAI(true);

        try {
            const response = await fetch(`${apiBaseUrl}/api/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerEmail: userData.email,
                    playerName: userData.name,
                    assessments: stats.assessments,
                    coursesTaken: userData.courses,
                    scores: userData.scores,
                    tags: userData.tags,
                    quizResults: userData.quizResults
                })
            });

            const result = await response.json();
            const aiText = result.aiText?.trim() || "No response from AI.";
            await db.ref(`webGame/${activeViewID}/comment`).set(aiText);
        } catch (error) {
            alert("Failed to generate analysis.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Text copied to clipboard!");
        });
    };

    const handleLogout = () => {
        localStorage.removeItem("playerID");
        window.location.href = "./index.html";
    };

    const handleReset = async () => {
        if (window.confirm("Reset all progress?")) {
            await db.ref(`webGame/${loggedInPlayerID}`).update({
                quizResults: {},
                scores: {},
                assessments: {},
                comment: ""
            });
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("PERMANENTLY DELETE ACCOUNT? This cannot be undone.")) {
            try {
                await db.ref(`webGame/${loggedInPlayerID}`).remove();
                handleLogout();
            } catch (error) {
                alert("Error deleting account.");
            }
        }
    };

    const editableInputStyle: CSSProperties = { 
        fontSize: "2.1vmin", 
        fontFamily: '"Press Start 2P"', 
        color: "#fff", 
        textAlign: "right",
        background: "#333", 
        border: "1px solid #fff", 
        padding: "0.2vmin",
        width: "100%"
    };

    const readOnlyInputStyle: CSSProperties = { 
        fontSize: "2.1vmin", 
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
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>
                    
                    <section className="dashboardContainer">
                        <h1 id="mainTitle">DASHBOARD</h1>

                        <nav>
                            <ul>
                                <li id="home"><a href="#mainTitle" onClick={(e) => handleNavClick(e, 'mainTitle')}>HOME</a></li>
                                <li><a href="#profileContainer" onClick={(e) => handleNavClick(e, 'profileContainer')}>PROFILE</a></li>
                                <li>
                                    <a href="#statisticContainer" onClick={(e) => handleNavClick(e, 'statisticContainer')}>STATISTICS</a>
                                    <ul>
                                        <li><a href="#courseProgressContainer" onClick={(e) => handleNavClick(e, 'courseProgressContainer')}>COURSE PROGRESS AND SCORES</a></li>
                                        <li><a href="#skillsPersonalityContainer" onClick={(e) => handleNavClick(e, 'skillsPersonalityContainer')}>SKILLS AND PERSONALITY TRAITS</a></li>
                                        <li><a href="#commentContainer" onClick={(e) => handleNavClick(e, 'commentContainer')}>AI COMMENT AND SUGGESTIONS</a></li>
                                    </ul>
                                </li>
                                <li>
                                    <a href="#actionsContainer" onClick={(e) => handleNavClick(e, 'actionsContainer')}>ACTIONS</a>
                                </li>
                                <li id="logout"><a onClick={handleLogout}>LOGOUT</a></li>
                            </ul>
                        </nav>

                        <div className="searchSection">
                            <form onSubmit={handleSearch}>
                                <input 
                                    type="text" 
                                    placeholder="Search Player ID to view other dashboards..." 
                                    value={searchID}
                                    onChange={(e) => setSearchID(e.target.value)}
                                    className="searchInput"
                                />

                                <button type="submit" id="searchBtn">SEARCH</button>
                            </form>

                            {activeViewID !== loggedInPlayerID && (
                                <button onClick={resetToOwnProfile} id="backBtn">MY PROFILE</button>
                            )}
                        </div>

                        <main>
                            {loading ? (
                                <div className="loadingContainer">
                                    <p className="loadingText">LOADING PLAYER DATA...</p>
                                </div>
                            ) : !userData ? (
                                <div className="loadingContainer">
                                    <p className="loadingText">PLAYER NOT FOUND</p>
                                    <button onClick={resetToOwnProfile}>RETURN TO MY PROFILE</button>
                                </div>
                            ) : (
                                <>
                                    <div id="profileContainer" className={`profileContainer ${!isPrivateView ? 'visitorMode' : ''}`}>
                                        <label className="mainHeader">
                                            {activeViewID === loggedInPlayerID ? "MY PROFILE" : "VIEWING PROFILE"}
                                        </label>

                                        <div className="imgWrapper">
                                            <img src={userData?.gender === 'Female' ? "assets/Character/StaticFemale.gif" : "assets/Character/StaticMale.gif"} alt="Avatar" />
                                        </div>

                                        <div className="idContainer">
                                            <label className="subHeader">PLAYER ID:</label>
                                            <div className="idField">
                                                <input
                                                    style={editingField === 'playerID' ? editableInputStyle : readOnlyInputStyle}
                                                    value={editingField === 'playerID' ? editValue : (activeViewID || "No Player ID")} 
                                                    readOnly={editingField !== 'playerID'}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                />

                                                {(activeViewID || activeViewID === "N/A") && (
                                                    <img typeof="text/svg" onClick={() => copyToClipboard(activeViewID)} src={"assets/WebAssets/Copy.svg"}/>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isPrivateView && (
                                            <div className="emailContainer">
                                                <label className="subHeader">PLAYER EMAIL:</label>
                                                <div className="emailField">
                                                    <input
                                                        style={editingField === 'email' ? editableInputStyle : readOnlyInputStyle}
                                                        value={editingField === 'email' ? editValue : (userData?.email || "N/A")} 
                                                        readOnly={editingField !== 'email'}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                    />

                                                    {editingField === 'email' ? (
                                                        <>
                                                            <img typeof="text/svg"onClick={saveEdit} src={"assets/WebAssets/Save.svg"}/>
                                                            <img typeof="text/svg" onClick={() => setEditingField(null)} src={"assets/WebAssets/Cancel.svg"}/>
                                                        </>
                                                    ) : ((userData?.email || userData.email === "N/A") && (
                                                        <>
                                                            <img typeof="text/svg" onClick={() => copyToClipboard(userData.email)} src={"assets/WebAssets/Copy.svg"}/>
                                                            {isAdmin && (
                                                                <img typeof="text/svg" onClick={() => editData('email', userData.email)} src={"assets/WebAssets/Edit.svg"}/>
                                                            )}
                                                        </>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="roleContainer">
                                            <label className="subHeader">ROLE:</label>
                                            <div className="roleField">
                                                {editingField === 'role' ? (
                                                    <>
                                                        <label className="editableInput">
                                                            <input type="checkbox" checked={editValue === 'Admin'} onChange={(e) => setEditValue(e.target.checked ? 'Admin' : 'Player')}/>
                                                            Is Admin?
                                                        </label>

                                                        <img typeof="text/svg"onClick={saveEdit} src={"assets/WebAssets/Save.svg"}/>
                                                        <img typeof="text/svg" onClick={() => setEditingField(null)} src={"assets/WebAssets/Cancel.svg"}/>
                                                    </>
                                                ) : (
                                                    <>
                                                        <input
                                                            style={readOnlyInputStyle} value={userData?.adminMode && userData?.playerMode ? "Admin" 
                                                                : userData?.adminMode ? "Admin" 
                                                                : userData?.playerMode ? "Player" 
                                                                : "Guest"} 
                                                            readOnly
                                                        />

                                                        {(userData?.adminMode || userData?.playerMode) && isAdmin && (
                                                            <img typeof="text/svg" onClick={() => editData('role', userData?.adminMode ? 'Admin' : 'Player')} src={"assets/WebAssets/Edit.svg"}/>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="nameContainer">
                                            <label className="subHeader">PLAYER NAME:</label>
                                            <div className="nameField">
                                                <input
                                                    style={editingField === 'name' ? editableInputStyle : readOnlyInputStyle}
                                                    value={editingField === 'name' ? editValue : (userData?.name || "Guest")} 
                                                    readOnly={editingField !== 'name'}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                />
                                                
                                                {editingField === 'name' ? (
                                                    <>
                                                        <img typeof="text/svg"onClick={saveEdit} src={"assets/WebAssets/Save.svg"}/>
                                                        <img typeof="text/svg" onClick={() => setEditingField(null)} src={"assets/WebAssets/Cancel.svg"}/>
                                                    </>
                                                ) : ((userData?.name || userData.name === "Guest") && isAdmin && (
                                                    <img typeof="text/svg" onClick={() => editData('name', userData?.name)} src={"assets/WebAssets/Edit.svg"}/>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="genderContainer">
                                            <label className="subHeader">GENDER:</label>
                                            <div className="genderField">
                                                {editingField === 'gender' ? (
                                                    <>
                                                        <label className="editableInput">
                                                            <input type="checkbox" checked={editValue === 'Male'} onChange={(e) => setEditValue(e.target.checked ? 'Male' : 'Female')}/>
                                                            Is Male?
                                                        </label>

                                                        <img typeof="text/svg"onClick={saveEdit} src={"assets/WebAssets/Save.svg"}/>
                                                        <img typeof="text/svg" onClick={() => setEditingField(null)} src={"assets/WebAssets/Cancel.svg"}/>
                                                    </>
                                                ) : (
                                                    <>
                                                        <input
                                                            style={editingField === 'gender' ? editableInputStyle : readOnlyInputStyle}
                                                            value={editingField === 'gender' ? editValue : (userData?.gender || "N/A")} 
                                                            readOnly={editingField !== 'gender'}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                        />

                                                        {(userData?.gender || userData.gender === "N/A") && isAdmin && (
                                                            <img typeof="text/svg" onClick={() => editData('gender', userData?.gender)} src={"assets/WebAssets/Edit.svg"}/>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {isPrivateView && (
                                            <div className="pinContainer">
                                                <label className="subHeader">PIN:</label>
                                                <div className="pinField">
                                                    <input 
                                                        type={editingField === 'pin' ? "text" : ((!userData?.pin || userData.pin === "No PIN") ? "text" : (showPin ? "text" : "password"))}
                                                        style={editingField === 'pin' ? editableInputStyle : readOnlyInputStyle}
                                                        value={editingField === 'pin' ? editValue : (userData?.pin || "No PIN")} 
                                                        readOnly={editingField !== 'pin'}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                    />

                                                    {editingField === 'pin' ? (
                                                        <>
                                                            <img typeof="text/svg"onClick={saveEdit} src={"assets/WebAssets/Save.svg"}/>
                                                            <img typeof="text/svg" onClick={() => setEditingField(null)} src={"assets/WebAssets/Cancel.svg"}/>
                                                        </>
                                                    ) : (
                                                        (userData?.pin || userData.pin === "No PIN") && (
                                                            <>
                                                                <img onClick={() => setShowPin(!showPin)} src={`assets/WebAssets/Padlock${showPin ? 'Opened' : 'Closed'}.png`}/>
                                                                {isAdmin && (
                                                                    <img typeof="text/svg" onClick={() => editData('pin', userData?.pin)} src={"assets/WebAssets/Edit.svg"}/>
                                                                )}
                                                            </>
                                                        )
                                                    )}     
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <StatisticsLoad 
                                        stats={stats}
                                        userData={userData}
                                        isGeneratingAI={isGeneratingAI}
                                        onGenerateAI={handleGenerateAI}
                                        isPrivateView={isPrivateView}
                                        isOwnerView={activeViewID === loggedInPlayerID}
                                        viewingPlayerID={activeViewID || ''}
                                    />

                                    {isPrivateView && (
                                        <div id="actionsContainer" className="actionsContainer">
                                            <label className="mainHeader">ACTIONS</label>

                                            <div className="buttonWrapper">
                                                <button id="resetButton" onClick={handleReset}>RESET PROGRESS</button>
                                                <button id="deleteButton" onClick={handleDeleteAccount}>DELETE ACCOUNT</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </main>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;