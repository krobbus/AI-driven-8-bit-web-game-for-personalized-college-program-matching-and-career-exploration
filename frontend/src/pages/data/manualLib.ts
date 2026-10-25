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

const manualImage = (path: string, alt: string, caption?: string): ManualImage => ({
    src: `assets/Manual/${path}`,
    alt,
    ...(caption ? { caption } : {}),
});

const textBlock = (...paragraphs: string[]): ManualBlock => ({
    type: 'text',
    paragraphs,
});

const imageBlock = (image: ManualImage): ManualBlock => ({
    type: 'image',
    image,
});

const imageGroupBlock = (...images: ManualImage[]): ManualBlock => ({
    type: 'images',
    images,
});

export const manualNav: ManualNavItem[] = [
    {
        label: 'HOME',
        target: 'manualContainer',
        children: [
            { label: 'INTRODUCTION', target: 'introductionContainer' },
        ],
    },
    {
        label: 'FEATURES',
        target: 'featuresContainer',
        children: [
            { label: 'SECURITY MEASURE', target: 'securityMeasureContainer' },
            { label: 'GUIDE FOR PLAYERS', target: 'guideForPlayersContainer' },
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
                    { label: 'OUTDOOR', target: 'outdoorContainer' },
                    { label: 'LEFT WING', target: 'leftWingContainer' },
                    { label: 'HALLWAY', target: 'hallwayContainer' },
                    { label: 'RIGHT WING', target: 'rightWingContainer' },
                    { label: 'CLASSROOM', target: 'classroomContainer' },
                ],
            },
            {
                label: 'DASHBOARD',
                target: 'dashboardContainer',
                children: [
                    { label: 'PROFILE', target: 'dashboardProfileContainer' },
                    { label: 'STATISTICS', target: 'dashboardStatisticsContainer' },
                    { label: 'SKILLS AND PERSONALITY', target: 'dashboardTraitsContainer' },
                    { label: 'AI COMMENT AND ACTIONS', target: 'dashboardActionsContainer' },
                ],
            },
        ],
    },
    {
        label: 'PROCESS',
        target: 'processContainer',
        children: [
            { label: 'LOGIN PROCEDURE', target: 'loginProcedureContainer' },
            { label: 'ACCOUNT SETUP', target: 'accountSetupContainer' },
            { label: 'LOGOUT PROCEDURE', target: 'logoutProcedureContainer' },
            { label: 'ASSESSMENT', target: 'assessmentContainer' },
            { label: 'RECOMMENDATIONS', target: 'recommendationsContainer' },
        ],
    },
];

