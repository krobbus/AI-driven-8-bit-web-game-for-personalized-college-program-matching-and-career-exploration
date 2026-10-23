import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { ModalProps } from '../types/props';
import { db } from '../config/firebase';
import { convertToPermanent, type PlayerData } from '../services/playerData';
import { ApprovedSkills, ApprovedPersonalities } from '../pages/data/preferenceLib.js';
import '../../styles/Modal.css';
import '../../styles/AccountManagement.css';

const AccountManagement: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<'character' | 'preference' | 'account'>('character');
    const [loading, setLoading] = useState(true);
    const [isExistingPlayer, setIsExistingPlayer] = useState(false);

    const [selectedTags, setSelectedTags] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [selectedCourses, setSelectedCourses] = useState<any[]>([]);

    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [name, setName] = useState('');
    const [isNameValid, setIsNameValid] = useState(false);
    const [gender, setGender] = useState<'male' | 'female'>('male');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPassValid, setIsPassValid] = useState(false);

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [isPinValid, setIsPinValid] = useState(false);
    const [formError, setFormError] = useState<{ field: string; message: string } | null>(null);

    const switchView = (target: 'character' | 'preference' | 'account') => {setView(target)};

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

    const isPermanent = useMemo(() => {
        return email.trim() !== "" || password.trim() !== "" || pin.trim() !== "";
    }, [email, password, pin]);

    const dbRef = useRef<ReturnType<typeof db.ref> | null>(null);

    const refreshData = (playerID: string) => {
        setLoading(true);

        if (dbRef.current) dbRef.current.off('value');
        const userRef = db.ref(`webGame/${playerID}`);
        dbRef.current = userRef;

        userRef.once('value').then((snapshot) => {
            const data = snapshot.val();
            
            if (data) {
                setIsExistingPlayer(true);

                const name = String(data.name || "");
                const email = String(data.email || "");
                const pass = String(data.pass || "");
                const pin = String(data.pin || "");

                setName(name);
                validateName(name);
                setSelectedTags(data.tags || []);
                setGender(data.gender?.toLowerCase() === "male" ? "male" : "female");
                setSelectedCourses(data.courses || []);
                setEmail(email);
                validateEmail(email);
                setPassword(pass);
                setConfirmPassword(pass);
                validatePass(pass);
                setPin(pin);
                setConfirmPin(pin);
                validatePin(pin);
            } else{
                setIsExistingPlayer(false);
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
            setIsExistingPlayer(false);
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

    const validateEmail = (val: string) => {
        const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(val ?? ""));
        setIsEmailValid(isValid);
        return isValid;
    };

    const validatePass = useCallback((val: string) => {
        const isValid = /^(?=.*[a-zA-Z])(?=.*[0-9]).{5,15}$/.test(String(val ?? ""));
        setIsPassValid(isValid);
        return isValid;
    }, []);

    const validatePin = useCallback((val: string) => {
        const isValid = /^\d{4}$/.test(String(val ?? ""));
        setIsPinValid(isValid);
        return isValid;
    }, []);

    const handleSave = async () => {
        setFormError(null);
        
        let playerID = localStorage.getItem("playerID");
        let invalidBaseFields: string[] = [];
        const hasSkill = selectedTags.some(t => t.type === 'skill');
        const hasPersonality = selectedTags.some(t => t.type === 'personality');

        if (!playerID) {
            const cleanName = name.replace(/\s+/g, '').toLowerCase() || "player";
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            playerID = `${cleanName}_${randomSuffix}`;
            localStorage.setItem("playerID", playerID);
        }
        if (!gender || (gender !== 'male' && gender !== 'female')) invalidBaseFields.push("a Gender selection");   // non-permanent restriction
        if (!validateName(name.trim())) invalidBaseFields.push("a valid Name (4-10 letters)");
        if (!hasSkill || !hasPersonality) {
            let tagReqs = [];
            if (!hasSkill) tagReqs.push("1 skill");
            if (!hasPersonality) tagReqs.push("1 personality");
            invalidBaseFields.push(`atleast ${tagReqs.join(" and ")}`);
        }
        if (selectedCourses.length === 0) invalidBaseFields.push("atleast 1 Course");
        if (invalidBaseFields.length > 0) {
            return setFormError({ 
                field: 'general', 
                message: `Profile and Preferences incomplete,\nplease provide:\n\n- ${invalidBaseFields.join("\n- ")}` 
            });
        }

        const userAttemptedAccount = isPermanent;                                             // permanent restriction
        if (userAttemptedAccount) {
            let invalidAccFields: string[] = [];
            
            if (!validateEmail(email.trim())) invalidAccFields.push("a valid Email");
            if (!validatePass(password.trim())) invalidAccFields.push("a valid Password (5-15 chars)");
            if (password !== confirmPassword) invalidAccFields.push("matching Passwords");
            if (!validatePin(pin.trim())) invalidAccFields.push("a 4-digit PIN");
            if (pin !== confirmPin) invalidAccFields.push("matching PINs");

            if (invalidAccFields.length > 0) {
                return setFormError({ 
                    field: 'general', 
                    message: 
                    `
                        You are creating a permanent account.
                        \nPlease provide:\n\n- ${invalidAccFields.join("\n- ")}
                        \n\nPROFILE and PREFERENCES are required for the game. 
                        \nIf you prefer not to create an account, simply leave all the account fields blank
                    ` 
                });
            }
        }

        try {
            if (!playerID) {
                const cleanName = name.replace(/\s+/g, '').toLowerCase() || "player";
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                playerID = `${cleanName}_${randomSuffix}`;
                localStorage.setItem("playerID", playerID);
            }

            const dbRef = db.ref("webGame");
            const snapshot = await dbRef.child(playerID || "").get();
            const existingData = snapshot.exists() ? snapshot.val() : {};

            const isSavingAsPermanent = userAttemptedAccount && email.trim() !== "";

            const updatedData: Partial<PlayerData> = {
                ...existingData,
                name: name.trim() || existingData.name || "Guest",
                gender: gender === 'male' ? 'Male' : 'Female',
                tags: selectedTags,
                courses: selectedCourses,
                email: email.trim() || existingData.email || "",
                pass: password.trim() || existingData.pass || "",
                pin: pin.trim() || existingData.pin || "",
                temporary: !isSavingAsPermanent,
                adminMode: false,
                playerMode: true,
                lastActive: Date.now(),
                savedAt: Date.now()
            };

            if (isSavingAsPermanent && typeof convertToPermanent === 'function') {
                await convertToPermanent(updatedData);
            }
            await dbRef.child(playerID).set(updatedData);
            localStorage.setItem("playerData", JSON.stringify(updatedData));
            
            alert(isSavingAsPermanent ? "Account Updated Successfully!" : "Guest Progress Saved!");
            onClose();
            window.location.reload();
        } catch (error) {
            alert("Failed to save character.");
        }
    };

    if (!isOpen) return null;

    return(
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>

                    <section className="accountManagementModal">
                        <h1 id="mainTitle">{isExistingPlayer ? "ACCOUNT MANAGEMENT" : "ACCOUNT REGISTRATION"}</h1>

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

                                    <button
                                        className={view === 'account' ? 'active' : ''}
                                        onClick={() => switchView('account')}
                                    >
                                        ACCOUNT CREATION
                                    </button>
                                </nav>

                                <div className="instructionContainer">
                                    <label className="mainHeader">INSTRUCTION</label>

                                    <p className="instructions">
                                        To begin, you must complete the <span className="highlight">Profile</span> 
                                        and <span className="highlight">Preferences</span> so we can tailor the assessment to your needs. Please note that during 
                                        this phase, you can explore the campus and try out all features freely without needing to register. However, please be aware 
                                        that while your progress is temporarily saved, it is not permanent. If you leave the site, you will not be able to access 
                                        your data or progress upon your return. 
                                    </p>

                                    <p className="instructions">
                                        To ensure your journey and assessment results are permanently saved and accessible for your next visit, you have the option 
                                        to create an <span className="highlight">Account</span>. This allows you to pick up exactly where you left off, even after 
                                        leaving the page. Explore at your own pace, and create an account only when you're ready to save your legacy!
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
                                        
                                        <div className={`page accountPage ${view === 'account' ? 'activePage' : ''}`}>
                                            { 
                                                <div className="accountContainer">
                                                    <label className="mainHeader">REGISTER ACCOUNT</label>

                                                    <div className="emailContainer">
                                                        <label className="subHeader">Enter your Email</label>                                                       
                                                        <input 
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => {
                                                                setEmail(e.target.value);
                                                                validateEmail(e.target.value);
                                                                setFormError(null);
                                                            }}
                                                            placeholder="Enter your Email..."
                                                        />
                                                        <p className="requirementHint" style={{ color: isEmailValid ? '#cdff77' : email.length > 0 ? '#ff9090' : '#454545' }}>
                                                            {isEmailValid ? "Email verified!" : "Please use a valid email (example@email.com)"}
                                                        </p>
                                                    </div>

                                                    <div className="passContainer">
                                                        <label className="subHeader">Enter your Password</label>                                                    
                                                        <div className="passWrapper">
                                                            <input 
                                                                type={showPassword ? "text" : "password"}
                                                                value={password}
                                                                onChange={(e) => {
                                                                    setPassword(e.target.value);
                                                                    validatePass(e.target.value);
                                                                }}
                                                                placeholder="Enter your Password..."
                                                            />
                                                            
                                                            <button 
                                                                className="togglePass" 
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                <img 
                                                                    src={`assets/WebAssets/Padlock${showPassword ? 'Opened' : 'Closed'}.png`}
                                                                    alt="Show/Hide Password"
                                                                />
                                                            </button>
                                                        </div>

                                                        <p className="requirementHint" style={{ color: isPassValid ? '#cdff77' : password.length > 0 ? '#ff9090' : '#454545' }}>
                                                            {isPassValid ? "Password verified!" : "Must be 5-15 alphanumeric characters [a-Z, 0-9]"}
                                                        </p>
                                                    </div>

                                                    <div className="confirmPassContainer">
                                                        <label className="subHeader">Confirm your Password</label>                                                    
                                                        <div className="passWrapper">
                                                            <input 
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                value={confirmPassword}
                                                                onChange={(e) => { setConfirmPassword(e.target.value); }}
                                                                placeholder="Re-enter your Password..."
                                                            />
                                                            <button 
                                                                className="toggleConfirmPass" 
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            >
                                                                <img 
                                                                    src={`assets/WebAssets/Padlock${showConfirmPassword ? 'Opened' : 'Closed'}.png`}
                                                                    alt="Show/Hide Password"
                                                                />
                                                            </button>
                                                        </div>

                                                        <p className="requirementHint" style={{ color: password !== confirmPassword ? '#ff9090' : confirmPassword.length > 0 ? '#cdff77' : '#454545' }}>
                                                            {password === confirmPassword && confirmPassword.length > 0 ? "Passwords match!" : "Passwords must match"}
                                                        </p>
                                                    </div>

                                                    <div className="pinLayout">         
                                                        <div className="pinContainer">
                                                            <label className="subHeader">Enter your PIN number</label>            
                                                            <div className="pinWrapper">
                                                                <input 
                                                                    type={showPin ? "text" : "password"}
                                                                    value={pin}
                                                                    onChange={(e) => {
                                                                        const filtered = e.target.value.replace(/\D/g, '');
                                                                        setPin(filtered);
                                                                        validatePin(filtered);
                                                                    }}
                                                                    placeholder="Enter your 4-digit PIN..."
                                                                    maxLength={4}
                                                                />
                                                                
                                                                <button 
                                                                    id="togglePin" 
                                                                    onClick={() => setShowPin(!showPin)}
                                                                >
                                                                    <img 
                                                                        src={`assets/WebAssets/Padlock${showPin ? 'Opened' : 'Closed'}.png`}
                                                                        alt="Show/Hide PIN"
                                                                    />
                                                                </button>
                                                            </div>

                                                            <p className="requirementHint" style={{ color: isPinValid ? '#cdff77' : pin.length > 0 ? '#ff9090' : '#454545' }}>
                                                                {isPinValid ? "PIN verified!" : "Requires exactly 4 digits"}
                                                            </p>
                                                        </div>

                                                        <div className="confirmPinContainer">
                                                            <label className="subHeader">Confirm your PIN number</label>
                                                            <div className="confirmPinWrapper">
                                                                <input 
                                                                    type={showConfirmPin ? "text" : "password"}
                                                                    value={confirmPin}
                                                                    onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); }}
                                                                    placeholder="Re-enter your 4-digit PIN..."
                                                                    maxLength={4}
                                                                />
                                                                <button 
                                                                    id="toggleConfirmPin" 
                                                                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                                                                >
                                                                    <img 
                                                                        src={`assets/WebAssets/Padlock${showConfirmPin ? 'Opened' : 'Closed'}.png`}
                                                                        alt="Show/Hide PIN"
                                                                    />
                                                                </button>
                                                            </div>

                                                            <p className="requirementHint" style={{ color: pin !== confirmPin ? '#ff9090' : confirmPin.length > 0 ? '#cdff77' : '#454545' }}>
                                                                {pin === confirmPin && confirmPin.length > 0 ? "PINs match!" : "PINs must match"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>  

                                {formError?.field === 'general' && ( <div className="errorContainer"><p className="combinedErrorText">{formError.message}</p></div> )}
                                <div className="btnWrapper">
                                    <button id="saveButton" onClick={handleSave}>
                                        {view === 'character' 
                                            ? (isExistingPlayer ? "UPDATE PROFILE" : "SAVE PROFILE")
                                            : view === 'preference'
                                                ? (isExistingPlayer ? "UPDATE PREFERENCES" : "SAVE PREFERENCES")
                                                : (isExistingPlayer ? "UPDATE ACCOUNT" : "CREATE ACCOUNT")
                                        }
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

export default AccountManagement;