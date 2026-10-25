import React, { useEffect } from 'react';
import type { ModalProps } from '../types/props';
import '../../styles/Modal.css';
import '../../styles/ProfileSetupHint.css';

const ProfileSetupHint: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (window.game?.input?.keyboard) {
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose} aria-label="Close instructions">X</button>
                    <section className="profileSetupHint">
                        <h1>BEFORE YOU PLAY</h1>
                        <p>
                            Complete your <strong>Profile Creation (Character Creation and Preferences Discovery)</strong> before entering the campus and starting assessments.
                        </p>
                        <img
                            src="assets/Manual/LeftWing.png"
                            alt="Left Wing map showing the ICT Office"
                        />
                        <p>
                            In the Left Wing at 2nd Floor, go directly in front of the window at the <strong>ICT Office</strong> and interact to open Profile Creation.
                        </p>
                        <button className="profileSetupHintContinue" onClick={onClose}>GOT IT</button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetupHint;