export const manualPages: ManualPage[] = [
    {
        navIds: ['manualContainer'],
        chapter: '',
        title: 'Your campus adventure starts here',
        lead: 'A friendly guide to your 8-bit college and career exploration journey',
        variant: 'cover',
        blocks: [
            textBlock(
                'Welcome, player! I will help you find your way around the campus, complete your assessments, and understand your personalized recommendations.',
                'Choose a topic from the menu or use the page buttons and left/right arrow keys or drag the book page to explore this guide.'
            ),
        ],
    },
    {
        navIds: ['introductionContainer'],
        chapter: 'Introduction',
        title: 'Welcome to your career exploration game',
        lead: 'Explore college programs at your own pace.',
        blocks: [
            textBlock(
                'This game combines a retro campus adventure with assessments to help you reflect on your interests, skills, and personality. Explore the campus, choose a course, and answer its assessment questions.',
                'Your Dashboard brings together your profile, assessment progress, results, and AI-generated suggestions. The guide is here whenever you need a reminder about where to go or what to do next.',
                'Ready? Start by exploring the areas around campus, then follow the assessment and recommendation steps in this manual.'
            ),
        ],
    },
    {
        navIds: ['featuresContainer'],
        chapter: 'Features',
        title: 'Helpful features around campus',
        lead: 'Here is what each feature does and where you can find it.',
        blocks: [
            {
                type: 'cards',
                cards: [
                    {
                        image: manualImage('Features/KeyGuide.png', 'Keyboard guide showing game controls'),
                        title: 'KEY GUIDE',
                        text: ['Find the key guide on the game screen when keyboard controls are available. It shows how to move, navigate menus, and interact. Open Settings to change the key-guide visibility or mobile controls.'],
                    },
                    {
                        image: manualImage('Features/NPCDialogue.png', 'A non-player character dialogue'),
                        title: 'NPC DIALOGUE',
                        text: ['Talk with non-player characters (NPCs) you meet around campus. They share helpful information and directions. Move near a character and use the on-screen interaction prompt.'],
                    },
                    {
                        image: manualImage('Features/Leaderboard.png', 'Leaderboard with player assessment results'),
                        title: 'LEADERBOARD',
                        text: ['Visit the Right Wing to open the leaderboard. Browse assessment results and compare rankings by course.'],
                    },
                    {
                        image: manualImage('Features/ProfileCreationHint.png', 'Hint prompting the player to complete profile creation'),
                        title: 'PROFILE SETUP REMINDER',
                        text: ['If your profile is not ready, the game displays a reminder to complete Character Creation and Preferences Discovery. Use the Profile Creation option in the Left Wing Menu to finish your profile.'],
                    },
                ],
            },
            textBlock(
                'You can also open the Dashboard from the Left Wing to review your own progress or search for another player’s profile. The Dashboard section of this guide explains what you can see.'
            ),
        ],
    },
    {
        navIds: ['securityMeasureContainer'],
        chapter: 'Features',
        title: 'Keep your account and progress safe',
        lead: 'A few simple habits help protect your profile.',
        blocks: [
            {
                type: 'list',
                items: [
                    'Keep your password and account PIN private. Do not share them with other players.',
                    'Use the password recovery process if you cannot sign in. It asks you to verify your account and PIN before setting a new password.',
                    'Choose the account login option when you want your profile and progress saved to your account. Guest play is intended for trying the game and may not save progress between visits.',
                    'Log out when you finish, especially when using a shared device.',
                    'Only search for and view profiles for a legitimate reason. Other players’ dashboards may show their statistics, skills, personality preferences, and AI comment.',
                ],
            },
            textBlock(
                'Your account PIN is a recovery safeguard, not a password to share. Store your login details somewhere private and accessible only to you.'
            ),
        ],
    },
    {
        navIds: ['guideForPlayersContainer'],
        chapter: 'Features',
        title: 'A few tips before you begin',
        lead: 'Take your time and make the results useful to you.',
        blocks: [
            imageBlock(manualImage('Features/ProfileCreationHint.png', 'A reminder to finish profile creation')),
            {
                type: 'list',
                items: [
                    'Complete Character Creation and Preferences Discovery before starting your assessments.',
                    'Choose skills, personality traits, and courses that genuinely reflect your interests and strengths.',
                    'Explore all the campus areas and ask NPCs for help when you need directions.',
                    'Finish each assessment to save its result and update your Dashboard progress.',
                    'Review your answers and explanations after an assessment. You can retake assessments and track your latest progress.',
                    'Complete all three assessments for a course before asking the AI to evaluate it. Completing more courses gives you a broader comparison.',
                ],
            },
        ],
    },
    {
        navIds: ['overviewContainer', 'scenesContainer'],
        chapter: 'Overview',
        title: 'Explore the campus',
        lead: 'Each area has a different role in your journey.',
        blocks: [
            textBlock(
                'The Outdoor area is your starting point. From there, explore the Left Wing, Hallway, and Right Wing. The Hallway leads into course classrooms, where you take assessments.',
                'Follow the next pages to learn what you will find in each scene and where to go for help, account tools, assessments, and player rankings.'
            ),
        ],
    },
    {
        navIds: ['outdoorContainer'],
        chapter: 'Overview · Scenes',
        title: 'Outdoor',
        lead: 'Start here and find your way into the campus.',
        blocks: [
            imageBlock(manualImage('Scenes/Outdoor.png', 'Outdoor campus scene')),
            textBlock(
                'The Outdoor scene is the starting area. Explore the grounds and use the campus entrances to travel to the Left Wing or Right Wing.',
                'If you are unsure where to go, look for a nearby NPC or use the game controls shown in the key guide.'
            ),
        ],
    },
    {
        navIds: ['leftWingContainer'],
        chapter: 'Overview · Scenes',
        title: 'Left Wing',
        lead: 'Open your account tools and Dashboard here.',
        blocks: [
            imageBlock(manualImage('Scenes/LeftWing.png', 'Left Wing campus scene')),
            textBlock(
                'The Left Wing is where you can access account and progress tools. Open Account Management to create or update your profile, or open the Dashboard to review course progress, assessment results, skills, personality, and AI suggestions.',
                'Use the nearby campus route to continue to the Hallway and its course doors.'
            ),
        ],
    },
    {
        navIds: ['hallwayContainer'],
        chapter: 'Overview · Scenes',
        title: 'Hallway',
        lead: 'Choose a course and enter its classroom.',
        blocks: [
            imageBlock(manualImage('Scenes/Hallway.png', 'Hallway with doors to college courses')),
            textBlock(
                'The Hallway connects you to the available college course areas. Choose a course door, then select the assessment you want to take. You can explore both courses you selected during Preferences Discovery and other available courses.',
                'The Hallway also connects the Left Wing and the Right Wing. Complete your assessments in the classroom, then return to the Dashboard to check your progress.'
            ),
        ],
    },
    {
        navIds: ['rightWingContainer'],
        chapter: 'Overview · Scenes',
        title: 'Right Wing',
        lead: 'Compare assessment rankings on the leaderboard.',
        blocks: [
            imageBlock(manualImage('Scenes/RightWing.png', 'Right Wing campus scene')),
            textBlock(
                'Visit the Right Wing to open the Leaderboard. Use its course filters to compare available player assessment rankings.',
                'When you are ready to continue exploring or take another assessment, return to the Hallway.'
            ),
        ],
    },
    {
        navIds: ['classroomContainer'],
        chapter: 'Overview · Scenes',
        title: 'Classroom',
        lead: 'Take the three assessments available for each course.',
        blocks: [
            imageBlock(manualImage('Scenes/Classroom/CourseRelatedAssessment.png', 'Course-related assessment in the classroom', 'Course-Related Assessment')),
            textBlock('Answer questions about the course area. Your score and answers are saved to that course when you finish.'),
            imageBlock(manualImage('Scenes/Classroom/SkillAssessment.png', 'Skill assessment in the classroom', 'Skill Assessment')),
            textBlock('Reflect on skills connected with the course and your strengths.'),
            imageBlock(manualImage('Scenes/Classroom/PersonalityAssessment.png', 'Personality assessment in the classroom', 'Personality Assessment')),
            textBlock(
                'Each course has a Course-Related, Skill, and Personality Assessment. Finish all three to complete that course’s progress and make it ready for AI evaluation. You need to reach the assessment result screen for your completed answers to be saved.'
            ),
        ],
    },
    {
        navIds: ['dashboardContainer', 'dashboardProfileContainer'],
        chapter: 'Overview · Dashboard',
        title: '1. Profile',
        lead: 'Review player information and search for another profile.',
        blocks: [
            imageBlock(manualImage('Modals/Dashboard/Profile.png', 'Dashboard profile section')),
            textBlock(
                'The Profile section shows the player’s profile details, such as name, email, role, and other account information. Some private details are available only when viewing your own profile or when you have administrator access.',
                'Use the Dashboard search field to look up another player by Player ID. You can view that player’s statistics, skills, personality preferences, and comment or suggestions. Respect other players’ privacy when searching.'
            ),
            imageBlock(manualImage('Features/ViewOtherProfiles.png', 'Dashboard search for another player profile')),
        ],
    },
    {
        navIds: ['dashboardStatisticsContainer'],
        chapter: 'Overview · Dashboard',
        title: '2. Statistics',
        lead: 'Track course completion, scores, and assessment history.',
        blocks: [
            imageBlock(manualImage('Modals/Dashboard/Statistics.png', 'Dashboard course statistics and progress')),
            textBlock(
                'The Statistics section lists the courses you chose during Profile Creation in Preferences Discovery. Open a course to see its Course-Related, Skill, and Personality Assessment status.',
                'Finished assessments show their saved results and history, including the Course-Related score. The progress bar tracks how many of the three assessments you have completed. Once all three are complete, the course reaches 100% and is marked ready for evaluation.'
            ),
        ],
    },
    {
        navIds: ['dashboardTraitsContainer'],
        chapter: 'Overview · Dashboard',
        title: '3. Skills and personality',
        lead: 'See the preferences saved in your player profile.',
        blocks: [
            imageBlock(manualImage('Modals/Dashboard/SkillsAndPersonality.png', 'Dashboard skills and personality preferences')),
            textBlock(
                'This section displays your saved skill and personality preferences. These are the choices you made during Preferences Discovery, not a score generated by an assessment.',
                'If the list does not represent you anymore, update your preferences through Account Management before generating new suggestions.'
            ),
        ],
    },
    {
        navIds: ['dashboardActionsContainer'],
        chapter: 'Overview · Dashboard',
        title: '4. AI comment and actions',
        lead: 'Generate suggestions after completing a course, then manage your progress.',
        blocks: [
            imageBlock(manualImage('Modals/Dashboard/AICommentAndActions.png', 'Dashboard AI comment and account actions')),
            textBlock(
                'The AI Comment and Suggestions area becomes available after you finish all three assessments for at least one course. Select Generate and allow a few moments for the Gemini-powered analysis to review your finished course assessments, scores, answers, skills, and personality preferences.',
                'After a comment is generated, you can download it as a PDF or select Re-generate if you would like another analysis or more suggestions. At the bottom of the Dashboard, account actions let you reset your progress or delete your account. These actions affect saved data, so read the confirmation prompt carefully.'
            ),
        ],
    },
    {
        navIds: ['processContainer', 'loginProcedureContainer'],
        chapter: 'Process · Login',
        title: '1. Login procedure',
        lead: 'This is the first page you see when you open the website.',
        blocks: [
            imageBlock(manualImage('Process/Login/LoginPage.png', 'Game login page')),
            textBlock(
                'From the login page, choose how you would like to start. Play as a Guest to explore, or log in with an existing account to continue with your saved profile.'
            ),
            imageGroupBlock(
                manualImage('Process/Login/AccountLogin.png', 'Existing account login form', 'Account login'),
                manualImage('Process/Login/PlayGuest.png', 'Play as a Guest option', 'Play as a Guest')
            ),
            textBlock(
                'Account login is the best choice when you want to keep and revisit your progress. Enter your account details to sign in. Guest play lets you try the game without an account; guest progress may not persist between visits.'
            ),
        ],
    },
    {
        navIds: ['accountSetupContainer'],
        chapter: 'Process · Login',
        title: 'Set up your player profile',
        lead: 'Create your account and complete both parts of Profile Creation.',
        blocks: [
            imageBlock(manualImage('Modals/AccountRegistration/AccountRegistration.png', 'Account registration form')),
            textBlock(
                'New players can register an account through Account Management. Follow the prompts and keep your account details private. Profile Creation has two parts: Character Creation and Preferences Discovery.'
            ),
            imageBlock(manualImage('Modals/ProfileCreation/CharacterCreation.png', 'Character Creation profile form', 'Character Creation')),
            textBlock('Choose your character details, including a player name and gender.'),
            imageBlock(manualImage('Modals/ProfileCreation/PreferencesDiscovery.png', 'Preferences Discovery form', 'Preferences Discovery')),
            textBlock('Select skills and personality preferences that describe you.'),
            imageBlock(manualImage('Modals/ProfileCreation/CourseSelection.png', 'Course selection options', 'Course Selection')),
            textBlock(
                'Choose the courses you want to explore. Your selected courses appear in Dashboard statistics, but you can also explore other available courses in the Hallway. Finish the required profile setup so your assessments and recommendations can be personalized.'
            ),
        ],
    },
    {
        navIds: ['logoutProcedureContainer'],
        chapter: 'Process · Logout',
        title: '2. Log out when you are finished',
        lead: 'You can log out from either the game settings or Dashboard.',
        blocks: [
            imageGroupBlock(
                manualImage('Process/Logout/SettingsLogout.png', 'Logout option in game settings', 'Settings logout'),
                manualImage('Process/Logout/DashboardLogout.png', 'Logout option in the Dashboard', 'Dashboard logout')
            ),
            textBlock(
                'Choose the Settings logout option while you are in the game, or use the logout option in the Dashboard. Logging out ends your current session. On a shared device, remember to log out before you leave.'
            ),
        ],
    },
    {
        navIds: ['assessmentContainer'],
        chapter: 'Process · Assessment',
        title: '3. Complete an assessment',
        lead: 'Choose an assessment, answer each question, and review your results.',
        blocks: [
            imageBlock(manualImage('Process/Assessment/AssessmentTypes.png', 'Menu for selecting an assessment type', 'Step 1 · Choose an assessment')),
            textBlock(
                'Choose Course-Related, Skill, or Personality for the course you are exploring. Finish the assessment and reach its result screen to save your progress and answers. Complete all three assessment types for each course you want included in AI comments and recommendations. You may also assess courses you did not select during Profile Creation.'
            ),
            imageBlock(manualImage('Process/Assessment/AnswerAnimation.png', 'Answer feedback animation in an assessment', 'Step 2 · Watch the answer feedback')),
            textBlock(
                'After you select an answer, the game plays a short answer animation. When the answer is revealed, a green answer bubble means your answer was correct; a red bubble means it was incorrect.'
            ),
            imageBlock(manualImage('Process/Assessment/ExplanationSources.png', 'Assessment explanation, source, and link', 'Step 3 · Read the explanation and source')),
            textBlock(
                'After the answer is revealed, the game shows an explanation, its source, and a link when available. These references are provided to help you check the explanation and may include educational or organization domains such as .edu and .org. Open the source to review its context and details.'
            ),
            imageBlock(manualImage('Process/Assessment/AssessmentResult.png', 'Assessment summary and total score', 'Step 4 · Review your result')),
            textBlock(
                'The result screen summarizes your questions and answers, the correct answers, explanations, sources, and your total score when the assessment is scored. Review the summary before closing it; completing the assessment records your progress.'
            ),
        ],
    },
    {
        navIds: ['recommendationsContainer'],
        chapter: 'Process · Recommendations',
        title: '4. Get AI recommendations',
        lead: 'Finish the assessments for a course before generating its analysis.',
        blocks: [
            imageBlock(manualImage('Process/Recommendation/ReadyForEvaluation.png', 'A course at 100 percent and ready for evaluation', 'Step 1 · Finish all three assessments')),
            textBlock(
                'When you finish the Course-Related, Skill, and Personality Assessments for a course, its progress reaches 100% and the Dashboard marks it Ready for Evaluation. You can generate an analysis with one completed course; finishing more courses is recommended so you can compare your results across programs.'
            ),
            imageBlock(manualImage('Process/Recommendation/AICommentSuggestions.png', 'Dashboard ready to generate AI comments and suggestions', 'Step 2 · Start the analysis')),
            textBlock(
                'Open the Dashboard and choose Generate in AI Comment and Suggestions. The button becomes available after at least one course is ready for evaluation.'
            ),
            imageBlock(manualImage('Process/Recommendation/AICommentSuggestionsResult.png', 'Generated AI comment and suggestions', 'Step 3 · Review or download the analysis')),
            textBlock(
                'The analysis may take a few moments. Once it appears, read the explanation and suggestions. Download the report as a PDF, or choose Re-generate if you want another set of suggestions.'
            ),
            imageBlock(manualImage('Process/Recommendation/AICommentRecommendation.png', 'Top course recommendation in the generated analysis', 'Step 4 · Review your top recommendation')),
            textBlock(
                'The Top Recommendation section summarizes the course recommendation across your finished courses. It uses the assessment results and scores together with your saved skills and personality preferences.'
            ),
            imageBlock(manualImage('Process/Recommendation/CareerReport.png', 'Example career exploration report downloaded as a PDF', 'Step 5 · Example PDF report')),
            textBlock(
                'This is an example of the downloaded career exploration report. Keep a copy if you want to revisit your analysis later.'
            ),
        ],
    },
];
