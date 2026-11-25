const EnrollmentSuccess = ({ members = [], parentName, warnings = [], onDone }) => {
  const names = members.map((m) => m.name).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto glass-card p-6 sm:p-8 text-center space-y-4">
      <h2 className="section-title text-success">Enrollment successful</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        {names.length > 0 ? (
          <>
            Registered <span className="text-[var(--text-primary)] font-semibold">{names.join(', ')}</span>
            {parentName ? <> under {parentName}</> : null}.
          </>
        ) : (
          'The registration has been saved.'
        )}
      </p>

      {warnings.length > 0 && (
        <div role="status" className="text-left rounded-xl bg-amber-500/10 p-3 text-sm text-warning">
          <p className="font-semibold">Saved with warnings:</p>
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      {onDone && (
        <button type="button" onClick={onDone} className="btn-primary">
          Register another
        </button>
      )}
    </div>
  );
};

export default EnrollmentSuccess;
