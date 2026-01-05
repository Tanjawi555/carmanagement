   'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toBusinessInputString } from '@/lib/timezone';
import SignatureCanvas from 'react-signature-canvas';

export default function DeclarationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);

  // Data State
  const [data, setData] = useState({
     // Client
     name: '',
     cnie: '',
     license: '',
     address: '',
     city: 'Tanger', // Default based on context
     zip: '',
     
     // Car
     plate: '',
     
     // Dates
     start_date: '',
     start_time: '',
     return_date: '',
     return_time: '',

     // Signatures
     agency_signature: null as string | null,
     client_signature: null as string | null
  });

  const [activeSignField, setActiveSignField] = useState<'agency' | 'client' | null>(null);
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && id) {
      fetchRentalData();
    }
  }, [status, id, router]);

  const fetchRentalData = async () => {
      try {
          const res = await fetch(`/api/rentals?id=${id}`);
          if (res.ok) {
              const rental = await res.json();
              
              // Parse dates
              const start = new Date(rental.start_date);
              const end = new Date(rental.return_date);

              const formatDate = (d: Date) => {
                  const day = d.getDate().toString().padStart(2, '0');
                  const month = (d.getMonth() + 1).toString().padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
              };
              
              const formatTime = (d: Date) => {
                  const hours = d.getHours().toString().padStart(2, '0');
                  const mins = d.getMinutes().toString().padStart(2, '0');
                  return `${hours}:${mins}`;
              };

              setData(prev => ({
                  ...prev,
                  name: rental.client_name || '',
                  cnie: rental.passport_id || rental.client_id_number || '', // Fallback
                  license: rental.driving_license || '',
                  address: rental.client_address || '',
                  plate: rental.plate_number || '',
                  start_date: formatDate(start),
                  start_time: formatTime(start),
                  return_date: formatDate(end),
                  return_time: formatTime(end),
              }));
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleSaveSignature = () => {
    if (sigCanvas.current && activeSignField) {
        const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
        setData(prev => ({...prev, [activeSignField === 'agency' ? 'agency_signature' : 'client_signature']: dataURL}));
        setActiveSignField(null);
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
  };
  
  const handlePrint = () => {
      window.print();
  };

  if (loading) return <div className="text-center p-5">Loading Declaration...</div>;

  // Render Box helper for single char inputs (visual only, we will use strings for simplicity but styled to look like boxes if needed, 
  // but looking at image, they are just lines or boxes. We will use simple border-b or boxes).
  // The image shows boxes for CNIE: | | | | ...
  
  // Replicating the form structure
  return (
    <div className="bg-gray-100 min-h-screen py-12 print:py-0 print:bg-white text-black font-sans  flex flex-col items-center">
         <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body { background-color: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .font-times { font-family: 'Times New Roman', Times, serif; }
          .print-hidden { display: none !important; }
          .print-container { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 10mm 15mm;
              margin: 0 auto;
              position: relative;
          }
          input { font-family: inherit; }
        `}
      </style>

      {/* Toolbar */}
      <div className="container mx-auto max-w-[210mm] mt-4 mb-4 flex justify-between print-hidden px-4">
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-700 text-white rounded shadow text-sm">Return</button>
        <button onClick={handlePrint} className="px-4 py-2 bg-blue-700 text-white rounded shadow text-sm">Print Declaration</button>
      </div>

       {/* Form Container */}
       <div className="bg-[#fff] shadow-2xl text-black text-[13px] leading-tight relative font-times w-full md:w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] ">
           
           {/* Header Section with Background */}
           <div className="bg-[#f8f3f7] print:bg-[#f8f3f7] px-6 pt-6 pb-2 ">
               <div className="flex justify-between items-center w-full">
                   {/* Left Header - French */}
                   <div className="text-center w-[42%] flex flex-col items-center">
                       <h3 className="uppercase font-bold text-[15px] tracking-wide mb-[2px] leading-tight font-times text-black">ROYAUME DU MAROC</h3>
                       <p className="text-[13px] font-normal leading-[1.2] font-times text-black">Ministère de l'Equipement, du Transport et de la<br/>Logistique</p>
                   </div>
                   
                   {/* Center Logo */}
                   <div className="flex-shrink-0 mx-4">
                        <img src="/gov-logo.jpg" alt="Logo" className="h-[65px] object-contain" />
                   </div>
                   
                   {/* Right Header - Arabic */}
                   <div className="text-center w-[42%] flex flex-col items-center" dir="rtl">
                       <h3 className="font-bold text-[16px] mb-[2px] leading-tight font-times text-black">المملكة المغربية</h3>
                       <p className="text-[15px] font-normal font-times leading-[1.2] text-black">وزارة التجهيز والنقل واللوجستيك</p>
                   </div>
               </div>
           </div>

           {/* Ref Box & Titles */}
           <div className="relative mb-6 mt-0 px-10">
               {/* Reference Box - Positioned absolutely to the left */}
               <div className="absolute top-0 left-10 border-[1px] border-black px-2 py-[2px] bg-white shadow-none z-10">
                   <p className="font-bold text-[14px] font-times text-black m-0 leading-none">Réf. : DPL1</p>
               </div>
               
               {/* Centered Titles */}
               <div className="text-center pt-2">
                   {/* Arabic Title */}
                   <h2 className="font-bold text-[22px] mb-0 font-times text-black leading-tight" dir="rtl">التصريح القبلي بكراء سيارة بدون سائق</h2>
                   <p className="text-[15px] mb-2 font-times text-black" dir="rtl">(يعبأ من طرف المكتري القاطن بالمغرب)</p>
                   
                   {/* French Title */}
                   <h2 className="font-bold text-[19px] font-times text-black leading-tight tracking-tight mt-1">Déclaration préalable de location de voiture sans chauffeur</h2>
                   <p className="text-[14px] italic font-times text-black mt-0">(à renseigner par le locataire résidant au Maroc)</p>
               </div>
           </div>

        
       </div>

    </div>
  );
}
