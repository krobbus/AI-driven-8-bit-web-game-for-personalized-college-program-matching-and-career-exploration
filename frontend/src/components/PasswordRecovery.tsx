import React, { useState, useEffect, useRef } from 'react';
import type { ModalProps } from '../types/props';
import { db } from '../config/firebase';
import '../../styles/Modal.css';
import '../../styles/PasswordRecovery.css';

type Step = 1 | 2 | 3 | 4;
const totalSteps = 4;

interface FpMessage {
  text: string;
  color: string;
}

const isEmailValid = (val: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
const isPinValid = (val: string) => /^\d{4}$/.test(val);
const isPassValid = (val: string) => /^(?=.*[a-zA-Z])(?=.*[0-9]).{5,15}$/.test(val);

const PasswordRecovery: React.FC<ModalProps> = ({ isOpen, onClose }) => { 
    const [step, setStep] = useState<Step>(1);
    const [playerID, setPlayerID] = useState('');
    const [correctPIN, setCorrectPIN] = useState('');
    
    const [emailIdInput, setEmailIdInput] = useState('');
    const isEmailMode = emailIdInput.trim().includes('@'); 
    const [pinInput, setPinInput] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
    const [message, setMessage] = useState<FpMessage | null>(null);
    const [done, setDone] = useState(false);
    const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const passValid = isPassValid(newPass);
    const confirmValid = newPass === confirmPass && confirmPass.length > 0;

    useEffect(() => {
        if (window.game?.input?.keyboard){
            isOpen ? window.game.input.keyboard.stopListeners() : window.game.input.keyboard.startListeners();
        }
        return () => window.game?.input?.keyboard?.startListeners();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setPlayerID('');
            setCorrectPIN('');
            setEmailIdInput('');
            setVerifying(false);
            setVerifyResult('idle');
            setPinInput('');
            setNewPass('');
            setConfirmPass('');
            setShowPin(false);
            setShowPass(false);
            setShowConfirm(false);
            setMessage(null);
            setDone(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    function showMsg(text: string, color: string) {
        if (messageTimer.current) clearTimeout(messageTimer.current);
        setMessage({ text, color });
        messageTimer.current = setTimeout(() => setMessage(null), 2500);
    }

    function handleProceedToVerify() {
        const val = emailIdInput.trim();

        if (!val) {
            showMsg('Please enter your Player ID or Email.', 'red');
            return;
        }

        if (isEmailMode && !isEmailValid(val)) {
            showMsg('Please use a valid email (example@email.com)', 'red');
            return;
        }

        setVerifyResult('idle');
        setStep(2);
    }

    async function handleVerifyAccount() {
        setVerifying(true);
        setVerifyResult('checking');
 
        const val = emailIdInput.trim();
 
        try {
            let data: any = null;
            let resolvedID: any = {};
 
            if (isEmailMode) {
                const emailQuery = await db.ref('webGame')
                    .orderByChild('email')
                    .equalTo(val)
                    .once('value');
 
                if (emailQuery.exists()) {
                    const results = emailQuery.val();
                    resolvedID = Object.keys(results)[0];
                    data = results[resolvedID];
                }
            } else {
                const idSnapshot = await db.ref(`webGame/${val}`).once('value');
                if (idSnapshot.exists()) {
                    data       = idSnapshot.val();
                    resolvedID = val;
                }
            }
 
            if (!data) {
                setVerifyResult('fail');
                showMsg('Account not found.', 'red');
                return;
            }
 
            setVerifyResult('ok');
            setPlayerID(resolvedID);
            setCorrectPIN(String(data.pin));
            showMsg('Account found! Proceeding...', '#cdff77');
            setTimeout(() => setStep(3), 700);
        } catch {
            setVerifyResult('fail');
            showMsg('Error connecting to database.', '#ff9090');
        } finally {
            setVerifying(false);
        }
    }

    function handleVerifyPIN() {
        if (!isPinValid(pinInput)) {
            showMsg('Requires exactly 4 digits.', '#ff9090');
            return;
        }

        if (pinInput !== correctPIN) {
            showMsg('Incorrect PIN.', '#ff9090');
            return;
        }

        showMsg('PIN verified! Proceeding...', '#cdff77');
        setTimeout(() => setStep(4), 700);
    }

    async function handleSavePassword() {
        if (!isPassValid(newPass)) {
            showMsg('Must be 5-15 alphanumeric characters [a-Z, 0-9]', '#ff9090');
            return;
        }
        if (newPass !== confirmPass) {
            showMsg('Passwords must match.', '#ff9090');
            return;
        }
        try {
            await db.ref(`webGame/${playerID}/pass`).set(newPass);
            setDone(true);
        } catch {
            showMsg('Failed to save password.', '#ff9090');
        }
    }

    function handleKeyDown(e: React.KeyboardEvent, action: () => void) { if (e.key === 'Enter') action(); }

    const emailIdHint = () => {
        const val = emailIdInput.trim();
        if (!val) return 'Enter your Player ID (e.g. example_1234) or Email (e.g. example@email.com)';
        
        if (isEmailMode) {
            return isEmailValid(val) ? 'Email verified!' : 'Please use a valid email (e.g. example@email.com)';
        }

        return 'Input entered. Press Continue to verify.';
    };
 
    const emailIdHintColor = () => {
        const val = emailIdInput.trim();
        if (!val) return '#454545';
        if (isEmailMode) return isEmailValid(val) ? '#cdff77' : '#ff9090';
        return '#fec564';
    };
 
    const StepIndicator = () => (
        <div className="fpSteps">
            {Array.from({ length: totalSteps }, (_, i) => {
                const num = i + 1;

                return (
                    <React.Fragment key={num}>
                        <div className={`fpStep ${step >= num ? 'active' : ''} ${step > num ? 'done' : ''}`}>
                            {step > num ? '✓' : num}
                        </div>

                        {num < totalSteps && <div className={`fpStepLine ${step > num ? 'done' : ''}`} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
 
    const MessageBanner = () => message ? (<p className="fpMessage" style={{ color: message.color }}>{message.text}</p>) : null;

    return(
        <div className="modalBackdrop">
            <div className="modalContainer">
                <div className="modalContent">
                    <button id="closeButton" onClick={onClose}>X</button>
                    
                    <section className="passwordRecoveryContainer">
                        <h1 id="mainTitle">PASSWORD RECOVERY</h1>
                        <StepIndicator />

                        {done ? (
                            <div className="fpSuccess">
                                <h3>PASSWORD UPDATED!</h3>
                                <p>Your password has been reset successfully.</p>
                                <button className="fpBtn" onClick={onClose}>Close</button>
                            </div>
                        ) : step === 1 ? (
                            <div className="fpStepContent">
                                <label className="mainHeader">RECOVER PASSWORD</label>
                                <p className="subHeader">Enter your Player ID and registered email</p>
                
                                <input
                                    className="fpInput"
                                    type="text"
                                    placeholder="Enter your Player ID or Email..."
                                    value={emailIdInput}
                                    onChange={e => setEmailIdInput(e.target.value)}
                                    onKeyDown={e => handleKeyDown(e, handleProceedToVerify)}
                                />
 
                                <p className="fpHint" style={{ color: emailIdHintColor() }}>
                                    {emailIdHint()}
                                </p>
                
                                <button className="fpBtn" onClick={handleProceedToVerify}>Continue</button>
                                <MessageBanner />
                            </div>
                        ) : step === 2 ? (
                            <div className="fpStepContent">
                                <label className="mainHeader">VERIFYING ACCOUNT</label>
                                <p className="subHeader">Looking up account by {isEmailMode ? 'email' : 'player ID'}</p>
                
                                <div className={`fpVerifyCard ${verifyResult}`}>
                                    <div className="fpVerifyRow">
                                        <span className="fpVerifyLabel">
                                            {isEmailMode ? 'Email' : 'Player ID'}
                                        </span>
                                        <span className="fpVerifyValue">{emailIdInput}</span>
                                    </div>

                                    <div className="fpVerifyRow">
                                        <span className="fpVerifyLabel">Method</span>
                                        <span className="fpVerifyValue">
                                            {isEmailMode ? 'Email lookup' : 'Direct ID lookup'}
                                        </span>
                                    </div>

                                    <div className="fpVerifyStatus">
                                        {verifyResult === 'idle' && <span className="fpStatusIdle">Waiting to verify...</span>}
                                        {verifyResult === 'checking' && <span className="fpStatusChecking">Checking...</span>}
                                        {verifyResult === 'ok' && <span className="fpStatusOk">Account found!</span>}
                                        {verifyResult === 'fail' && <span className="fpStatusFail">Verification failed</span>}
                                    </div>
                                </div>
                
                                <div className="fpVerifyActions">
                                    <button className="fpBtnSecondary"
                                        onClick={() => { setVerifyResult('idle'); setStep(1); }}
                                    >
                                        Back
                                    </button>

                                    <button className="fpBtn" onClick={handleVerifyAccount} disabled={verifying}>
                                        {verifying ? 'Verifying...' : 'Verify Account'}
                                    </button>
                                </div>

                                <MessageBanner />
                            </div>
                        ) : step === 3 ? (
                            <div className="fpStepContent">
                                <label className="mainHeader">VERIFY PIN</label>
                                <p className="subHeader">Enter the 4-digit PIN for this account</p>
                
                                <div className="fpInputRow">
                                    <input className="fpInput"
                                        type={showPin ? 'text' : 'password'}
                                        maxLength={4}
                                        placeholder="Enter your 4-digit PIN..."
                                        value={pinInput}
                                        onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                                        onKeyDown={e => handleKeyDown(e, handleVerifyPIN)}
                                    />

                                    <button className="fpToggleBtn"
                                        onClick={() => setShowPin(p => !p)}
                                        aria-label="Toggle PIN visibility"
                                    >
                                        <img
                                            src={`assets/WebAssets/Padlock${showPin ? 'Opened' : 'Closed'}.png`}
                                            alt="Show/Hide PIN"
                                        />
                                    </button>
                                </div>

                                <p className="fpHint" style={{
                                        color: isPinValid(pinInput)
                                            ? '#cdff77'
                                            : pinInput.length > 0 ? '#ff9090' : '#454545'
                                    }}>
                                    {isPinValid(pinInput) ? 'PIN valid!' : 'Requires exactly 4 digits'}
                                </p>
                
                                <button className="fpBtn" onClick={handleVerifyPIN}>Verify PIN</button>
                                <MessageBanner />
                            </div>
                        ) : (
                            <div className="fpStepContent">
                                <label className="mainHeader">RESET PASSWORD</label>
                                <p className="subHeader">Enter your new password below</p>
                
                                <div className="fpInputRow">
                                    <input className="fpInput"
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Enter your Password..."
                                        value={newPass}
                                        onChange={e => setNewPass(e.target.value)}
                                        onKeyDown={e => handleKeyDown(e, handleSavePassword)}
                                    />

                                    <button className="fpToggleBtn"
                                        onClick={() => setShowPass(p => !p)}
                                        aria-label="Toggle password visibility"
                                    >
                                        <img
                                            src={`assets/WebAssets/Padlock${showPass ? 'Opened' : 'Closed'}.png`}
                                            alt="Show/Hide Password"
                                        />
                                    </button>
                                </div>

                                <p className="fpHint" style={{
                                        color: passValid
                                            ? '#cdff77'
                                            : newPass.length > 0 ? '#ff9090' : '#454545'
                                    }}>
                                    {passValid ? 'Password valid!' : 'Must be 5-15 alphanumeric characters [a-Z, 0-9]'}
                                </p>
                
                                <div className="fpInputRow">
                                    <input className="fpInput"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Re-enter your Password..."
                                        value={confirmPass}
                                        onChange={e => setConfirmPass(e.target.value)}
                                        onKeyDown={e => handleKeyDown(e, handleSavePassword)}
                                    />
                                    
                                    <button className="fpToggleBtn"
                                        onClick={() => setShowConfirm(p => !p)}
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        <img
                                            src={`assets/WebAssets/Padlock${showConfirm ? 'Opened' : 'Closed'}.png`}
                                            alt="Show/Hide Password"
                                        />
                                    </button>
                                </div>

                                <p className="fpHint" style={{
                                        color: newPass !== confirmPass
                                            ? '#ff9090'
                                            : confirmPass.length > 0 ? '#cdff77' : '#454545'
                                    }}>
                                    {confirmValid ? 'Passwords match!' : 'Passwords must match'}
                                </p>
                
                                <button className="fpBtn" onClick={handleSavePassword}>Save Password</button>
                                <MessageBanner />
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PasswordRecovery;