import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ModalProps } from '../types/props.js';
import { db } from '../config/firebase.js';
import { ApprovedSkills, ApprovedPersonalities } from '../pages/data/preferenceLib.js';
import '../../styles/Modal.css';
import '../../styles/Management.css';

const ProfilePreferencesCreation: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<'character' | 'preference'>('character');
    const [loading, setLoading] = useState(true);

    const [selectedTags, setSelectedTags] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [selectedCourses, setSelectedCourses] = useState<any[]>([]);

    const [name, setName] = useState('');
    const [isNameValid, setIsNameValid] = useState(false);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [formError, setFormError] = useState<{ field: string; message: string } | null>(null);

    const switchView = (target: 'character' | 'preference') => setView(target);

    const skills = selectedTags.filter(t => t.type === "skill");
    const personalities = selectedTags.filter(t => t.type === "personality");
    const maxLimit = 5;

    const allValidTags = useMemo(() => [                                                                                    // useMemo
        ...ApprovedSkills.map(s => ({ text: s.toLowerCase(), type: 'skill' })),
        ...ApprovedPersonalities.map(p => ({ text: p.toLowerCase(), type: 'personality' }))
    ].sort((a, b) => a.text.localeCompare(b.text)), []);

    const filteredTags = useMemo(() => {
        if (!searchTerm) return allValidTags;
        return allValidTags.filter(tag => tag.text.includes(searchTerm.toLowerCase()));
    }, [searchTerm, allValidTags]);

    const dbRef = useRef<ReturnType<typeof db.ref> | null>(null);

    const refreshData = (playerID: string) => {
        setLoading(true);

        if (dbRef.current) dbRef.current.off('value');
        const userRef = db.ref(`webGame/${playerID}`);
        dbRef.current = userRef;

        userRef.once('value').then((snapshot) => {
            const data = snapshot.val();
            
            if (data) {
                const name = String(data.name || "");

                setName(name);
                validateName(name);
                setSelectedTags(data.tags || []);
                setGender(data.gender?.toLowerCase() === "male" ? "male" : "female");
                setSelectedCourses(data.courses || []);
            }
        })
        .catch((error) => {
            console.error("Firebase Error:", error);
            alert("Data retrieval error: Could not connect to database.");
        })
        .finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        if (window.game?.input?.keyboard){ 
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners(); 
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);

        const existingPlayerID = localStorage.getItem("playerID");
        if (!existingPlayerID) {
            setLoading(false);
        } else {
            refreshData(existingPlayerID);
        }

        return () => {
            if (dbRef.current) {
                dbRef.current.off('value');
                dbRef.current = null;
            }
        };
    }, [isOpen]);

    useEffect(() => {
        if (formError) {
            setIsDropdownOpen(false);
            const timer = setTimeout(() => { setFormError(null)}, 4000);
            
            return () => clearTimeout(timer);
        }
    }, [formError]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
        };
        if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const handleAddTag = (tag: { text: string; type: string }) => {
        if (selectedTags.find(t => t.text === tag.text)) {
            setFormError({ field: 'tags', message: "Tag already added!" });
            return;
        }

        const count = selectedTags.filter(t => t.type === tag.type).length;
        if (count >= maxLimit) {
            setFormError({ field: 'tags', message: `Limit reached for ${tag.type}!` });
            return;
        }

        setSelectedTags([...selectedTags, { ...tag, status: "valid" }]);
        setSearchTerm('');
        setIsDropdownOpen(false);
        setFormError(null);
    };

    const handleRemoveTag = (index: number) => {setSelectedTags(prev => prev.filter((_, i) => i !== index))};

    const handleCourseChange = (courseValue: string) => {
        setSelectedCourses(prev => {
            if (prev.includes(courseValue)) {
                return prev.filter(c => c !== courseValue);
            } else {
                return [...prev, courseValue];
            }
        });
    };

    const validateName = (val: string) => {
        const isValid = /^[A-Za-z]{4,10}$/.test(String(val ?? ""));
        setIsNameValid(isValid);
        return isValid;
    };

    const handleSave = async () => {
        setFormError(null);

        const hasSkill = selectedTags.some(t => t.type === 'skill');
        const hasPersonality = selectedTags.some(t => t.type === 'personality');
        const invalidBaseFields: string[] = [];

        if (!gender || (gender !== 'male' && gender !== 'female')) invalidBaseFields.push("a Gender selection");
        if (!validateName(name.trim())) invalidBaseFields.push("a valid Name (4-10 letters)");
        if (!hasSkill || !hasPersonality) {
            const tagReqs = [];
            if (!hasSkill) tagReqs.push("1 skill");
            if (!hasPersonality) tagReqs.push("1 personality");
            invalidBaseFields.push(`at least ${tagReqs.join(" and ")}`);
        }
        if (selectedCourses.length === 0) invalidBaseFields.push("at least 1 course");
        if (invalidBaseFields.length > 0) {
            setFormError({
                field: 'general', 
                message: `Profile and Preferences incomplete,\nplease provide:\n\n- ${invalidBaseFields.join("\n- ")}` 
            });
            return;
        }

        try {
            let playerID = localStorage.getItem("playerID");
            if (!playerID) {
                const cleanName = name.replace(/\s+/g, '').toLowerCase() || "player";
                playerID = `${cleanName}_${Math.floor(1000 + Math.random() * 9000)}`;
                localStorage.setItem("playerID", playerID);
            }

            const dbRef = db.ref("webGame");
            const snapshot = await dbRef.child(playerID).get();
            const existingData = snapshot.exists() ? snapshot.val() : {};
            const updatedData = {
                ...existingData,
                name: name.trim(),
                gender: gender === 'male' ? 'Male' : 'Female',
                tags: selectedTags,
                courses: selectedCourses,
                temporary: existingData.temporary ?? true,
                adminMode: existingData.adminMode ?? false,
                playerMode: existingData.playerMode ?? true,
                lastActive: Date.now(),
                savedAt: Date.now()
            };

            await dbRef.child(playerID).set(updatedData);
            localStorage.setItem("playerData", JSON.stringify(updatedData));
            
            alert("Profile and preferences saved successfully!");
            onClose();
            window.location.reload();
        } catch (error) {
            console.error("Failed to save profile and preferences:", error);
            alert("Failed to save profile and preferences.");
        }
    };

    if (!isOpen) return null;

    return(
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>

                    <section className="accountManagementModal">
                        <h1 id="mainTitle">PROFILE CREATION</h1>

                        {loading ? (
                            <div className="loadingContainer">
                                <p className="loadingText">LOADING...</p>
                            </div>
                        ) : (
                            <>
                                <nav className="navContainer">
                                    <button
                                        className={view === 'character' ? 'active' : ''}
                                        onClick={() => switchView('character')}
                                    >
                                        CHARACTER CREATION
                                    </button>

                                    <button
                                        className={view === 'preference' ? 'active' : ''}
                                        onClick={() => switchView('preference')}
                                    >
                                        PREFERENCES DISCOVERY
                                    </button>
                                </nav>

                                <div className="instructionContainer">
                                    <label className="mainHeader required">INSTRUCTION</label>
                                    <p className="instructions">
                                        Complete <span className="highlight">CHARACTER CREATION</span> and <span className="highlight">PREFERENCES DISCOVERY</span> before entering the Hallway or starting assessments.
                                    </p>
                                </div>

                                <div className="sliderViewport">
                                    <div className={`sliderWrapper ${view}`}>
                                        <div className={`page characterPage ${view === 'character' ? 'activePage' : ''}`}>
                                            { 
                                                <div className='characterContainer'>
                                                    <label className="mainHeader">CREATE YOUR CHARACTER</label>
                                                    
                                                    <div className="genderContainer">
                                                        <div className='imgContainer'>
                                                            <img
                                                                src={`assets/Character/Static${gender.charAt(0).toUpperCase() + gender.slice(1)}.gif`}
                                                                alt='Preview'
                                                            />
                                                        </div>

                                                        <div className="genderToggle">
                                                            <label className="subHeader">Select Gender</label>
                                                            <button 
                                                                className={`select ${gender === 'male' ? 'active' : ''}`}
                                                                id="maleButton"
                                                                onClick={() => setGender('male')}
                                                            >
                                                                Male
                                                            </button>

                                                            <button 
                                                                className={`select ${gender === 'female' ? 'active' : ''}`}
                                                                id="femaleButton"
                                                                onClick={() => setGender('female')}
                                                            >
                                                                Female
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="nameContainer">
                                                        <label className="subHeader">What's your name?</label>
                                                        <input 
                                                            type="text"
                                                            value={name}
                                                            onChange={(e) => { 
                                                                const filtered = e.target.value.replace(/[^A-Za-z]/g, '');
                                                                setName(filtered); 
                                                                validateName(filtered);
                                                                setFormError(null); 
                                                            }}
                                                            placeholder="Enter your name..."
                                                            maxLength={10}
                                                        />
                                                        <p className="requirementHint" style={{ color: isNameValid ? '#cdff77' : name.length > 0 ? '#ff9090' : '#454545' }}>
                                                            {isNameValid ? "Nice name!" : "Use nicknames. Must be 4-10 letters for name"}
                                                        </p>
                                                    </div>
                                                </div>
                                            }
                                        </div>

                                        <div className={`page preferencePage ${view === 'preference' ? 'activePage' : ''}`}>
                                            {
                                                <div className="preferenceContainer">
                                                    <label className="mainHeader">SPECIFY YOUR PERSONAL PREFERENCES</label>

                                                    <div className="tagsInputContainer">
                                                        <div className="dropdownContainer" ref={dropdownRef}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Type to search skills & personalities..."
                                                                value={searchTerm}
                                                                onFocus={() => setIsDropdownOpen(true)}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                            />

                                                            {isDropdownOpen && (
                                                                <ul id="tagsDropdown">
                                                                    {filteredTags.map((tag, i) => (
                                                                        <li key={i} onMouseDown={() => handleAddTag(tag)}>{tag.text}</li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>

                                                        <button id="addButton" onClick={()=> {
                                                            const match = allValidTags.find(t => t.text === searchTerm.toLowerCase());
                                                            if (match) handleAddTag(match);
                                                        }}>+ Add Tag</button>
                                                    </div>
                                                    {formError?.field === 'tags' && <p className="errorText center">{formError.message}</p>}

                                                    <div className="savedTagsWrapper">
                                                        <div id="skillContainer">
                                                            <label className="subHeader">Skill Tags <span id="skillCounter">({skills.length}/{maxLimit})</span></label>
                                                            <ul>
                                                                {skills.length === 0 ? (
                                                                    <span>No skills added...</span>
                                                                ) : (
                                                                    skills.map((tag, i) => (
                                                                    <li key={i} className="skill">
                                                                        <span>{tag.text}</span>
                                                                        <button onClick={() => handleRemoveTag(selectedTags.indexOf(tag))}>X</button>
                                                                    </li>
                                                                    ))
                                                                )}
                                                            </ul>
                                                        </div>

                                                        <div id="personalityContainer">
                                                            <label className="subHeader">Personality Tags <span id="persCounter">({personalities.length}/{maxLimit})</span></label>
                                                            <ul>
                                                                {personalities.length === 0 ? (
                                                                    <span>No traits added...</span>
                                                                ) : (
                                                                    personalities.map((tag, i) => (
                                                                    <li key={i} className="personality">
                                                                        <span>{tag.text}</span>
                                                                        <button onClick={() => handleRemoveTag(selectedTags.indexOf(tag))}>X</button>
                                                                    </li>
                                                                    ))
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    
                                                    <label className="mainHeader">BASED ON PLMUN AVAILABLE COURSES, DO YOU HAVE SPECIFIC COURSE IN MIND?</label>
                                                    <div className="courseSelectionContainer">
                                                        <input 
                                                            type="checkbox" 
                                                            id="CITCS" 
                                                            name="course" 
                                                            checked={selectedCourses.includes("College of Information Technology and Computer Studies (CITCS)")}
                                                            onChange={() => handleCourseChange("College of Information Technology and Computer Studies (CITCS)")}
                                                        />
                                                            <label htmlFor="CITCS">
                                                                <strong>COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER STUDIES (CITCS)</strong>
                                                                <em>Computer Science and IT program focusing on software development, database management, and system architecture.</em>
                                                            </label>

                                                        <input 
                                                            type="checkbox" 
                                                            id="CCJ" 
                                                            name="course" 
                                                            value="College of Criminal Justice (CCJ)"
                                                            checked={selectedCourses.includes("College of Criminal Justice (CCJ)")}
                                                            onChange={() => handleCourseChange("College of Criminal Justice (CCJ)")}
                                                        />
                                                            <label htmlFor="CCJ">
                                                                <strong>COLLEGE OF CRIMINAL JUSTICE (CCJ)</strong>
                                                                <em>Criminal Justice studies focusing on law enforcement, forensics, and criminology.</em>
                                                            </label>

                                                        <input
                                                            type="checkbox"
                                                            id="CAS"
                                                            name="course"
                                                            checked={selectedCourses.includes("College of Arts and Sciences (CAS)")}
                                                            onChange={() => handleCourseChange("College of Arts and Sciences (CAS)")}
                                                        />
                                                            <label htmlFor="CAS">
                                                                <strong>COLLEGE OF ARTS AND SCIENCES (CAS)</strong>
                                                                <em>Arts and Sciences track for critical thinking and creativity.</em>
                                                            </label>

                                                        <input 
                                                            type="checkbox" 
                                                            id="CBA" 
                                                            name="course" 
                                                            checked={selectedCourses.includes("College of Business Administration (CBA)")}
                                                            onChange={() => handleCourseChange("College of Business Administration (CBA)")}
                                                        />
                                                            <label htmlFor="CBA">
                                                                <strong>COLLEGE OF BUSINESS ADMINISTRATION (CBA)</strong>
                                                                <em>Business Administration with management and marketing foundations.</em>
                                                            </label>

                                                        <input
                                                            type="checkbox"
                                                            id="CTE"
                                                            name="course"
                                                            checked={selectedCourses.includes("College of Teacher Education (CTE)")}
                                                            onChange={() => handleCourseChange("College of Teacher Education (CTE)")}
                                                        />
                                                            <label htmlFor="CTE">
                                                                <strong>COLLEGE OF TEACHER EDUCATION (CTE)</strong>
                                                                <em>Education-focused program for teaching and pedagogy training.</em>
                                                            </label>

                                                        <input
                                                            type="checkbox"
                                                            id="COM"
                                                            name="course"
                                                            checked={selectedCourses.includes("College of Medicine (COM)")}
                                                            onChange={() => handleCourseChange("College of Medicine (COM)")}
                                                        />
                                                            <label htmlFor="COM">
                                                                <strong>COLLEGE OF MEDICINE (COM)</strong>
                                                                <em>Medicine program centered on healthcare, anatomy, and medical research.</em>
                                                            </label>

                                                        <input
                                                            type="checkbox"
                                                            id="IPPG"
                                                            name="course"
                                                            checked={selectedCourses.includes("Institute of Social Work (ISW)")}
                                                            onChange={() => handleCourseChange("Institute of Social Work (ISW)")}
                                                        />
                                                            <label htmlFor="IPPG">
                                                                <strong>INSTITUTE OF SOCIAL WORK (ISW)</strong>
                                                                <em>Social Work institute dedicated to community service and social welfare practices.</em>
                                                            </label>

                                                        <input
                                                            type="checkbox"
                                                            id="ISW"
                                                            name="course"
                                                            checked={selectedCourses.includes("Institute of Public Policy and Governance (IPPG)")}
                                                            onChange={() => handleCourseChange("Institute of Public Policy and Governance (IPPG)")}
                                                        />
                                                            <label htmlFor="ISW">
                                                                <strong>INSTITUTE OF PUBLIC POLICY AND GOVERNANCE (IPPG)</strong>
                                                                <em>Public Policy and Governance program focused on leadership and civic management.</em>
                                                            </label>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {!loading && (
                            <>
                                {formError?.field === 'general' && (
                                    <div className="errorContainer"><p>{formError.message}</p></div>
                                )}
                                <div className="btnWrapper">
                                    <button id="saveButton" onClick={handleSave}>
                                        {view === 'character' ? "SAVE PROFILE" : "SAVE PREFERENCES"}
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePreferencesCreation;
                                        