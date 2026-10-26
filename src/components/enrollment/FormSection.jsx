/** One numbered step of the registration form, rendered as a single flat card. */
const FormSection = ({ number, title, description, children, id }) => (
  <section className="glass-card p-5 space-y-4" aria-labelledby={id}>
    <div>
      <h2 id={id} className="section-title">
        <span className="text-[var(--text-secondary)]">{number}.</span> {title}
      </h2>
      {description && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{description}</p>}
    </div>
    {children}
  </section>
);

export default FormSection;
