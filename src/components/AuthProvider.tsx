'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && ['ar', 'en', 'fr'].includes(savedLang)) {
      setLang(savedLang);
      setT(getTranslations(savedLang));
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setT(getTranslations(newLang));
    localStorage.setItem('lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
    if (isRTL(newLang)) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={isRTL(lang) ? 'rtl' : ''}>
      <Navbar
        t={t}
        currentLang={lang}
        isRtl={isRTL(lang)}
        onLanguageChange={handleLanguageChange}
      />
      <div className="container-fluid py-4">
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage(null)}
            />
          </div>
        )}
        {typeof children === 'function'
          ? (children as any)({ t, lang, isRtl: isRTL(lang), showMessage })
          : children}
      </div>
    </div>
  );
}
