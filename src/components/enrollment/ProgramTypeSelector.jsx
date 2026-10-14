import { toggleButtonClass, sectionTitleClass } from './fieldStyles';

const OPTIONS = [
  {
    value: 'group',
    title: 'Group Training',
    description: 'Package with weekly classes at the center'
  },
  {
    value: 'personal',
    title: 'Personal Training',
    description: 'One-to-one sessions inside opening hours (4–9 PM)'
  }
];

const ProgramTypeSelector = ({ trainingType, onTrainingTypeChange, registrant, onRegistrantChange }) => (
  <section className="space-y-6">
    <div className="flex items-center gap-4 mb-2">
      <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 className={sectionTitleClass}>Select Training Program</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={trainingType === option.value}
          onClick={() => onTrainingTypeChange(option.value)}
          className={`training-type-btn ${trainingType === option.value ? 'active' : ''}`}
        >
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1">{option.title}</h3>
            <p className="text-[10px] opacity-60">{option.description}</p>
          </div>
        </button>
      ))}
    </div>

    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Who is registering?</p>
      <div className="flex flex-col sm:flex-row gap-2 p-1 glass-card rounded-xl max-w-xl" role="group" aria-label="Who is registering">
        <button
          type="button"
          aria-pressed={registrant === 'child'}
          onClick={() => onRegistrantChange('child')}
          className={toggleButtonClass(registrant === 'child')}
        >
          Child (parent/guardian registers)
        </button>
        <button
          type="button"
          aria-pressed={registrant === 'adult'}
          onClick={() => onRegistrantChange('adult')}
          className={toggleButtonClass(registrant === 'adult')}
        >
          Adult (registers themself)
        </button>
      </div>
    </div>
  </section>
);

export default ProgramTypeSelector;
