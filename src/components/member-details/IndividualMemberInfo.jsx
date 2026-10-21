import { formatDate, freezeSummary } from '../../utils/membership';
import Detail from './Detail';
import MemberClassesEditor from './MemberClassesEditor';
import { relativeExpiry } from './memberDetailsHelpers';

const dash = (value) => (value === null || value === undefined || value === '' ? '—' : value);

const IndividualMemberInfo = ({ member, scheduleTemplates, onSetMemberClasses }) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <section aria-labelledby="membership-title" className="glass-card h-fit p-5">
      <h3 id="membership-title" className="section-title">Membership</h3>
      <dl className="mt-2 divide-y divide-[var(--glass-border)]">
        <Detail label="Package">{member.plan || 'No package'}</Detail>
        {member.isFrozen ? (
          <>
            <Detail label="On hold">{freezeSummary(member)}</Detail>
            {member.frozenSince && <Detail label="Frozen since">{formatDate(member.frozenSince)}</Detail>}
          </>
        ) : (
          <Detail label="Expiry">
            {formatDate(member.expiryDate)}
            {member.expiryDate && <span className="text-xs text-[var(--text-secondary)]"> · {relativeExpiry(member.expiryDate)}</span>}
          </Detail>
        )}
      </dl>
      <div className="mt-2 border-t border-[var(--glass-border)] pt-4">
        <MemberClassesEditor member={member} scheduleTemplates={scheduleTemplates} onSetMemberClasses={onSetMemberClasses} compact />
      </div>
    </section>

    <section aria-labelledby="contact-title" className="glass-card h-fit p-5">
      <h3 id="contact-title" className="section-title">Contact &amp; details</h3>
      <dl className="mt-2 divide-y divide-[var(--glass-border)]">
        <Detail label="Age">{dash(member.age)}</Detail>
        <Detail label="Gender">{dash(member.gender)}</Detail>
        <Detail label="Mobile">{dash(member.phone)}</Detail>
        <Detail label="WhatsApp">{member.whatsappNumber || member.phone || '—'}</Detail>
        <Detail label="Emirates ID"><span className="font-mono">{dash(member.emiratesId)}</span></Detail>
        <Detail label="Email">{dash(member.email)}</Detail>
        {(member.parentName || member.parentPhone) && (
          <Detail label="Parent / guardian">
            {[member.parentName, member.parentPhone].filter(Boolean).join(' · ')}
          </Detail>
        )}
        <Detail label="Medical notes">
          <span className={member.medicalIssues ? 'font-semibold text-danger' : ''}>{member.medicalIssues || 'None reported'}</span>
        </Detail>
      </dl>
    </section>
  </div>
);

export default IndividualMemberInfo;
