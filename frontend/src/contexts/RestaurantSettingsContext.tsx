import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { API_BASE_URL } from '@/config';

export interface RestaurantSettings {
  id: number;
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  enableNotifications: boolean;
  enableSounds: boolean;
  autoPrintBills: boolean;
  enableUPI: boolean;
  enableCash: boolean;
  updatedAt: string;
}

const defaultRestaurantSettings: RestaurantSettings = {
  id: 0,
  restaurantName: 'Restaurant',
  address: '',
  phone: '',
  email: '',
  enableNotifications: true,
  enableSounds: true,
  autoPrintBills: false,
  enableUPI: true,
  enableCash: true,
  updatedAt: new Date().toISOString(),
};

interface RestaurantSettingsContextType {
  settings: RestaurantSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  setSettings: (settings: RestaurantSettings) => void;
}

const RestaurantSettingsContext = createContext<
  RestaurantSettingsContextType | undefined
>(undefined);

export function RestaurantSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<RestaurantSettings>(
    defaultRestaurantSettings,
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  return (
    <RestaurantSettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings,
        setSettings,
      }}
    >
      {children}
    </RestaurantSettingsContext.Provider>
  );
}

export function useRestaurantSettings() {
  const context = useContext(RestaurantSettingsContext);
  if (!context) {
    throw new Error(
      'useRestaurantSettings must be used within RestaurantSettingsProvider',
    );
  }
  return context;
}
