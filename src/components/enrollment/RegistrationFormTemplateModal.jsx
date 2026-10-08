import React from 'react';
import { X, Printer } from 'lucide-react';
import OfficialRegistrationSheet from './OfficialRegistrationSheet';

const RegistrationFormTemplateModal = ({
  isOpen,
  onClose,
  data = null
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden my-auto border border-gray-200 print:border-none print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-gray-900 text-white border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest font-bold">Official Registration Template</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">N & T Center</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Component */}
        <OfficialRegistrationSheet
          data={data}
          className="border-none shadow-none rounded-none"
        />
      </div>
    </div>
  );
};

export default RegistrationFormTemplateModal;
