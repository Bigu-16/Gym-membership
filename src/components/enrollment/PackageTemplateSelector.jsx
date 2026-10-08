const PackageTemplateSelector = ({ packageTemplates = [], selectedPackageId, onSelect }) => {
  const programs = [...new Set(packageTemplates.map((item) => item.program))];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 px-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)] font-black text-sm">
          AED
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-luxury font-bold">Package Templates</h2>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">
            Official N &amp; T package options
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {programs.map((program) => (
          <div key={program} className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider">{program}</h3>
              <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">AED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packageTemplates.filter((item) => item.program === program).map((item) => {
                const selected = item.id === selectedPackageId;
                const durationLabel = `${item.durationMonths} ${item.durationMonths === 1 ? 'month' : 'months'}`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Select ${item.program}, ${durationLabel}, ${item.classesPerWeek} classes per week, ${item.price} AED`}
                    onClick={() => onSelect(item)}
                    className={`relative rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                      selected
                        ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20'
                        : 'border-[var(--glass-border)] bg-[var(--bg-primary)] hover:border-orange-500/60'
                    }`}
                  >
                    <span className="block text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">
                      {durationLabel}
                    </span>
                    <span className="block text-xl font-black mt-1">{item.price}</span>
                    <span className="block text-[10px] text-[var(--text-secondary)] mt-1">
                      {item.classesPerWeek} classes / week
                    </span>
                    {item.includedItem && (
                      <span className="inline-flex mt-3 rounded-full bg-amber-500/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                        {item.includedItem}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PackageTemplateSelector;
