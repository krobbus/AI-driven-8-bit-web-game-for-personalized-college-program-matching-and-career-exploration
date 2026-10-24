import React, { useEffect, useState } from 'react';
import type { ModalProps } from '../types/props.js';
import { db } from '../config/firebase.js';
import { convertToPermanent, type PlayerData } from '../services/playerData.js';
import '../../styles/Modal.css';
import '../../styles/AccountManagement.css';

type AccountProfile = Partial<PlayerData> & {
    tags?: { type: string }[];
};

const AccountRegistration: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<AccountProfile | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (window.game?.input?.keyboard) {
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let isActive = true;
        const playerID = localStorage.getItem('playerID');
        setLoading(true);
        setFormError(null);

        if (!playerID) {
            setProfile(null);
            setLoading(false);
            setFormError('Complete the required Character and Preferences Creation before registering an account.');
            return () => { isActive = false; };
        }

        db.ref(`webGame/${playerID}`).once('value')
            .then(snapshot => {
                if (!isActive) return;
                const data = snapshot.val() as AccountProfile | null;
                setProfile(data);
                setEmail(data?.email || '');
                setPassword(data?.pass || '');
                setConfirmPassword(data?.pass || '');
                setPin(data?.pin || '');
                setConfirmPin(data?.pin || '');

                const tags = data?.tags || [];
                const hasProfile = Boolean(
                    data?.name &&
                    tags.some(tag => tag.type === 'skill') &&
                    tags.some(tag => tag.type === 'personality') &&
                    data.courses?.length
                );
                if (!hasProfile) {
                    setFormError('Complete the required Character and Preferences Creation before registering an account.');
                }
            })
            .catch(error => {
                console.error('Failed to load account registration data:', error);
                if (isActive) setFormError('Could not load your player profile. Please try again.');
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => { isActive = false; };
    }, [isOpen]);

    const handleSave = async () => {
        setFormError(null);

        const playerID = localStorage.getItem('playerID');
        if (!playerID || !profile) {
            setFormError('Complete the required Character and Preferences Creation before registering an account.');
            return;
        }

        const tags = profile.tags || [];
        const hasProfile = Boolean(
            profile.name &&
            tags.some(tag => tag.type === 'skill') &&
            tags.some(tag => tag.type === 'personality') &&
            profile.courses?.length
        );
        if (!hasProfile) {
            setFormError('Complete the required Character and Preferences Creation before registering an account.');
            return;
        }

        const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
        const isPasswordValid = /^(?=.*[a-zA-Z])(?=.*[0-9]).{5,15}$/.test(password);
        const isPinValid = /^\d{4}$/.test(pin);
        const invalidFields: string[] = [];
        if (!isEmailValid) invalidFields.push('a valid email');
        if (!isPasswordValid) invalidFields.push('a password with 5-15 letters and numbers');
        if (password !== confirmPassword) invalidFields.push('matching passwords');
        if (!isPinValid) invalidFields.push('a 4-digit PIN');
        if (pin !== confirmPin) invalidFields.push('matching PINs');

        if (invalidFields.length) {
            setFormError(`Please provide ${invalidFields.join(', ')}.`);
            return;
        }

        const updatedData: Partial<PlayerData> = {
            ...profile,
            playerID,
            email: email.trim(),
            pass: password,
            pin,
            temporary: false,
            lastActive: Date.now(),
            savedAt: Date.now()
        };

        try {
            await convertToPermanent(updatedData);
            localStorage.setItem('playerData', JSON.stringify(updatedData));
            alert(profile.temporary === false ? 'Account updated successfully!' : 'Account registered successfully!');
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Failed to register account:', error);
            setFormError('Failed to register the account. Please try again.');
        }
    };

    if (!isOpen) return null;

    const emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
    const passwordValid = /^(?=.*[a-zA-Z])(?=.*[0-9]).{5,15}$/.test(password);
    const pinValid = /^\d{4}$/.test(pin);

    return (
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>
                    <section className="accountManagementModal">
                        <h1 id="mainTitle">{profile?.temporary === false ? 'ACCOUNT MANAGEMENT' : 'ACCOUNT REGISTRATION'}</h1>

                        {loading ? (
                            <div className="loadingContainer">
                                <p className="loadingText">LOADING...</p>
                            </div>
                        ) : (
                            <>
                                <div className="instructionContainer">
                                    <label className="mainHeader recommended">INSTRUCTION</label>
                                    <p className="instructions">
                                        Register an account to save your profile and progress between visits. <span className="highlight">CHARACTER CREATION</span> and <span className="highlight">PREFERENCES DISCOVERY</span> must be completed first.
                                    </p>
                                </div>

                                <div className="accountContainer">
                                    <label className="mainHeader">REGISTER ACCOUNT</label>

                                    <div className="emailContainer">
                                        <label className="subHeader">Enter your Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={event => setEmail(event.target.value)}
                                            placeholder="Enter your Email..."
                                        />
                                        <p className="requirementHint" style={{ color: emailValid ? '#cdff77' : email.length > 0 ? '#ff9090' : '#454545' }}>
                                            {emailValid ? 'Email verified!' : 'Please use a valid email (example@email.com)'}
                                        </p>
                                    </div>

                                    <div className="passContainer">
                                        <label className="subHeader">Enter your Password</label>
                                        <div className="passWrapper">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={event => setPassword(event.target.value)}
                                                placeholder="Enter your Password..."
                                            />
                                            <button type="button" className="togglePass" onClick={() => setShowPassword(!showPassword)}>
                                                <img src={`assets/WebAssets/Padlock${showPassword ? 'Opened' : 'Closed'}.png`} alt="Show or hide password" />
                                            </button>
                                        </div>
                                        <p className="requirementHint" style={{ color: passwordValid ? '#cdff77' : password.length > 0 ? '#ff9090' : '#454545' }}>
                                            {passwordValid ? 'Password verified!' : 'Must be 5-15 characters and include letters and numbers'}
                                        </p>
                                    </div>

                                    <div className="confirmPassContainer">
                                        <label className="subHeader">Confirm your Password</label>
                                        <div className="passWrapper">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={event => setConfirmPassword(event.target.value)}
                                                placeholder="Re-enter your Password..."
                                            />
                                            <button type="button" className="toggleConfirmPass" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                <img src={`assets/WebAssets/Padlock${showConfirmPassword ? 'Opened' : 'Closed'}.png`} alt="Show or hide password" />
                                            </button>
                                        </div>
                                        <p className="requirementHint" style={{ color: password !== confirmPassword ? '#ff9090' : confirmPassword.length > 0 ? '#cdff77' : '#454545' }}>
                                            {password === confirmPassword && confirmPassword.length > 0 ? 'Passwords match!' : 'Passwords must match'}
                                        </p>
                                    </div>

                                    <div className="pinLayout">
                                        <div className="pinContainer">
                                            <label className="subHeader">Enter your PIN number</label>
                                            <div className="pinWrapper">
                                                <input
                                                    type={showPin ? 'text' : 'password'}
                                                    value={pin}
                                                    onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    placeholder="Enter your 4-digit PIN..."
                                                    maxLength={4}
                                                />
                                                <button type="button" onClick={() => setShowPin(!showPin)}>
                                                    <img src={`assets/WebAssets/Padlock${showPin ? 'Opened' : 'Closed'}.png`} alt="Show or hide PIN" />
                                                </button>
                                            </div>
                                            <p className="requirementHint" style={{ color: pinValid ? '#cdff77' : pin.length > 0 ? '#ff9090' : '#454545' }}>
                                                {pinValid ? 'PIN verified!' : 'Requires exactly 4 digits'}
                                            </p>
                                        </div>

                                        <div className="confirmPinContainer">
                                            <label className="subHeader">Confirm your PIN number</label>
                                            <div className="confirmPinWrapper">
                                                <input
                                                    type={showConfirmPin ? 'text' : 'password'}
                                                    value={confirmPin}
                                                    onChange={event => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    placeholder="Re-enter your 4-digit PIN..."
                                                    maxLength={4}
                                                />
                                                <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)}>
                                                    <img src={`assets/WebAssets/Padlock${showConfirmPin ? 'Opened' : 'Closed'}.png`} alt="Show or hide PIN" />
                                                </button>
                                            </div>
                                            <p className="requirementHint" style={{ color: pin !== confirmPin ? '#ff9090' : confirmPin.length > 0 ? '#cdff77' : '#454545' }}>
                                                {pin === confirmPin && confirmPin.length > 0 ? 'PINs match!' : 'PINs must match'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {formError && <div className="errorContainer"><p>{formError}</p></div>}
                                <div className="btnWrapper">
                                    <button id="saveButton" onClick={handleSave}>
                                        {profile?.temporary === false ? 'UPDATE ACCOUNT' : 'CREATE ACCOUNT'}
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

export default AccountRegistration;
