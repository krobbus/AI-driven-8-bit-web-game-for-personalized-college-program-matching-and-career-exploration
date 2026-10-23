import firebase from 'firebase/app';
import { db } from '../config/firebase';

export interface PlayerData {
    email: string;
    playerID: string;
    name: string;
    pass: string;
    pin: string;
    gender: 'Male' | 'Female';
    temporary: boolean;
    adminMode: boolean;
    playerMode: boolean;
    lastActive: number;
    savedAt: number;
    joinedAt: number;
    courses: any[]; 
    scores: Record<string, number>;
    comment: string;
}

declare global {
    interface Window {
        updatePlayerData: (data: Partial<PlayerData>) => Promise<void>;
        getPlayerData: (callback: (data: PlayerData | null) => void) => void;
        removePlayerData: () => Promise<void>;
        convertToPermanent: (userInfo: Partial<PlayerData>) => Promise<void>;
        isAdminMode: (callback: (isAdmin: boolean) => void) => void;
    }
}

const getPlayerID = (): string | null => {
    return localStorage.getItem("playerID");
};

export function updatePlayerData(data: Partial<PlayerData>): Promise<void> {
    const playerID = getPlayerID();
    if (!playerID) return Promise.reject("No playerID found");
    return db.ref(`webGame/${playerID}`).update(data);
}

export function getPlayerData(callback: (data: PlayerData | null) => void): void {
    const playerID = getPlayerID();
    if (!playerID) return callback(null);

    db.ref(`webGame/${playerID}`).on("value", (snapshot: firebase.database.DataSnapshot) => {
        callback(snapshot.val() as PlayerData | null);
    });
}

export function removePlayerData(): Promise<void> {
    const playerID = getPlayerID();
    if (!playerID) return Promise.reject("No playerID found");
    return db.ref(`webGame/${playerID}`).remove();
}

export function convertToPermanent(userInfo: Partial<PlayerData>): Promise<void> {
    const playerID = getPlayerID();
    if (!playerID) return Promise.reject("No playerID found");

    return db.ref(`webGame/${playerID}`).update({
        ...userInfo,
        temporary: false,
        savedAt: Date.now()
    });
}

export function isAdminMode(callback: (isAdmin: boolean) => void): void {
    const sEmail = getPlayerID();
    if (!sEmail) {
        callback(false);
        return;
    }

    db.ref(`webGame/${sEmail}/adminMode`).once("value")
        .then((snapshot: firebase.database.DataSnapshot) => callback(snapshot.val() === true))
        .catch(() => callback(false));
}

window.updatePlayerData = updatePlayerData;
window.getPlayerData = getPlayerData;
window.removePlayerData = removePlayerData;
window.convertToPermanent = convertToPermanent;
window.isAdminMode = isAdminMode;