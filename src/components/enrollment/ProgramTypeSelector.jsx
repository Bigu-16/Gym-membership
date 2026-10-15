import { toggleButtonClass, sectionTitleClass } from './fieldStyles';

/** Children are registered by a parent/guardian; adults register themselves. */
const ProgramTypeSelector = ({ registrant, onRegistrantChange }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-4 mb-2">
      <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h2 className={sectionTitleClass}>Who is registering?</h2>
    </div>
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
  </section>
);

export default ProgramTypeSelector;
