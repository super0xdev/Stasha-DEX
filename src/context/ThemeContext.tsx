import React, { useState, createContext, useContext, FC, ReactNode } from 'react';

type Theme = 'dark' | 'light';
interface IThemeContext {
    theme: Theme;
    setTheme: (value: Theme) => void;
}

const ThemeContext = createContext<IThemeContext>({
    theme: 'dark',
    setTheme: () => { },
});

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const T_KEY = 'theme';
    const getInitialTheme = (): Theme => {
        return localStorage.getItem(T_KEY) as Theme ?? 'dark';
    };
    const [theme, setTheme] = useState<Theme>(getInitialTheme());

    const handleTheme = (value: Theme) => {
        localStorage.setItem(T_KEY, value);
        setTheme(value);
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme: handleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): IThemeContext => useContext<IThemeContext>(ThemeContext);