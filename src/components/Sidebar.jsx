import { Activity, BarChart3, CalendarDays, LayoutDashboard, Mail, Package, UserPlus, Users } from 'lucide-react';

// Grouped by how often the front desk needs them.
const GROUPS = [
  {
    title: 'Front desk',
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'enrollment', label: 'New registration', short: 'Register', icon: UserPlus },
      { id: 'schedule', label: 'Schedule', icon: CalendarDays }
    ]
  },
  {
    title: 'Manage',
    items: [
      { id: 'packages', label: 'Packages', icon: Package },
      { id: 'notifications', label: 'Messages', icon: Mail },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'activity', label: 'Activity log', short: 'Activity', icon: Activity, adminOnly: true }
    ]
  }
];

const Sidebar = ({ activeTab = 'dashboard', onTabChange, isAdmin = false }) => {
  const groups = GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => !item.adminOnly || isAdmin) }));
  const allItems = groups.flatMap((group) => group.items);

  return (
    <>
      <aside className="w-56 shrink-0 h-[calc(100vh-4rem)] sticky top-8 hidden lg:flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <img src="/nt-logo.svg" alt="N & T Taekwondo & Karate Center logo" className="w-9 h-9 rounded-lg" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-[var(--text-primary)]">N &amp; T Center</p>
            <p className="text-xs text-[var(--text-secondary)]">Taekwondo &amp; Karate</p>
          </div>
        </div>

        <nav aria-label="Main" className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1 text-xs font-semibold text-[var(--text-secondary)]">{group.title}</p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = activeTab === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onTabChange(id)}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Icon size={18} aria-hidden="true" />
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Phones and tablets: bottom bar */}
      <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)] flex overflow-x-auto">
        {allItems.map(({ id, label, short, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-w-[64px] flex flex-col items-center gap-1 py-2 text-xs ${
                active ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {short || label}
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
