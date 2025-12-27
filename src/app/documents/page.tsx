'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Document {
  _id: string;
  client_name: string;
  url: string;
  type: string;
  created_at: string;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    if (status === 'authenticated') {
        const timer = setTimeout(() => {
            fetchDocuments();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [status, search, dateFrom, dateTo]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
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

  const handleDelete = async (url: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
        await fetch(`/api/documents?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
        fetchDocuments();
    } catch (error) {
        console.error('Failed to delete', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!session) return null;

  return (
    <AppLayout 
      t={t} 
      currentLang={lang} 
      isRtl={isRTL(lang)} 
      onLanguageChange={handleLanguageChange}
      username={session.user?.name || undefined}
    >
      <div className="container-fluid py-4">
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 animate-fade-in-up">
           <div>
              <h2 className="fw-bold mb-1"><i className="bi bi-file-earmark-image text-primary me-2"></i>{t.documents || 'Documents'}</h2>
              <p className="text-muted mb-0">Manage and view all client uploaded documents</p>
           </div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4 animate-fade-in-up delay-1" style={{borderRadius: '1rem'}}>
          <div className="card-body p-3">
             <div className="row g-3">
                 <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                        <input 
                            type="text" 
                            className="form-control border-0 bg-light" 
                            placeholder={t.full_name || "Search Client Name..."} 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                 </div>
                 <div className="col-md-3">
                    <input 
                        type="date" 
                        className="form-control border-0 bg-light" 
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        title="From Date"
                    />
                 </div>
                 <div className="col-md-3">
                     <input 
                        type="date" 
                        className="form-control border-0 bg-light" 
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        title="To Date"
                    />
                 </div>
             </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="animate-fade-in-up delay-2">
            {loading ? (
                <div className="text-center py-5">
                   <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
            ) : documents.length > 0 ? (
                <div className="row g-4">
                    {documents.map((doc) => (
                        <div key={doc._id} className="col-6 col-md-4 col-lg-3 col-xl-2">
                            <div className="card h-100 border-0 shadow-sm hover-shadow transition-all" style={{borderRadius: '12px', overflow: 'hidden'}}>
                                <div className="position-relative" style={{paddingTop: '75%', backgroundColor: '#f8f9fa', cursor: 'pointer'}} onClick={() => setPreviewImage(doc.url)}>
                                    <img 
                                        src={doc.url} 
                                        alt={doc.client_name}
                                        className="position-absolute top-0 left-0 w-100 h-100 object-fit-cover"
                                        loading="lazy"
                                    />
                                    <div className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-50 backdrop-blur">
                                        {doc.type}
                                    </div>
                                    <button 
                                        className="btn btn-sm btn-danger position-absolute top-0 start-0 m-2 shadow-sm" 
                                        style={{width: '24px', height: '24px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'}}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.url); }}
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                </div>
                                <div className="card-body p-3">
                                    <h6 className="card-title fw-bold text-truncate mb-1 text-dark" title={doc.client_name}>{doc.client_name}</h6>
                                    <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>
                                        <i className="bi bi-calendar3 me-1"></i>
                                        {formatDate(doc.created_at)}
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 mb-3 d-block opacity-25"></i>
                    No documents found matching your criteria.
                </div>
            )}
        </div>

        {/* Preview Modal */}
        {previewImage && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1060 }} onClick={() => setPreviewImage(null)}>
             <div className="btn-close btn-close-white position-absolute top-0 end-0 m-4 cursor-pointer" onClick={() => setPreviewImage(null)} style={{zIndex: 1070}}></div>
             <div className="d-flex w-100 h-100 align-items-center justify-content-center p-4">
                 <img src={previewImage} className="img-fluid rounded shadow-lg" style={{maxHeight: '90vh', maxWidth: '100%'}} onClick={e => e.stopPropagation()} />
             </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
