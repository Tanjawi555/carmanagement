'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Rental {
  _id: string;
  car_model: string;
  plate_number: string;
  client_name: string;
  start_date: string;
  return_date: string;
  rental_price: number;
  status: 'reserved' | 'rented' | 'returned';
}

interface ProfitData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  rentals: Rental[];
}

export default function ProfitsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [data, setData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && ['ar', 'en', 'fr'].includes(savedLang)) {
      setLang(savedLang);
      setT(getTranslations(savedLang));
      document.documentElement.lang = savedLang;
      document.documentElement.dir = isRTL(savedLang) ? 'rtl' : 'ltr';
      if (isRTL(savedLang)) document.body.classList.add('rtl');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/profits');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch profits:', error);
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
    if (isRTL(newLang)) document.body.classList.add('rtl');
    else document.body.classList.remove('rtl');
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

  if (!session) return null;

  return (
    <>
      <Navbar t={t} currentLang={lang} isRtl={isRTL(lang)} onLanguageChange={handleLanguageChange} />
      <div className="container-fluid py-4">
        <h2 className="mb-4"><i className="bi bi-graph-up-arrow"></i> {t.profit_overview}</h2>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card bg-secondary text-white h-100">
              <div className="card-body text-center">
                <i className="bi bi-wallet2 display-4"></i>
                <h3 className="mt-2">{(data?.totalRevenue || 0).toFixed(2)}</h3>
                <p className="mb-0">{t.revenue}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-danger text-white h-100">
              <div className="card-body text-center">
                <i className="bi bi-cash-stack display-4"></i>
                <h3 className="mt-2">{(data?.totalExpenses || 0).toFixed(2)}</h3>
                <p className="mb-0">{t.total_expenses}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className={`card ${(data?.totalProfit || 0) >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100`}>
              <div className="card-body text-center">
                <i className="bi bi-graph-up-arrow display-4"></i>
                <h3 className="mt-2">{(data?.totalProfit || 0).toFixed(2)}</h3>
                <p className="mb-0">{t.net_profit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0"><i className="bi bi-list-ul"></i> {t.rentals}</h5>
          </div>
          <div className="card-body">
            {data?.rentals && data.rentals.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>{t.car_model}</th>
                      <th>{t.full_name}</th>
                      <th>{t.start_date}</th>
                      <th>{t.return_date}</th>
                      <th>{t.rental_price}</th>
                      <th>{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rentals.map((rental, index) => (
                      <tr key={rental._id}>
                        <td>{index + 1}</td>
                        <td>{rental.car_model} <small className="text-muted">({rental.plate_number})</small></td>
                        <td>{rental.client_name}</td>
                        <td>{rental.start_date}</td>
                        <td>{rental.return_date}</td>
                        <td><strong>{rental.rental_price.toFixed(2)}</strong></td>
                        <td>
                          {rental.status === 'reserved' && <span className="badge bg-warning text-dark">{t.reserved}</span>}
                          {rental.status === 'rented' && <span className="badge bg-info">{t.rented}</span>}
                          {rental.status === 'returned' && <span className="badge bg-success">{t.returned}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center mb-0">{t.no_data}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
