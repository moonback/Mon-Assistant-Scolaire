import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Configuration pour l'accessibilité DYS et TDAH
 */
export interface AccessibilityConfig {
    dyslexicFont: boolean;
    readingRuler: boolean;
    highContrast: boolean;
    fontSizeScale: number; // 1.0, 1.2, 1.5
    reduceMotion: boolean;
    speechRate: number; // 0.8 to 1.5
}

interface AccessibilityContextType extends AccessibilityConfig {
    setDyslexicFont: (enabled: boolean) => void;
    setReadingRuler: (enabled: boolean) => void;
    setHighContrast: (enabled: boolean) => void;
    setFontSizeScale: (scale: number) => void;
    setReduceMotion: (enabled: boolean) => void;
    setSpeechRate: (rate: number) => void;
    resetToDefault: () => void;
}

const DEFAULT_CONFIG: AccessibilityConfig = {
    dyslexicFont: false,
    readingRuler: false,
    highContrast: false,
    fontSizeScale: 1.0,
    reduceMotion: false,
    speechRate: 1.0,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AccessibilityConfig>(() => {
        const saved = localStorage.getItem('accessibility_settings');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    useEffect(() => {
        localStorage.setItem('accessibility_settings', JSON.stringify(config));

        // Application des classes globales au body
        const body = document.body;

        // Font Dyslexique
        if (config.dyslexicFont) {
            body.classList.add('font-dys');
        } else {
            body.classList.remove('font-dys');
        }

        // Haut Contraste
        if (config.highContrast) {
            body.classList.add('high-contrast');
        } else {
            body.classList.remove('high-contrast');
        }

        // Taille de police
        body.style.fontSize = `${config.fontSizeScale * 100}%`;

        // Réduction de mouvement
        if (config.reduceMotion) {
            body.classList.add('reduce-motion');
        } else {
            body.classList.remove('reduce-motion');
        }

    }, [config]);

    const setDyslexicFont = (enabled: boolean) => setConfig(prev => ({ ...prev, dyslexicFont: enabled }));
    const setReadingRuler = (enabled: boolean) => setConfig(prev => ({ ...prev, readingRuler: enabled }));
    const setHighContrast = (enabled: boolean) => setConfig(prev => ({ ...prev, highContrast: enabled }));
    const setFontSizeScale = (scale: number) => setConfig(prev => ({ ...prev, fontSizeScale: scale }));
    const setReduceMotion = (enabled: boolean) => setConfig(prev => ({ ...prev, reduceMotion: enabled }));
    const setSpeechRate = (rate: number) => setConfig(prev => ({ ...prev, speechRate: rate }));

    const resetToDefault = () => setConfig(DEFAULT_CONFIG);

    return (
        <AccessibilityContext.Provider
            value={{
                ...config,
                setDyslexicFont,
                setReadingRuler,
                setHighContrast,
                setFontSizeScale,
                setReduceMotion,
                setSpeechRate,
                resetToDefault
            }}
        >
            {children}
            {config.readingRuler && <ReadingRuler />}
        </AccessibilityContext.Provider>
    );
};

/**
 * Composant interne pour la règle de lecture
 */
const ReadingRuler: React.FC = () => {
    const [mousePos, setMousePos] = useState({ y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                top: mousePos.y - 15,
                height: '30px',
                backgroundColor: 'rgba(255, 255, 0, 0.2)',
                borderTop: '2px solid rgba(255, 255, 0, 0.5)',
                borderBottom: '2px solid rgba(255, 255, 0, 0.5)',
                pointerEvents: 'none',
                zIndex: 9999,
                mixBlendMode: 'multiply'
            }}
        />
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};
