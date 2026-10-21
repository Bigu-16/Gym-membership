const EnrollmentSuccess = ({ members = [], parentName, warnings = [], onDone }) => {
  const names = members.map((m) => m.name).filter(Boolean);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] glass-card p-8 sm:p-12 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 mb-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-light uppercase tracking-luxury mb-4">Enrollment Successful</h2>
      <p className="text-[var(--text-secondary)] text-base max-w-md">
        {names.length > 0 ? (
          <>
            Registered <span className="text-[var(--text-primary)] font-bold">{names.join(', ')}</span>
            {parentName ? <> under {parentName}</> : null}.
          </>
        ) : (
          'The registration has been saved.'
        )}
      </p>

      {warnings.length > 0 && (
        <div role="status" className="mt-6 max-w-lg w-full text-left rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-warning">
          <p className="font-bold mb-1">Saved with warnings:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      {onDone && (
        <button
          type="button"
          onClick={onDone}
          className="mt-8 px-8 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-luxury font-bold"
        >
          Register another
        </button>
      )}
    </div>
  );
};

export default EnrollmentSuccess;
