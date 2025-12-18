'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Notification {
  type: string;
  rental: {
    start_date: string;
    return_date: string;
    model: string;
    plate_number: string;
    full_name: string;
  };
  severity: string;
}

interface DashboardData {
  carStats: {
    total: number;
    available: number;
    rented: number;
    reserved: number;
  };
  totalExpenses: number;
  totalRevenue: number;
  totalProfit: number;
  notifications: Notification[];
  username: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && ['ar', 'en', 'fr'].includes(savedLang)) {
      setLang(savedLang);
      setT(getTranslations(savedLang));
      document.documentElement.lang = savedLang;
      document.documentElement.dir = isRTL(savedLang) ? 'rtl' : 'ltr';
      if (isRTL(savedLang)) {
        document.body.classList.add('rtl');
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (status === 'loading' || loading) {
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
    <>
      <Navbar t={t} currentLang={lang} isRtl={isRTL(lang)} onLanguageChange={handleLanguageChange} />
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i className="bi bi-speedometer2 text-primary"></i> {t.dashboard}
          </h2>
          <span className="text-muted">
            {t.welcome}, <strong>{data?.username || session.user?.name}</strong>
          </span>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 stat-card">
              <div className="card-body text-center py-4">
                <div className="stat-icon bg-primary bg-gradient rounded-circle mx-auto mb-3">
                  <i className="bi bi-car-front-fill text-white"></i>
                </div>
                <h2 className="fw-bold mb-1">{data?.carStats.total || 0}</h2>
                <p className="text-muted mb-0 small">{t.total_cars}</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 stat-card">
              <div className="card-body text-center py-4">
                <div className="stat-icon bg-success bg-gradient rounded-circle mx-auto mb-3">
                  <i className="bi bi-check-circle-fill text-white"></i>
                </div>
                <h2 className="fw-bold text-success mb-1">{data?.carStats.available || 0}</h2>
                <p className="text-muted mb-0 small">{t.available}</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 stat-card">
              <div className="card-body text-center py-4">
                <div className="stat-icon bg-warning bg-gradient rounded-circle mx-auto mb-3">
                  <i className="bi bi-hourglass-split text-white"></i>
                </div>
                <h2 className="fw-bold text-warning mb-1">{data?.carStats.reserved || 0}</h2>
                <p className="text-muted mb-0 small">{t.reserved}</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 stat-card">
              <div className="card-body text-center py-4">
                <div className="stat-icon bg-info bg-gradient rounded-circle mx-auto mb-3">
                  <i className="bi bi-key-fill text-white"></i>
                </div>
                <h2 className="fw-bold text-info mb-1">{data?.carStats.rented || 0}</h2>
                <p className="text-muted mb-0 small">{t.rented}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="stat-icon-lg bg-danger bg-opacity-10 rounded-3 p-3">
                      <i className="bi bi-cash-coin text-danger" style={{ fontSize: '2rem' }}></i>
                    </div>
                  </div>
                  <div className={`flex-grow-1 ${isRTL(lang) ? 'me-3' : 'ms-3'}`}>
                    <p className="text-muted mb-1 small">{t.total_expenses}</p>
                    <h3 className="fw-bold text-danger mb-0">
                      {(data?.totalExpenses || 0).toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="stat-icon-lg bg-secondary bg-opacity-10 rounded-3 p-3">
                      <i className="bi bi-wallet2 text-secondary" style={{ fontSize: '2rem' }}></i>
                    </div>
                  </div>
                  <div className={`flex-grow-1 ${isRTL(lang) ? 'me-3' : 'ms-3'}`}>
                    <p className="text-muted mb-1 small">{t.total_revenue}</p>
                    <h3 className="fw-bold text-secondary mb-0">
                      {(data?.totalRevenue || 0).toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`stat-icon-lg ${(data?.totalProfit || 0) >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 rounded-3 p-3`}
                    >
                      <i
                        className={`bi bi-graph-up-arrow ${(data?.totalProfit || 0) >= 0 ? 'text-success' : 'text-danger'}`}
                        style={{ fontSize: '2rem' }}
                      ></i>
                    </div>
                  </div>
                  <div className={`flex-grow-1 ${isRTL(lang) ? 'me-3' : 'ms-3'}`}>
                    <p className="text-muted mb-1 small">{t.total_profit}</p>
                    <h3
                      className={`fw-bold ${(data?.totalProfit || 0) >= 0 ? 'text-success' : 'text-danger'} mb-0`}
                    >
                      {(data?.totalProfit || 0).toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <div className="d-flex align-items-center">
              <i className="bi bi-bell-fill text-primary me-2" style={{ fontSize: '1.25rem' }}></i>
              <h5 className="mb-0 fw-semibold">{t.notifications}</h5>
              {data?.notifications && data.notifications.length > 0 && (
                <span className={`badge bg-danger rounded-pill ${isRTL(lang) ? 'me-2' : 'ms-2'}`}>
                  {data.notifications.length}
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            {data?.notifications && data.notifications.length > 0 ? (
              <div className="list-group list-group-flush">
                {data.notifications.map((notif, index) => (
                  <div key={index} className="list-group-item border-0 px-0 py-3">
                    <div className="d-flex align-items-start">
                      <div className="flex-shrink-0">
                        {notif.type === 'start_today' && (
                          <div className="notification-icon bg-warning bg-opacity-10 rounded-circle">
                            <i className="bi bi-calendar-event-fill text-warning"></i>
                          </div>
                        )}
                        {notif.type === 'start_tomorrow' && (
                          <div className="notification-icon bg-info bg-opacity-10 rounded-circle">
                            <i className="bi bi-calendar-plus-fill text-info"></i>
                          </div>
                        )}
                        {notif.type === 'return_today' && (
                          <div className="notification-icon bg-primary bg-opacity-10 rounded-circle">
                            <i className="bi bi-calendar-check-fill text-primary"></i>
                          </div>
                        )}
                        {notif.type === 'overdue' && (
                          <div className="notification-icon bg-danger bg-opacity-10 rounded-circle">
                            <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                          </div>
                        )}
                      </div>
                      <div className={`flex-grow-1 ${isRTL(lang) ? 'me-3' : 'ms-3'}`}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong
                            className={
                              notif.type === 'overdue'
                                ? 'text-danger'
                                : notif.type === 'start_today'
                                  ? 'text-warning'
                                  : notif.type === 'return_today'
                                    ? 'text-primary'
                                    : 'text-info'
                            }
                          >
                            {notif.type === 'start_today' && t.start_today}
                            {notif.type === 'start_tomorrow' && t.start_tomorrow}
                            {notif.type === 'return_today' && t.return_today}
                            {notif.type === 'overdue' && t.overdue}
                          </strong>
                          <span className="badge bg-light text-dark">
                            <i className="bi bi-calendar3"></i> {notif.rental.start_date} &rarr;{' '}
                            {notif.rental.return_date}
                          </span>
                        </div>
                        <p className="mb-0 text-muted">
                          <i className="bi bi-car-front"></i> {notif.rental.model}{' '}
                          <span className="text-secondary">({notif.rental.plate_number})</span>
                          <span className="mx-1">|</span>
                          <i className="bi bi-person"></i> {notif.rental.full_name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                </div>
                <p className="text-muted mb-0">{t.no_notifications}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
