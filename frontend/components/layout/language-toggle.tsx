'use client';

import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage } = useTranslation();

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
        'bg-white border border-gray-200 hover:border-primary hover:bg-primary/5',
        className
      )}
      title={language === 'en' ? 'తెలుగులో చూడండి' : 'View in English'}
    >
      <span className={cn(language === 'en' ? 'text-primary' : 'text-gray-400')}>
        EN
      </span>
      <span className="text-gray-300">|</span>
      <span className={cn(language === 'te' ? 'text-primary' : 'text-gray-400')}>
        తె
      </span>
    </button>
  );
}
