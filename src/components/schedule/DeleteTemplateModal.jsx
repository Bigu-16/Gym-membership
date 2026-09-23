import React from 'react';
import { Trash2 } from 'lucide-react';

const DeleteTemplateModal = ({
  deleteTemplateId,
  setDeleteTemplateId,
  onDeleteTemplate
}) => {
  if (!deleteTemplateId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-card p-6 border-[var(--glass-border)] bg-[var(--bg-secondary)] flex flex-col items-center text-center animate-in scale-in duration-300">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
          <Trash2 size={22} />
        </div>
        <h3 className="text-lg font-light uppercase tracking-luxury mb-2 text-white">Delete Template Slot?</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
          Are you sure you want to delete this schedule template? Enrolled members will need to be rescheduled. This action cannot be undone.
        </p>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              onDeleteTemplate(deleteTemplateId);
              setDeleteTemplateId(null);
            }}
            className="flex-grow py-3 rounded-xl bg-rose-500 text-white text-[10px] uppercase tracking-luxury font-bold hover:bg-rose-600 active:scale-95 transition-all shadow-lg"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setDeleteTemplateId(null)}
            className="flex-grow py-3 rounded-xl glass-card text-[10px] uppercase tracking-luxury font-bold border-[var(--glass-border)] hover:bg-[var(--card-hover)] active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTemplateModal;
