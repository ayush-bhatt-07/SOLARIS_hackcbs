import { createContext } from 'react';
import type { AppContextType } from './AppContext';

// Keep the context identity stable when Vite refreshes the provider or hook.
export const AppContext = createContext<AppContextType | undefined>(undefined);
