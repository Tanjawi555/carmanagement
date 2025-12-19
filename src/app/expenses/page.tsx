'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Car {
  _id: string;
  model: string;
  plate_number: string;
}

interface Expense {
  _id: string;
  category: string;
  amount: number;
  expense_date: string;
  car_model?: string;
  plate_number?: string;
  description?: string;
}

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'maintenance',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    car_id: '',
    description: '',
  });
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

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
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
        setCars(data.cars);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
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

  const showMessage_ = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      showMessage_('success', t.success);
      setShowModal(false);
      setFormData({
        category: 'maintenance',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        car_id: '',
        description: '',
      });
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'maintenance': return t.maintenance;
      case 'insurance': return t.insurance;
      case 'local': return t.cat_local;
      case 'wifi': return t.cat_wifi;
      case 'orange_network': return t.cat_orange;
      case 'oil_change': return t.cat_oil;
      case 'timing_belt': return t.cat_belt;
      case 'tires': return t.cat_tires;
      case 'tax': return t.cat_tax;
      case 'fuel': return t.fuel; // Keep for backward compatibility mostly
      default: return t.other;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'maintenance': return 'bg-primary';
      case 'insurance': return 'bg-info';
      case 'fuel': return 'bg-warning text-dark';
      case 'local': return 'bg-primary bg-opacity-75';
      case 'wifi': return 'bg-info text-dark';
      case 'orange_network': return 'bg-warning text-dark';
      case 'oil_change': return 'bg-secondary';
      case 'timing_belt': return 'bg-danger';
      case 'tires': return 'bg-dark';
      case 'tax': return 'bg-danger';
      default: return 'bg-secondary';
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

  if (!session) return null;

  return (
    <>
      <Navbar t={t} currentLang={lang} isRtl={isRTL(lang)} onLanguageChange={handleLanguageChange} />
      <div className="container-fluid py-4">
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)} />
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2><i className="bi bi-cash-stack"></i> {t.expenses}</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle"></i> {t.add_expense}
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            {expenses.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>{t.category}</th>
                      <th>{t.amount}</th>
                      <th>{t.date}</th>
                      <th>{t.link_car}</th>
                      <th>{t.description}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense, index) => (
                      <tr key={expense._id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className={`badge ${getCategoryBadgeClass(expense.category)}`}>
                            {getCategoryLabel(expense.category)}
                          </span>
                        </td>
                        <td>{expense.amount.toFixed(2)}</td>
                        <td>{expense.expense_date}</td>
                        <td>
                          {expense.car_model ? (
                            <>{expense.car_model} <small className="text-muted">({expense.plate_number})</small></>
                          ) : (
                            <span className="text-muted">{t.no_car}</span>
                          )}
                        </td>
                        <td>{expense.description || '-'}</td>
                        <td>
                          <button onClick={() => handleDelete(expense._id)} className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
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

        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{t.add_expense}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t.category}</label>
                      <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                        <option value="maintenance">{t.maintenance}</option>
                        <option value="insurance">{t.insurance}</option>
                        <option value="local">{t.cat_local}</option>
                        <option value="wifi">{t.cat_wifi}</option>
                        <option value="orange_network">{t.cat_orange}</option>
                        <option value="oil_change">{t.cat_oil}</option>
                        <option value="timing_belt">{t.cat_belt}</option>
                        <option value="tires">{t.cat_tires}</option>
                        <option value="tax">{t.cat_tax}</option>
                        <option value="other">{t.other}</option>
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.amount}</label>
                        <input type="number" step="0.01" min="0" className="form-control" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.date}</label>
                        <input type="date" className="form-control" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.link_car}</label>
                      <select className="form-select" value={formData.car_id} onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}>
                        <option value="">-- {t.no_car} --</option>
                        {cars.map((car) => (
                          <option key={car._id} value={car._id}>{car.model} ({car.plate_number})</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.description}</label>
                      <textarea className="form-control" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
                    <button type="submit" className="btn btn-primary">{t.save}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
