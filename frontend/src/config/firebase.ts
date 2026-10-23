import firebase from "firebase/app";
import "firebase/database";

declare global {
  interface Window {
    db: firebase.database.Database;
    playerID: string | null;
    generateUniqueID: (prefix: string) => string;
    fetchGemini: () => Promise<string>;
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyDRhBcfD2KU6RVBmjLDQJ6YkPk3apsN9NM",
  authDomain: "bit-5baab.firebaseapp.com",
  databaseURL: "https://bit-5baab-default-rtdb.firebaseio.com",
  projectId: "bit-5baab",
  storageBucket: "bit-5baab.appspot.com",
  messagingSenderId: "430682381960",
  appId: "1:430682381960:web:257bbed7f50389e587c93d",
  measurementId: "G-LFY7HWDF5Z"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db: firebase.database.Database = firebase.database();

async function fetchGemini(): Promise<string> {
  try {
    const response = await fetch('http://localhost:5000/get-quiz');
    const data = await response.json();
    return data.question as string;
  } catch (error) {
    console.error("Backend not running:", error);
    return "Error loading question.";
  }
}

function generateUniqueID(prefix: string): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${random}`;
}

const playerID: string | null = localStorage.getItem("playerID");

window.db = db;
window.playerID = playerID;
window.generateUniqueID = generateUniqueID;
window.fetchGemini = fetchGemini;