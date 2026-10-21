import { formatDate } from '../../utils/membership';
import MemberClassesEditor from './MemberClassesEditor';

const Item = ({ label, children, className = '' }) => (
  <div className={className}>
    <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] mb-1">{label}</p>
    <div className="text-sm font-semibold">{children}</div>
  </div>
);

const IndividualMemberInfo = ({ member, scheduleTemplates, onSetMemberClasses }) => (
  <>
    <div className="glass-card p-6">
      <h4 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4">Personal Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Item label="Mobile">{member.phone || 'N/A'}</Item>
        <Item label="WhatsApp">{member.whatsappNumber || member.phone || 'N/A'}</Item>
        <Item label="Emirates ID"><span className="font-mono">{member.emiratesId || 'Not provided'}</span></Item>
        <Item label="Email">{member.email || 'N/A'}</Item>
        <Item label="Gender">{member.gender || 'N/A'}</Item>
        <Item label="Age">{member.age ?? 'N/A'}</Item>
        <Item label="Medical Conditions" className="md:col-span-2">
          <span className={member.medicalIssues ? 'text-danger' : ''}>{member.medicalIssues || 'None reported'}</span>
        </Item>
      </div>
    </div>

    <div className="glass-card p-6">
      <h4 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4">Membership</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Item label="Package">{member.plan || 'No package'}</Item>
        <Item label="Expiry Date">{formatDate(member.expiryDate)}</Item>
      </div>
    </div>

    <MemberClassesEditor member={member} scheduleTemplates={scheduleTemplates} onSetMemberClasses={onSetMemberClasses} />

    {(member.parentName || member.parentPhone) && (
      <div className="glass-card p-6">
        <h4 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4">Parent / Guardian</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Item label="Name">{member.parentName || 'N/A'}</Item>
          <Item label="Mobile">{member.parentPhone || 'N/A'}</Item>
        </div>
      </div>
    )}
  </>
);

export default IndividualMemberInfo;
