'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Translations, Language } from '@/lib/translations';

interface NavbarProps {
  t: Translations;
  currentLang: Language;
  isRtl: boolean;
  onLanguageChange: (lang: Language) => void;
}

export default function Navbar({ t, currentLang, isRtl, onLanguageChange }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand">
          <i className="bi bi-car-front-fill"></i> {t.app_name}
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              >
                <i className="bi bi-speedometer2"></i> {t.dashboard}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/cars"
                className={`nav-link ${pathname === '/cars' ? 'active' : ''}`}
              >
                <i className="bi bi-car-front"></i> {t.cars}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/clients"
                className={`nav-link ${pathname === '/clients' ? 'active' : ''}`}
              >
                <i className="bi bi-people"></i> {t.clients}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/rentals"
                className={`nav-link ${pathname === '/rentals' ? 'active' : ''}`}
              >
                <i className="bi bi-calendar-check"></i> {t.rentals}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/expenses"
                className={`nav-link ${pathname === '/expenses' ? 'active' : ''}`}
              >
                <i className="bi bi-cash-stack"></i> {t.expenses}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/profits"
                className={`nav-link ${pathname === '/profits' ? 'active' : ''}`}
              >
                <i className="bi bi-graph-up-arrow"></i> {t.profits}
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="langDropdown"
                role="button"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-globe"></i> {t.language}
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className={`dropdown-item ${currentLang === 'ar' ? 'active' : ''}`}
                    onClick={() => onLanguageChange('ar')}
                  >
                    {t.arabic}
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${currentLang === 'en' ? 'active' : ''}`}
                    onClick={() => onLanguageChange('en')}
                  >
                    {t.english}
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${currentLang === 'fr' ? 'active' : ''}`}
                    onClick={() => onLanguageChange('fr')}
                  >
                    {t.french}
                  </button>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <i className="bi bi-box-arrow-right"></i> {t.logout}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
