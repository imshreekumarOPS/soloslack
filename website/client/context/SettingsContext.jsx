'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [apiKeys, setApiKeys] = useState({
        openai: '',
        anthropic: '',
        gemini: ''
    });
    const [serverEnv, setServerEnv] = useState({
        MONGODB_URI: '',
        PORT: '5000'
    });
    const [theme, setTheme] = useState('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Load settings from localStorage on mount and fetch server env
    useEffect(() => {
        const savedKeys = localStorage.getItem('notban_api_keys');
        const savedTheme = localStorage.getItem('theme') || 'dark';

        if (savedKeys) {
            try {
                setApiKeys(JSON.parse(savedKeys));
            } catch (e) {
                console.error('Failed to parse saved API keys', e);
            }
        }
        
        setTheme(savedTheme);
        fetchServerEnv();
        setIsLoaded(true);
    }, []);

    const fetchServerEnv = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/env`);
            const data = await res.json();
            if (data.success) {
                setServerEnv(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch server env', err);
        }
    };

    const updateApiKeys = (newKeys) => {
        const updatedKeys = { ...apiKeys, ...newKeys };
        setApiKeys(updatedKeys);
        localStorage.setItem('notban_api_keys', JSON.stringify(updatedKeys));
    };

    const updateServerEnv = async (newEnv) => {
        try {
            const res = await fetch(`${API_BASE}/settings/env`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEnv)
            });
            const data = await res.json();
            if (data.success) {
                setServerEnv(prev => ({ ...prev, ...newEnv }));
                return true;
            }
        } catch (err) {
            console.error('Failed to update server env', err);
            return false;
        }
    };

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        document.documentElement.style.colorScheme = newTheme;
    };

    return (
        <SettingsContext.Provider value={{
            apiKeys,
            updateApiKeys,
            serverEnv,
            updateServerEnv,
            theme,
            updateTheme,
            isLoaded
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
