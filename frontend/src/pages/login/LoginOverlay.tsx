import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import '../../services/playerData';
import PasswordRecovery from '../../components/PasswordRecovery';
import Manual from '../../components/Manual';

declare global {
  interface Window {
    passwordRecovery: () => void;
    manual: () => void;
  }
}

const LoginOverlay: React.FC = () => {
    const [isPasswordRecoveryOpen, setIsPasswordRecoveryOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);

    const attachGlobals = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;

        window.passwordRecovery = () => setIsPasswordRecoveryOpen(true);
        window.manual = () => setIsManualOpen(true);
    }, []);

    return (
        <div ref={attachGlobals}>
            <PasswordRecovery
                isOpen={isPasswordRecoveryOpen}
                onClose={() => setIsPasswordRecoveryOpen(false)}
            />

            <Manual
                isOpen={isManualOpen}
                onClose={() => setIsManualOpen(false)}
            />
        </div>
    );
};

const rootElement = document.getElementById('loginModalRoot');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <LoginOverlay />
        </React.StrictMode>
    );
}