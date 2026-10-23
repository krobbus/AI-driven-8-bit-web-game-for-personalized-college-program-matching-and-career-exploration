import React, { useEffect } from 'react';
import type { ModalProps } from '../types/props';
import '../../styles/Modal.css';
import '../../styles/Manual.css';

const Manual: React.FC<ModalProps> = ({ isOpen, onClose }) => { 
    useEffect(() => {
        if (window.game?.input?.keyboard){
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

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

    const handleScrollBack = () => {
        const element = document.getElementById('manualContainer');
        
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };

    if (!isOpen) return;  

    return(
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>

                    <section id="manualContainer" className="manualContainer">
                        <h1 id="mainTitle">PLAYER'S MANUAL</h1>

                        <nav>
                            <ul>
                                <li>
                                    <a href="#manualContainer" onClick={(e) => handleNavClick(e, 'manualContainer')}>HOME</a>
                                    <ul>
                                        <li><a href="#introductionContainer" onClick={(e) => handleNavClick(e, 'introductionContainer')}>INTRODUCTION</a></li>
                                        <li><a href="#requirementsContainer" onClick={(e) => handleNavClick(e, 'requirementsContainer')}>SYSTEM REQUIREMENTS</a></li>
                                    </ul>
                                </li>
                                <li>
                                    <a href="#featuresContainer" onClick={(e) => handleNavClick(e, 'featuresContainer')}>FEATURES</a>
                                    <ul>
                                        <li><a href="#loginProcedureContainer" onClick={(e) => handleNavClick(e, 'loginProcedureContainer')}>LOGIN PROCEDURE</a></li>
                                        <li><a href="#securityMeasureContainer" onClick={(e) => handleNavClick(e, 'securityMeasureContainer')}>SECURITY MEASURE</a></li>
                                        <li><a href="#guideForPlayersContainer" onClick={(e) => handleNavClick(e, 'guideForPlayersContainer')}>GUIDE FOR PLAYERS</a></li>
                                        <li><a href="#logoutProcedureContainer" onClick={(e) => handleNavClick(e, 'logoutProcedureContainer')}>LOGOUT PROCEDURE</a></li>
                                    </ul>
                                </li>
                                <li>
                                    <a href="#overviewContainer" onClick={(e) => handleNavClick(e, 'overviewContainer')}>OVERVIEW</a>
                                    <ul>
                                        <li>
                                            <a href="#scenesContainer" onClick={(e) => handleNavClick(e, 'scenesContainer')}>SCENES</a>
                                            <ul>
                                                <li><a href="#outdoorContainer" onClick={(e) => handleNavClick(e, 'outdoorContainer')}>OUTDOOR SCENE</a></li>
                                                <li><a href="#leftWingContainer" onClick={(e) => handleNavClick(e, 'leftWingContainer')}>LEFT WING SCENE</a></li>
                                                <li><a href="#hallwayContainer" onClick={(e) => handleNavClick(e, 'hallwayContainer')}>HALLWAY SCENE</a></li>
                                                <li><a href="#rightWingContainer" onClick={(e) => handleNavClick(e, 'rightWingContainer')}>RIGHT WING SCENE</a></li>
                                            </ul>
                                        </li>
                                        <li>
                                            <a href="#modalsContainer" onClick={(e) => handleNavClick(e, 'modalsContainer')}>MODALS</a>
                                            <ul>
                                                <li><a href="#passwordRecoveryContainer" onClick={(e) => handleNavClick(e, 'passwordRecoveryContainer')}>PASSWORD RECOVERY MODAL</a></li>
                                                <li><a href="#dashboardContainer" onClick={(e) => handleNavClick(e, 'dashboardContainer')}>DASHBOARD MODAL</a></li>
                                                <li><a href="#accountManagementContainer" onClick={(e) => handleNavClick(e, 'accountManagementContainer')}>ACCOUNT MANAGEMENT MODAL</a></li>
                                                <li><a href="#leaderboardContainer" onClick={(e) => handleNavClick(e, 'leaderboardContainer')}>LEADERBOARD MODAL</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </nav>

                        <main>
                            <>
                                <section id="introductionContainer">
                                    <label className="mainHeader">AN AI-DRIVEN 8-BIT WEB GAME FOR PERSONALIZED COLLEGE PROGRAM MATCHING AND CAREER EXPLORATION</label>
                                    
                                    <img src="assets/Background/PLMUN.png" alt="PLMUN background" />
                                    <p className="caption">
                                        This user manual is designed to guide players in understanding and navigating the AI-driven 8-bit web game 
                                        for personalized college program matching and career exploration. The game uses an interactive, retro-style 
                                        environment combined with artificial intelligence to help players explore suitable college programs and career 
                                        paths based on their interests, personality, skills, and in-game decisions.
                                        <br /><br />
                                        By following this user manual, players can easily navigate the system, understand game features, and maximize 
                                        their learning experience.
                                    </p>
                                </section>

                                <section id="requirementsContainer">
                                    <label className="mainHeader">WHAT DO I NEED TO PLAY THIS GAME?</label>

                                    <div className="cardContainer">
                                        <div className="cardWrapper">
                                            <span className="cardContent">A device with a web browser (Google Chrome, Mozilla Firefox, or Microsoft Edge)</span>
                                        </div>

                                        <div className="cardWrapper">
                                            <span className="cardContent">Stable internet connection</span>
                                        </div>

                                        <div className="cardWrapper">
                                            <span className="cardContent">Desktop, laptop, or mobile device</span>
                                        </div>
                                    </div>
                                </section>

                                <section id="featuresContainer">
                                    <label className="mainHeader">FEATURES</label>

                                    <section id="loginProcedureContainer">
                                        <label className="subHeader">LOGIN PROCEDURE</label>

                                        <img src="assets/Manual/LoginPage.png" alt="Login page" />

                                        <p className="caption">
                                            The login gateway serves as your entry point into the 8-bit world. Allow players to enter 
                                            the game using different options. Whether you are exploring as a guest or resuming your journey, 
                                            our system provides a flexible and secure way to manage your career discovery progress
                                        </p>

                                        <div className="cardContainer">
                                            <div className="cardWrapper">
                                                <img src="assets/Manual/GuestLogin.png" alt="Guest login" />

                                                <span className="mainContent">PLAY AS A GUEST</span>
                                                <p className="subContent">
                                                    Jump straight into the action. Ideal for a quick look at the 8-bit settings, 
                                                    though progress is stored locally and it will be lost if you leave the game.
                                                    <br /><br />
                                                    Click “Play as a Guest” to immediately enter the game. 
                                                    Guest players can explore the game but may have limited access to saving progress
                                                </p>
                                            </div>

                                            <div className="cardWrapper">
                                                <img src="assets/Manual/AccountLogin.png" alt="Account login" />

                                                <span className="mainContent">LOGIN WITH EXISTING ACCOUNT</span>
                                                <p className="subContent">
                                                    Securely resume your journey. Enter your registered Player ID or Email along 
                                                    with your password, and click login to proceed. You will directly spawn right 
                                                    at the Left Wing to continue your career matching adventure.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section id="securityMeasureContainer">
                                        <label className="subHeader">SECURITY MEASURE</label>

                                        <p className="caption">
                                            Protect your progress with integrated security features: multi-step login authentication, 
                                            sensitive data masking for PINs/passwords, and a streamlined recovery process to 
                                            ensure you never lose access to your career exploration journey
                                        </p>
                                    </section>

                                    <section id="guideForPlayersContainer">
                                        <label className="subHeader">GUIDE FOR PLAYERS</label>

                                        <p className="caption">
                                            Success in career matching comes from honesty and exploration. Interact with every NPC, 
                                            answer the AI’s questions truthfully, and don't be afraid to retake the assessments. 
                                            Pay close attention to the AI’s feedback these insights are tailored to your gameplay
                                            and academic strengths
                                        </p>

                                        <div className="cardContainer">
                                            <div className="cardWrapper">
                                                <span className="cardContent">Answer questions honestly to receive accurate AI recommendations</span>
                                            </div>

                                            <div className="cardWrapper">
                                                <span className="cardContent">Explore different game paths to discover various career options</span>
                                            </div>

                                            <div className="cardWrapper">
                                                <span className="cardContent">Review statistics on dashboard to track progress and improvement</span>
                                            </div>

                                            <div className="cardWrapper">
                                                <span className="cardContent">Define your actual skills and personality traits to ensure accurate and correct results</span>
                                            </div>

                                            <div className="cardWrapper">
                                                <span className="cardContent">Verify that your selected traits accurately reflect your strengths for a more personalized career analysis</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section id="logoutProcedureContainer">
                                        <label className="subHeader">LOGOUT PROCEDURE</label>

                                        <div className="imgGroup">
                                            <div className="imgWrapper">
                                                <img src="assets/Manual/SettingsLogout.png" alt="SettingsLogout" />
                                                <small>Logout can be found<br />inside the settings panel</small>
                                            </div>

                                            <div className="imgWrapper">
                                                <img src="assets/Manual/DashboardLogout.png" alt="DashboardLogout" />
                                                <small>Logout can be found<br />inside the dashboard modal</small>
                                            </div>
                                        </div>

                                        <p className="caption">
                                            Closing your session correctly ensures that all career matches and game progress 
                                            are synchronized with our servers. No data loss and keep your student profile up 
                                            to date for your next exploration.
                                        </p>
                                    </section>
                                </section>

                                <section id="overviewContainer">
                                    <label className="mainHeader">OVERVIEW</label>

                                    <section id="scenesContainer">
                                        <label className="subHeader">SCENES</label>

                                        <p className="caption">
                                            A lively scenery inside and outside of the main campus serves a unique purpose in 
                                            your career discovery. Explore every area carefully — from the campus grounds outside 
                                            to the halls within — as each location holds something valuable to help you find the 
                                            right college program and career path for you.
                                        </p>

                                        <div className="cardContainer">
                                            <div id="outdoorContainer" className="cardWrapper">
                                                <img src="assets/Manual/Outdoor.png" alt="Outdoor scene" />

                                                <span className="mainContent">Outdoor Scene (Outside of the campus)</span>
                                                <p className="subContent">
                                                    The outdoor area serves as the starting point of your journey. Explore 
                                                    the campus grounds and find your way inside through two entry points — 
                                                    the main door at the front of the building leads you into the Left Wing, 
                                                    while heading to the right side past the first staircase will bring you 
                                                    directly into the Right Wing. This is where your career exploration 
                                                    adventure begins.
                                                </p>
                                            </div>

                                            <div id="leftWingContainer" className="cardWrapper">
                                                <img src="assets/Manual/LeftWing.png" alt="Left wing scene" />

                                                <span className="mainContent">Left Wing Scene (Inside of the campus)</span>
                                                <p className="subContent">
                                                    The left wing is your central hub for account and progress 
                                                    management. Access the Dashboard Modal to review your career 
                                                    matching statistics and progress, or open the Account Management 
                                                    Modal to update your player profile and settings. On the right side 
                                                    of this wing lies the doorway leading into the Hallway — your path 
                                                    deeper into the campus. Head downstairs to return to the Outdoor area.
                                                </p>
                                            </div>

                                            <div id="hallwayContainer" className="cardWrapper">
                                                <img src="assets/Manual/Hallway.png" alt="Hallway scene" />

                                                <span className="mainContent">Hallway Scene (Inside of the campus)</span>
                                                <p className="subContent">
                                                    The hallway is the core of your career assessment experience. 
                                                    Discover 8 doors in total, each representing a different 
                                                    college course — CITCS, CAS, CBA, CCJ, IPPG, ISW, CTE, and 
                                                    COM. Choose a course that interests you and then select from 
                                                    3 different types of assessments: Skill, Personality, and 
                                                    Course-Related — each designed to evaluate a unique aspect 
                                                    of your strengths and suitability for that program. On the 
                                                    left side is the doorway back to the Left Wing, while the 
                                                    right side leads you into the Right Wing.
                                                </p>
                                            </div>

                                            <div id="rightWingContainer" className="cardWrapper">
                                                <img src="assets/Manual/RightWing.png" alt="Right wing scene" />

                                                <span className="mainContent">Right Wing Scene (Inside of the campus)</span>
                                                <p className="subContent">
                                                    The right wing is where you can track and compare 
                                                    performance across all players. Access the Leaderboard 
                                                    Modal to view rankings for every course — see who 
                                                    answered, who achieved the highest scores, and how 
                                                    quickly they completed their assessments. On the left 
                                                    side of this wing is the doorway leading back to the 
                                                    Hallway, and heading downstairs will return you to 
                                                    the Outdoor area.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section id="modalsContainer">
                                        <label className="subHeader">MODALS</label>

                                        <p className="caption">
                                            Modals are interactive pop-up panels that appear on top of the game world, 
                                            giving you access to key features without leaving the scene. Each modal serves 
                                            a specific purpose — from managing your account and tracking your career 
                                            assessment progress, to recovering your credentials and competing on the 
                                            leaderboard. These panels are accessible at designated points throughout the 
                                            campus and are designed to keep your journey organized, secure, and personalized.
                                        </p>

                                        <div className="cardContainer">
                                            <div className="cardWrapper">
                                                <img src="assets/Manual/ForgotPassword.png" alt="Password recovery" />

                                                <span className="mainContent">Password Recovery Modal</span>
                                                <p className="subContent">
                                                    A 3-step flow: find account via Player ID or email (with a live "found" confirmation 
                                                    card), verify your 4-digit PIN for security, then set a new password. Steps 2 and 3 
                                                    are visually locked until the prior step clears.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="cardContainer">
                                            <div className="cardWrapper">
                                                <img src="assets/Manual/Dashboard.png" alt="Dashboard" />

                                                <span className="mainContent">Dashboard Modal</span>
                                                <p className="subContent">
                                                    It shows the player's profile information, summary stats — list of courses 
                                                    (assessments played/done, course-related total score), course progression 
                                                    (selected/preferred & not selected), selected skill and personality tags, 
                                                    an AI comment and suggestions/analysis box (only shown when all 3 assessments 
                                                    are complete), and action/danger buttons for reset/delete. A search bar lets you 
                                                    look up other player dashboards.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="cardContainer">
                                            <div className="cardWrapper">
                                                <img src="assets/Manual/AccountManagement.png" alt="Account management" />

                                                <span className="mainContent">Account Management Modal</span>
                                                <p className="subContent">
                                                    Automatically adopt between Registration (if you're a new player) and Manage Account. 
                                                    Registration collects profile data, account information, and preference selections 
                                                    (course preferred, current skills, and interests) that tailor the AI analysis. Manage 
                                                    Account pre-fills existing data for updating. Include an instructions and purposes about 
                                                    account creation being optional.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="cardContainer">
                                            <div className="cardWrapper">
                                                <img src="assets/Manual/Leaderboard.png" alt="Leaderboard" />

                                                <span className="mainContent">Leaderboard Modal</span>
                                                <p className="subContent">
                                                    A podium display for top 3 players with colored blocks by rank, then a 
                                                    full ranked list showing player ID, player name, course, assessment type, 
                                                    score, and time of completion. Dropdowns filter by course and assessment type.
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </section>

                                <div className="btnWrapper">
                                    <button id="scrollBackButton" onClick={handleScrollBack}>SCROLL BACK TO TOP</button>
                                </div>
                            </>
                        </main>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Manual;