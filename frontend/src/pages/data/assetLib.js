export const AssetLib = {
    spritesheets: [
        // Player
        { key: 'standmale', path: 'assets/Character/StandMale.png', width: 50, height: 50, end: 3, rate: 2 },
        { key: 'standfemale', path: 'assets/Character/StandFemale.png', width: 50, height: 50, end: 3, rate: 2 },
        { key: 'frontmale', path: 'assets/Character/FrontMale.png', width: 50, height: 50, end: 3, rate: 6 },
        { key: 'frontfemale', path: 'assets/Character/FrontFemale.png', width: 50, height: 50, end: 3, rate: 6 },
        { key: 'sidemale', path: 'assets/Character/SideMale.png', width: 50, height: 50, end: 5, rate: 6 },
        { key: 'sidefemale', path: 'assets/Character/SideFemale.png', width: 50, height: 50, end: 5, rate: 6 },
        { key: 'backmale', path: 'assets/Character/BackMale.png', width: 50, height: 50, end: 3, rate: 6 },
        { key: 'backfemale', path: 'assets/Character/BackFemale.png', width: 50, height: 50, end: 3, rate: 6 },

        // NPC
        { key: 'female1', path: 'assets/Character/NPC/Female1.png', width: 50, height: 50, end: 3 },
        { key: 'professor', path: 'assets/Character/NPC/Professor.png', width: 50, height: 50, end: 1 },
        { key: 'female2', path: 'assets/Character/NPC/Female2.png', width: 50, height: 50, end: 1 },
        { key: 'female3', path: 'assets/Character/NPC/Female3.png', width: 50, height: 50, end: 2 },
        { key: 'male1', path: 'assets/Character/NPC/Male1.png', width: 50, height: 50, end: 1 },
        { key: 'male2', path: 'assets/Character/NPC/Male2.png', width: 50, height: 50, end: 2 },
        { key: 'musicmale', path: 'assets/Character/NPC/MusicMale.png', width: 50, height: 50, end: 2 },
        { key: 'group', path: 'assets/Character/NPC/Group.png', width: 50, height: 50, end: 4 },

        // background
            // male
        { key: 'defaultmale', path: 'assets/Background/Classroom/Male/Default.png', width: 800, height: 300 },
        { key: 'thinkingmale', path: 'assets/Background/Classroom/Male/Thinking.png', width: 800, height: 300 },
        { key: 'student1male', path: 'assets/Background/Classroom/Male/Student1.png', width: 800, height: 300 },
        { key: 'student2male', path: 'assets/Background/Classroom/Male/Student2.png', width: 800, height: 300 },
        { key: 'student3male', path: 'assets/Background/Classroom/Male/Student3.png', width: 800, height: 300 },
        { key: 'student4male', path: 'assets/Background/Classroom/Male/Student4.png', width: 800, height: 300 },
        { key: 'student5male', path: 'assets/Background/Classroom/Male/Student5.png', width: 800, height: 300 },
        { key: 'student6male', path: 'assets/Background/Classroom/Male/Student6.png', width: 800, height: 300 },
        { key: 'student7male', path: 'assets/Background/Classroom/Male/Student7.png', width: 800, height: 300 },
        { key: 'student8male', path: 'assets/Background/Classroom/Male/Student8.png', width: 800, height: 300 },
            // female
        { key: 'defaultfemale', path: 'assets/Background/Classroom/Female/Default.png', width: 800, height: 300 },
        { key: 'thinkingfemale', path: 'assets/Background/Classroom/Female/Thinking.png', width: 800, height: 300 },
        { key: 'student1female', path: 'assets/Background/Classroom/Female/Student1.png', width: 800, height: 300 },
        { key: 'student2female', path: 'assets/Background/Classroom/Female/Student2.png', width: 800, height: 300 },
        { key: 'student3female', path: 'assets/Background/Classroom/Female/Student3.png', width: 800, height: 300 },
        { key: 'student4female', path: 'assets/Background/Classroom/Female/Student4.png', width: 800, height: 300 },
        { key: 'student5female', path: 'assets/Background/Classroom/Female/Student5.png', width: 800, height: 300 },
        { key: 'student6female', path: 'assets/Background/Classroom/Female/Student6.png', width: 800, height: 300 },
        { key: 'student7female', path: 'assets/Background/Classroom/Female/Student7.png', width: 800, height: 300 },
        { key: 'student8female', path: 'assets/Background/Classroom/Female/Student8.png', width: 800, height: 300 },
    ],
    images: [
        // scenes
        { key: 'outdoorbg', path: 'assets/Background/Outdoor.png', width: 800, height: 300 },
        { key: 'leftwingbg', path: 'assets/Background/LeftWing.png', width: 800, height: 300 },
        { key: 'hallwaybg', path: 'assets/Background/Hallway.png', width: 4000, height: 300 },
        { key: 'rightwingbg', path: 'assets/Background/RightWing.png', width: 800, height: 300 },

        //NPC
        { key: 'staticgroup', path: 'assets/Character/NPC/StaticGroup.png', width: 50, height: 50 },

        // game assets
        { key: 'settings', path: 'assets/GameAssets/Settings.png' },
        { key: 'manual', path: 'assets/GameAssets/Manual.png' },
        { key: 'spacebar', path: 'assets/GameAssets/Spacebar.png' },

        // controls
        { key: 'interactunselected', path: 'assets/GameAssets/Controls/InteractUnselected.png' },
        { key: 'interactselected', path: 'assets/GameAssets/Controls/InteractSelected.png' },
        { key: 'rununclicked', path: 'assets/GameAssets/Controls/RunUnclicked.png' },
        { key: 'runclicked', path: 'assets/GameAssets/Controls/RunClicked.png' },
        { key: 'dpadunclicked', path: 'assets/GameAssets/Controls/DpadUnclicked.png' },
        { key: 'dpaddown', path: 'assets/GameAssets/Controls/DpadDown.png' },
        { key: 'dpadleft', path: 'assets/GameAssets/Controls/DpadLeft.png' },
        { key: 'dpadright', path: 'assets/GameAssets/Controls/DpadRight.png' },
        { key: 'dpadup', path: 'assets/GameAssets/Controls/DpadUp.png' },
    ],
    audio: [
        { key: 'gamebg', path: 'assets/GameAudio/GameBgMusic.mp3' },
        { key: 'classroombg', path: 'assets/GameAudio/ClassroomBgMusic.mp3' },
        { key: 'interactaudio', path: 'assets/GameAudio/InteractAudio.mp3' },
        { key: 'answeraudio', path: 'assets/GameAudio/AnswerAudio.mp3' },
        { key: 'correctaudio', path: 'assets/GameAudio/CorrectAudio.mp3' },
        { key: 'wrongaudio', path: 'assets/GameAudio/WrongAudio.mp3' }
    ]
};