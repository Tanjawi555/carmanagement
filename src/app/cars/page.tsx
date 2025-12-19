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
  status: 'available' | 'rented' | 'reserved';
  current_rental?: {
    start_date: string;
    return_date: string;
  };
}

export default function CarsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({ model: '', plate_number: '' });
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
    if (session) fetchCars();
  }, [session]);

  const fetchCars = async () => {
    try {
      const res = await fetch('/api/cars');
      if (res.ok) {
        const data = await res.json();
        setCars(data);
      }
    } catch (error) {
      console.error('Failed to fetch cars:', error);
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
      if (editingCar) {
        await fetch('/api/cars', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCar._id, ...formData }),
        });
      } else {
        await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      showMessage_('success', t.success);
      setShowModal(false);
      setEditingCar(null);
      setFormData({ model: '', plate_number: '' });
      fetchCars();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/cars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchCars();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/cars?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchCars();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const openEditModal = (car: Car) => {
    setEditingCar(car);
    setFormData({ model: car.model, plate_number: car.plate_number });
    setShowModal(true);
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
          <h2><i className="bi bi-car-front"></i> {t.cars}</h2>
          <button className="btn btn-primary" onClick={() => { setEditingCar(null); setFormData({ model: '', plate_number: '' }); setShowModal(true); }}>
            <i className="bi bi-plus-circle"></i> {t.add_car}
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            {cars.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>{t.car_model}</th>
                      <th>{t.plate_number}</th>
                      <th>{t.status}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map((car, index) => (
                      <tr key={car._id}>
                        <td>{index + 1}</td>
                        <td>{car.model}</td>
                        <td><code>{car.plate_number}</code></td>
                        <td>
                          {car.status === 'available' && <span className="badge bg-success">{t.available}</span>}
                          {car.status === 'rented' && (
                            <div className="d-flex flex-column align-items-start">
                              <span className="badge bg-info mb-1">{t.rented}</span>
                              {car.current_rental && (
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {car.current_rental.start_date} <i className="bi bi-arrow-right-short"></i> {car.current_rental.return_date}
                                </small>
                              )}
                            </div>
                          )}
                          {car.status === 'reserved' && (
                             <div className="d-flex flex-column align-items-start">
                              <span className="badge bg-warning text-dark mb-1">{t.reserved}</span>
                              {car.current_rental && (
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {car.current_rental.start_date} <i className="bi bi-arrow-right-short"></i> {car.current_rental.return_date}
                                </small>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            {car.status !== 'available' && (
                              <button onClick={() => handleStatusChange(car._id, 'available')} className="btn btn-outline-success" title={t.available}>
                                <i className="bi bi-check-circle"></i>
                              </button>
                            )}
                            {car.status !== 'reserved' && (
                              <button onClick={() => handleStatusChange(car._id, 'reserved')} className="btn btn-outline-warning" title={t.reserved}>
                                <i className="bi bi-clock"></i>
                              </button>
                            )}
                            {car.status !== 'rented' && (
                              <button onClick={() => handleStatusChange(car._id, 'rented')} className="btn btn-outline-info" title={t.rented}>
                                <i className="bi bi-key"></i>
                              </button>
                            )}
                            <button onClick={() => openEditModal(car)} className="btn btn-outline-secondary" title={t.edit}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => handleDelete(car._id)} className="btn btn-outline-danger">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
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
                    <h5 className="modal-title">{editingCar ? `${t.edit} - ${editingCar.model}` : t.add_car}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t.car_model}</label>
                      <input type="text" className="form-control" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.plate_number}</label>
                      <input type="text" className="form-control" value={formData.plate_number} onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })} required />
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
