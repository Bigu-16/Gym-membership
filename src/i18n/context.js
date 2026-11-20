import { createContext, useContext } from 'react';

export const I18nContext = createContext(null);

export const useI18n = () => {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
};
