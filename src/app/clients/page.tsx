'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Client {
  _id: string;
  full_name: string;
  passport_id: string;
  driving_license: string;
  passport_image?: string;
  license_image?: string;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ full_name: '', passport_id: '', driving_license: '' });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
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
    if (session) fetchClients();
  }, [session]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
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

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.filename;
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let passport_image = null;
      let license_image = null;

      if (passportFile) {
        passport_image = await uploadFile(passportFile);
      }
      if (licenseFile) {
        license_image = await uploadFile(licenseFile);
      }

      if (editingClient) {
        await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClient._id, ...formData }),
        });
      } else {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, passport_image, license_image }),
        });
      }
      showMessage_('success', t.success);
      setShowModal(false);
      setEditingClient(null);
      setFormData({ full_name: '', passport_id: '', driving_license: '' });
      setPassportFile(null);
      setLicenseFile(null);
      fetchClients();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchClients();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({ full_name: client.full_name, passport_id: client.passport_id, driving_license: client.driving_license });
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
          <h2><i className="bi bi-people"></i> {t.clients}</h2>
          <button className="btn btn-primary" onClick={() => { setEditingClient(null); setFormData({ full_name: '', passport_id: '', driving_license: '' }); setShowModal(true); }}>
            <i className="bi bi-plus-circle"></i> {t.add_client}
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            {clients.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>{t.full_name}</th>
                      <th>{t.passport_id}</th>
                      <th>{t.driving_license}</th>
                      <th>{t.passport_image}</th>
                      <th>{t.license_image}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, index) => (
                      <tr key={client._id}>
                        <td>{index + 1}</td>
                        <td>{client.full_name}</td>
                        <td><code>{client.passport_id}</code></td>
                        <td><code>{client.driving_license}</code></td>
                        <td>
                          {client.passport_image ? (
                            <a href={`/uploads/documents/${client.passport_image}`} target="_blank" className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye"></i> {t.view_document}
                            </a>
                          ) : (
                            <span className="text-muted">{t.no_image}</span>
                          )}
                        </td>
                        <td>
                          {client.license_image ? (
                            <a href={`/uploads/documents/${client.license_image}`} target="_blank" className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye"></i> {t.view_document}
                            </a>
                          ) : (
                            <span className="text-muted">{t.no_image}</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button onClick={() => openEditModal(client)} className="btn btn-outline-secondary" title={t.edit}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => handleDelete(client._id)} className="btn btn-outline-danger">
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
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingClient ? `${t.edit} - ${editingClient.full_name}` : t.add_client}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.full_name}</label>
                        <input type="text" className="form-control" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.passport_id}</label>
                        <input type="text" className="form-control" value={formData.passport_id} onChange={(e) => setFormData({ ...formData, passport_id: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.driving_license}</label>
                      <input type="text" className="form-control" value={formData.driving_license} onChange={(e) => setFormData({ ...formData, driving_license: e.target.value })} required />
                    </div>
                    {!editingClient && (
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t.passport_image}</label>
                          <input type="file" className="form-control" accept="image/*" onChange={(e) => setPassportFile(e.target.files?.[0] || null)} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t.license_image}</label>
                          <input type="file" className="form-control" accept="image/*" onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} />
                        </div>
                      </div>
                    )}
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
