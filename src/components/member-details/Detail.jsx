/** One label/value row inside a `divide-y` details list. */
const Detail = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
    <dt className="label">{label}</dt>
    <dd className="text-sm text-[var(--text-primary)] sm:text-right">{children}</dd>
  </div>
);

export default Detail;
