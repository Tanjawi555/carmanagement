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

interface Client {
  _id: string;
  full_name: string;
}

interface Rental {
  _id: string;
  car_id: string;
  client_id: string;
  car_model: string;
  plate_number: string;
  client_name: string;
  start_date: string;
  return_date: string;
  rental_price: number;
  status: 'reserved' | 'rented' | 'returned';
}

export default function RentalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    car_id: '',
    client_id: '',
    start_date: new Date().toISOString().split('T')[0],
    return_date: new Date().toISOString().split('T')[0],
    rental_price: '',
  });
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
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
      const res = await fetch('/api/rentals');
      if (res.ok) {
        const data = await res.json();
        setRentals(data.rentals);
        setAvailableCars(data.availableCars);
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch rentals:', error);
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
      if (editingRental) {
        await fetch('/api/rentals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRental._id, ...formData }),
        });
      } else {
        await fetch('/api/rentals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      showMessage_('success', t.success);
      setShowModal(false);
      setEditingRental(null);
      setFormData({
        car_id: '',
        client_id: '',
        start_date: new Date().toISOString().split('T')[0],
        return_date: new Date().toISOString().split('T')[0],
        rental_price: '',
      });
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/rentals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/rentals?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental);
    setFormData({
      car_id: rental.car_id, // We need to ensure rental object has car_id and client_id. The interface might need update or we rely on them being there.
      client_id: rental.client_id,
      start_date: rental.start_date,
      return_date: rental.return_date,
      rental_price: rental.rental_price.toString(),
    });
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
          <h2><i className="bi bi-calendar-check"></i> {t.rentals}</h2>
          <button className="btn btn-primary" onClick={() => {
            setEditingRental(null);
            setFormData({
              car_id: '',
              client_id: '',
              start_date: new Date().toISOString().split('T')[0],
              return_date: new Date().toISOString().split('T')[0],
              rental_price: '',
            });
            setShowModal(true);
          }}>
            <i className="bi bi-plus-circle"></i> {t.add_rental}
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            {rentals.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>{t.car_model}</th>
                      <th>{t.full_name}</th>
                      <th>{t.start_date}</th>
                      <th>{t.return_date}</th>
                      <th>{t.rental_price}</th>
                      <th>{t.status}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map((rental, index) => (
                      <tr key={rental._id}>
                        <td>{index + 1}</td>
                        <td>{rental.car_model} <small className="text-muted">({rental.plate_number})</small></td>
                        <td>{rental.client_name}</td>
                        <td>{rental.start_date}</td>
                        <td>{rental.return_date}</td>
                        <td>{rental.rental_price.toFixed(2)}</td>
                        <td>
                          {rental.status === 'reserved' && <span className="badge bg-warning text-dark">{t.reserved}</span>}
                          {rental.status === 'rented' && <span className="badge bg-info">{t.rented}</span>}
                          {rental.status === 'returned' && <span className="badge bg-success">{t.returned}</span>}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            {rental.status === 'reserved' && (
                              <button onClick={() => handleStatusChange(rental._id, 'rented')} className="btn btn-outline-info" title={t.mark_rented}>
                                <i className="bi bi-key"></i>
                              </button>
                            )}
                            {rental.status === 'rented' && (
                              <button onClick={() => handleStatusChange(rental._id, 'returned')} className="btn btn-outline-success" title={t.mark_returned}>
                                <i className="bi bi-check-circle"></i>
                              </button>
                            )}
                            <button onClick={() => handleEdit(rental)} className="btn btn-outline-secondary" title={t.edit}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => handleDelete(rental._id)} className="btn btn-outline-danger" title={t.delete}>
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
                    <h5 className="modal-title">{editingRental ? t.edit : t.add_rental}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t.select_car}</label>
                      <select className="form-select" value={formData.car_id} onChange={(e) => setFormData({ ...formData, car_id: e.target.value })} required>
                        <option value="">-- {t.select_car} --</option>
                        {availableCars.map((car) => (
                          <option key={car._id} value={car._id}>{car.model} ({car.plate_number})</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.select_client}</label>
                      <select className="form-select" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} required>
                        <option value="">-- {t.select_client} --</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>{client.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.start_date}</label>
                        <input type="date" className="form-control" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.return_date}</label>
                        <input type="date" className="form-control" value={formData.return_date} onChange={(e) => setFormData({ ...formData, return_date: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.rental_price}</label>
                      <input type="number" step="0.01" min="0" className="form-control" value={formData.rental_price} onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })} required />
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
