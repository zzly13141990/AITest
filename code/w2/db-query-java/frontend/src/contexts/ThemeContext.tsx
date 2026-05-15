import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'system';

// ThemeContext的类型定义
interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDarkMode: boolean;
}

// 存储键
const THEME_STORAGE_KEY = 'db-query-theme';

// 创建Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 自定义Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 获取系统主题
const getSystemTheme = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// 从localStorage获取保存的主题
const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'system';
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.error('Failed to get theme from localStorage:', error);
  }
  return 'system';
};

// 保存主题到localStorage
const setStoredTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error);
  }
};

// Provider组件
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const initialTheme = getStoredTheme();
    return initialTheme === 'dark' || (initialTheme === 'system' && getSystemTheme());
  });

  // 应用主题到document
  const applyTheme = (dark: boolean) => {
    if (typeof document === 'undefined') {
      return;
    }
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // 设置主题
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  };

  // 监听主题变化并更新isDarkMode
  useEffect(() => {
    let dark = false;
    if (theme === 'dark') {
      dark = true;
    } else if (theme === 'system') {
      dark = getSystemTheme();
    }
    setIsDarkMode(dark);
    applyTheme(dark);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const dark = e.matches;
        setIsDarkMode(dark);
        applyTheme(dark);
      }
    };

    // 使用兼容方式添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleSystemThemeChange);
      }
    };
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
