// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dataStorage } from '../services/dataStorage'; // Adjust import path

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => Promise<void>;
    colors: {
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        textLight: string;
        primary: string;
        border: string;
        error: string;
    };
}

const lightTheme = {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    textLight: '#FFFFFF',
    primary: '#1DB954',
    border: '#E0E0E0',
    error: '#FF3B30',
};

const darkTheme = {
    background: '#000000',
    surface: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textLight: '#FFFFFF',
    primary: '#1DB954',
    border: '#333333',
    error: '#FF453A',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedSettings = await dataStorage.getPreferences();
            if (savedSettings && typeof savedSettings.darkMode === 'boolean') {
                setIsDarkMode(savedSettings.darkMode);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    };

    const toggleDarkMode = async () => {
        try {
            const newDarkMode = !isDarkMode;
            setIsDarkMode(newDarkMode);

            // Save to storage
            const currentSettings = await dataStorage.getPreferences() || {};
            await dataStorage.savePreferences({
                ...currentSettings,
                darkMode: newDarkMode
            });
        } catch (error) {
            console.error('Failed to save theme preference:', error);
            // Revert the change if saving failed
            setIsDarkMode(isDarkMode);
            throw error;
        }
    };

    const colors = isDarkMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}