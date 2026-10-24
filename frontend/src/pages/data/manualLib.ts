export interface ManualImage {
    src: string;
    alt: string;
    caption?: string;
}

export interface ManualCard {
    image?: ManualImage;
    title?: string;
    text?: string[];
}

export type ManualBlock =
    | { type: 'text'; paragraphs: string[] }
    | { type: 'image'; image: ManualImage }
    | { type: 'images'; images: ManualImage[] }
    | { type: 'list'; items: string[] }
    | { type: 'cards'; cards: ManualCard[]; columns?: 1 | 2 };

export interface ManualPage {
    navIds: string[];
    chapter: string;
    title: string;
    lead?: string;
    variant?: 'cover';
    blocks: ManualBlock[];
}

export interface ManualNavItem {
    label: string;
    target: string;
    children?: ManualNavItem[];
}

export const manualNav: ManualNavItem[] = [
    {
        label: 'HOME',
        target: 'manualContainer',
        children: [
            { label: 'INTRODUCTION', target: 'introductionContainer' },
            { label: 'SYSTEM REQUIREMENTS', target: 'requirementsContainer' },
        ],
    },
    {
        label: 'FEATURES',
        target: 'featuresContainer',
        children: [
            { label: 'LOGIN PROCEDURE', target: 'loginProcedureContainer' },
            { label: 'SECURITY MEASURE', target: 'securityMeasureContainer' },
            { label: 'GUIDE FOR PLAYERS', target: 'guideForPlayersContainer' },
            { label: 'LOGOUT PROCEDURE', target: 'logoutProcedureContainer' },
        ],
    },
    {
        label: 'OVERVIEW',
        target: 'overviewContainer',
        children: [
            {
                label: 'SCENES',
                target: 'scenesContainer',
                children: [
                    { label: 'OUTDOOR SCENE', target: 'outdoorContainer' },
                    { label: 'LEFT WING SCENE', target: 'leftWingContainer' },
                    { label: 'HALLWAY SCENE', target: 'hallwayContainer' },
                    { label: 'RIGHT WING SCENE', target: 'rightWingContainer' },
                ],
            },
            {
                label: 'MODALS',
                target: 'modalsContainer',
                children: [
                    { label: 'PASSWORD RECOVERY MODAL', target: 'passwordRecoveryContainer' },
                    { label: 'DASHBOARD MODAL', target: 'dashboardContainer' },
                    { label: 'ACCOUNT MANAGEMENT MODAL', target: 'accountManagementContainer' },
                    { label: 'LEADERBOARD MODAL', target: 'leaderboardContainer' },
                ],
            },
        ],
    },
];

