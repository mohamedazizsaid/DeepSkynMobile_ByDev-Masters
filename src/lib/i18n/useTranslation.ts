import { useCallback } from 'react';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { translations, type Language, type TranslationKeys } from './translations';

/**
 * Hook that returns the current translation dictionary based on the
 * language selected in the accessibility store.
 *
 * Usage:
 *   const { t, language, setLanguage, isRTL } = useTranslation();
 *   <Text>{t.common.loading}</Text>
 */
export function useTranslation() {
  const language = useAccessibilityStore((s) => s.language) as Language;
  const setLanguage = useAccessibilityStore((s) => s.setLanguage);

  const t: TranslationKeys = translations[language] ?? translations.fr;
  const isRTL = language === 'ar';

  /**
   * Helper for strings that contain placeholders like {count}, {name}, etc.
   * Usage: interpolate(t.dashboard.totalAnalyses, { count: 5 })
   */
  const interpolate = useCallback(
    (template: string, vars: Record<string, string | number>) => {
      let result = template;
      for (const [key, val] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
      }
      return result;
    },
    [],
  );

  return { t, language, setLanguage, isRTL, interpolate };
}