export const manualPages: ManualPage[] = [
    {
        navIds: ['manualContainer'],
        chapter: '',
        title: 'How to play',
        lead: 'An AI-driven 8-bit web game for personalized college program matching and career exploration',
        variant: 'cover',
        blocks: [
            {
                type: 'text',
                paragraphs: [
                    'Welcome, player! This manual walks you through the campus, the assessments, and everything in between.',
                    'Use the menu above to jump to any topic, or turn the pages with the buttons below or the left and right arrow keys.',
                ],
            },
        ],
    },
    {
        navIds: ['introductionContainer'],
        chapter: 'Home',
        title: 'Introduction',
        lead: 'An AI-driven 8-bit web game for personalized college program matching and career exploration',
        blocks: [
            { type: 'image', image: { src: 'assets/Background/PLMUN.png', alt: 'PLMUN background' } },
            {
                type: 'text',
                paragraphs: [
                    'This user manual is designed to guide players in understanding and navigating the AI-driven 8-bit web game for personalized college program matching and career exploration. The game uses an interactive, retro-style environment combined with artificial intelligence to help players explore suitable college programs and career paths based on their interests, personality, skills, and in-game decisions.',
                    'By following this user manual, players can easily navigate the system, understand game features, and maximize their learning experience.',
                ],
            },
        ],
    },
    {
        navIds: ['requirementsContainer'],
        chapter: 'Home',
        title: 'System requirements',
        lead: 'What do I need to play this game?',
        blocks: [
            {
                type: 'list',
                items: [
                    'A device with a web browser (Google Chrome, Mozilla Firefox, or Microsoft Edge)',
                    'Stable internet connection',
                    'Desktop, laptop, or mobile device',
                ],
            },
        ],
    },
    {
        navIds: ['featuresContainer', 'loginProcedureContainer'],
        chapter: 'Features',
        title: 'Login procedure',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/LoginPage.png', alt: 'Login page' } },
            {
                type: 'text',
                paragraphs: [
                    'The login gateway serves as your entry point into the 8-bit world. It lets players enter the game in different ways. Whether you are exploring as a guest or resuming your journey, our system provides a flexible and secure way to manage your career discovery progress.',
                ],
            },
            {
                type: 'cards',
                cards: [
                    {
                        image: { src: 'assets/Manual/GuestLogin.png', alt: 'Guest login' },
                        title: 'PLAY AS A GUEST',
                        text: [
                            'Jump straight into the action. Ideal for a quick look at the 8-bit settings, though progress is stored locally and it will be lost if you leave the game.',
                            'Click “Play as a Guest” to immediately enter the game. Guest players can explore the game but may have limited access to saving progress.',
                        ],
                    },
                    {
                        image: { src: 'assets/Manual/AccountLogin.png', alt: 'Account login' },
                        title: 'LOGIN WITH EXISTING ACCOUNT',
                        text: [
                            'Securely resume your journey. Enter your registered Player ID or Email along with your password, and click login to proceed. You will directly spawn right at the Left Wing to continue your career matching adventure.',
                        ],
                    },
                ],
            },
        ],
    },
    {
        navIds: ['securityMeasureContainer'],
        chapter: 'Features',
        title: 'Security measure',
        blocks: [
            {
                type: 'text',
                paragraphs: [
                    'Protect your progress with integrated security features: multi-step login authentication, sensitive data masking for PINs and passwords, and a streamlined recovery process to ensure you never lose access to your career exploration journey.',
                ],
            },
        ],
    },
    {
        navIds: ['guideForPlayersContainer'],
        chapter: 'Features',
        title: 'Guide for players',
        blocks: [
            {
                type: 'text',
                paragraphs: [
                    'Success in career matching comes from honesty and exploration. Interact with every NPC, answer the AI’s questions truthfully, and don’t be afraid to retake the assessments. Pay close attention to the AI’s feedback; these insights are tailored to your gameplay and academic strengths.',
                ],
            },
            {
                type: 'list',
                items: [
                    'Answer questions honestly to receive accurate AI recommendations',
                    'Explore different game paths to discover various career options',
                    'Review statistics on dashboard to track progress and improvement',
                    'Define your actual skills and personality traits to ensure accurate and correct results',
                    'Verify that your selected traits accurately reflect your strengths for a more personalized career analysis',
                ],
            },
        ],
    },
    {
        navIds: ['logoutProcedureContainer'],
        chapter: 'Features',
        title: 'Logout procedure',
        blocks: [
            {
                type: 'images',
                images: [
                    {
                        src: 'assets/Manual/SettingsLogout.png',
                        alt: 'SettingsLogout',
                        caption: 'Logout can be found\ninside the settings panel',
                    },
                    {
                        src: 'assets/Manual/DashboardLogout.png',
                        alt: 'DashboardLogout',
                        caption: 'Logout can be found\ninside the dashboard modal',
                    },
                ],
            },
            {
                type: 'text',
                paragraphs: [
                    'Closing your session correctly ensures that all career matches and game progress are synchronized with our servers. No data loss, and your student profile stays up to date for your next exploration.',
                ],
            },
        ],
    },
    {
        navIds: ['overviewContainer', 'scenesContainer'],
        chapter: 'Scenes',
        title: 'Scenes',
        blocks: [
            {
                type: 'text',
                paragraphs: [
                    'A lively scenery inside and outside of the main campus serves a unique purpose in your career discovery. Explore every area carefully, from the campus grounds outside to the halls within, as each location holds something valuable to help you find the right college program and career path for you.',
                    'The next four pages cover the Outdoor area, the Left Wing, the Hallway, and the Right Wing.',
                ],
            },
        ],
    },
    {
        navIds: ['outdoorContainer'],
        chapter: 'Scenes',
        title: 'Outdoor scene',
        lead: 'Outside of the campus',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/Outdoor.png', alt: 'Outdoor scene' } },
            {
                type: 'text',
                paragraphs: [
                    'The outdoor area serves as the starting point of your journey. Explore the campus grounds and find your way inside through two entry points: the main door at the front of the building leads you into the Left Wing, while heading to the right side past the first staircase will bring you directly into the Right Wing. This is where your career exploration adventure begins.',
                ],
            },
        ],
    },
    {
        navIds: ['leftWingContainer'],
        chapter: 'Scenes',
        title: 'Left Wing scene',
        lead: 'Inside of the campus',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/LeftWing.png', alt: 'Left wing scene' } },
            {
                type: 'text',
                paragraphs: [
                    'The left wing is your central hub for account and progress management. Access the Dashboard Modal to review your career matching statistics and progress, or open the Account Management Modal to update your player profile and settings. On the right side of this wing lies the doorway leading into the Hallway, your path deeper into the campus. Head downstairs to return to the Outdoor area.',
                ],
            },
        ],
    },
    {
        navIds: ['hallwayContainer'],
        chapter: 'Scenes',
        title: 'Hallway scene',
        lead: 'Inside of the campus',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/Hallway.png', alt: 'Hallway scene' } },
            {
                type: 'text',
                paragraphs: [
                    'The hallway is the core of your career assessment experience. Discover 8 doors in total, each representing a different college course: CITCS, CAS, CBA, CCJ, IPPG, ISW, CTE, and COM. Choose a course that interests you and then select from 3 different types of assessments: Skill, Personality, and Course-Related. Each is designed to evaluate a unique aspect of your strengths and suitability for that program. On the left side is the doorway back to the Left Wing, while the right side leads you into the Right Wing.',
                ],
            },
        ],
    },
    {
        navIds: ['rightWingContainer'],
        chapter: 'Scenes',
        title: 'Right Wing scene',
        lead: 'Inside of the campus',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/RightWing.png', alt: 'Right wing scene' } },
            {
                type: 'text',
                paragraphs: [
                    'The right wing is where you can track and compare performance across all players. Access the Leaderboard Modal to view rankings for every course: see who answered, who achieved the highest scores, and how quickly they completed their assessments. On the left side of this wing is the doorway leading back to the Hallway, and heading downstairs will return you to the Outdoor area.',
                ],
            },
        ],
    },
    {
        navIds: ['modalsContainer'],
        chapter: 'Modals',
        title: 'Modals',
        blocks: [
            {
                type: 'text',
                paragraphs: [
                    'Modals are interactive pop-up panels that appear on top of the game world, giving you access to key features without leaving the scene. Each modal serves a specific purpose, from managing your account and tracking your career assessment progress, to recovering your credentials and competing on the leaderboard.',
                    'These panels are accessible at designated points throughout the campus and are designed to keep your journey organized, secure, and personalized.',
                ],
            },
        ],
    },
    {
        navIds: ['passwordRecoveryContainer'],
        chapter: 'Modals',
        title: 'Password recovery modal',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/ForgotPassword.png', alt: 'Password recovery' } },
            {
                type: 'text',
                paragraphs: [
                    'A 3-step flow: find your account via Player ID or email (with a live “found” confirmation card), verify your 4-digit PIN for security, then set a new password. Steps 2 and 3 are visually locked until the prior step clears.',
                ],
            },
        ],
    },
    {
        navIds: ['dashboardContainer'],
        chapter: 'Modals',
        title: 'Dashboard modal',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/Dashboard.png', alt: 'Dashboard' } },
            {
                type: 'text',
                paragraphs: [
                    'It shows the player’s profile information and summary stats: the list of courses (assessments played or done, course-related total score), course progression (selected or preferred and not selected), and the selected skill and personality tags. It also holds an AI comment and suggestions box (only shown when all 3 assessments are complete) and action buttons for reset and delete. A search bar lets you look up other player dashboards.',
                ],
            },
        ],
    },
    {
        navIds: ['accountManagementContainer'],
        chapter: 'Modals',
        title: 'Account management modal',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/AccountManagement.png', alt: 'Account management' } },
            {
                type: 'text',
                paragraphs: [
                    'Automatically adapts between Registration (if you’re a new player) and Manage Account. Registration collects profile data, account information, and preference selections (course preferred, current skills, and interests) that tailor the AI analysis. Manage Account pre-fills existing data for updating. It also includes instructions and the purpose of account creation, which is optional.',
                ],
            },
        ],
    },
    {
        navIds: ['leaderboardContainer'],
        chapter: 'Modals',
        title: 'Leaderboard modal',
        blocks: [
            { type: 'image', image: { src: 'assets/Manual/Leaderboard.png', alt: 'Leaderboard' } },
            {
                type: 'text',
                paragraphs: [
                    'A podium display for the top 3 players with colored blocks by rank, then a full ranked list showing player ID, player name, course, assessment type, score, and time of completion. Buttons filter the ranking by course.',
                ],
            },
        ],
    },
];