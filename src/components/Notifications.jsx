import { useState } from 'react';
import { apiService } from '../services/api';


const Notifications = ({ jobs = [], members = [], onTriggerTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [runningTask, setRunningTask] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);

  // Helper to map member name/phone from member_id or payload fallback
  const getRecipientInfo = (job) => {
    const member = members.find((m) => m.id === job.member_id);
    if (member) {
      return {
        name: member.name,
        phone: member.phone,
        image: member.image,
      };
    }
    // Fallback to payload
    return {
      name: job.payload?.member_name || 'System Operator',
      phone: job.payload?.phone || 'N/A',
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(job.payload?.member_name || 'System')}&background=random&color=fff`,
    };
  };

  const handleRunTask = async (taskType, taskFn) => {
    setRunningTask(taskType);
    setTaskStatus(null);
    try {
      const response = await taskFn();
      setTaskStatus({
        success: true,
        message: response.status === 'seeded' 
          ? 'Demo data seeded successfully!'
          : `Task queued successfully! ID: ${response.task_id || 'N/A'}`,
      });
      if (onTriggerTask) {
        // Refresh notifications log list
        await onTriggerTask();
      }
    } catch (err) {
      console.error(err);
      setTaskStatus({
        success: false,
        message: err.message || 'Task execution failed.',
      });
    } finally {
      setRunningTask(null);
    }
  };

  // Filter & Search Logic
  const filteredJobs = jobs.filter((job) => {
    const recipient = getRecipientInfo(job);
    const matchesSearch =
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.error_message && job.error_message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      job.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.notification_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate Metrics
  const metrics = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    processed: jobs.filter((j) => j.status === 'processed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Task Controls & Task Feedback Banner */}
      <section className="glass-card p-6 border border-[var(--glass-border)]">
        <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold mb-4">
          Control Panel & Celery Routines
        </h2>
        
        {taskStatus && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between transition-all ${
              taskStatus.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {taskStatus.success ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{taskStatus.message}</span>
            </div>
            <button
              onClick={() => setTaskStatus(null)}
              className="text-[10px] uppercase font-bold tracking-widest opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleRunTask('seed', () => apiService.triggerSeedDemoData())}
            disabled={runningTask !== null}
            className="glass-card hover:bg-[var(--card-hover)] active:scale-95 transition-all py-4 px-6 text-left flex flex-col justify-between h-28 group relative overflow-hidden disabled:opacity-50 disabled:pointer-events-none"
          >
            <div>
              <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Database Seeder</span>
              <span className="text-xs font-semibold block text-[var(--text-primary)]">Populate Sandbox Logs</span>
            </div>
            <div className="flex justify-between items-center w-full mt-auto">
              <span className="text-[10px] text-emerald-500 font-medium">Seed Demo Data</span>
              {runningTask === 'seed' ? (
                <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </div>
          </button>

          <button
            onClick={() => handleRunTask('expiry', () => apiService.triggerMembershipExpiryReminders())}
            disabled={runningTask !== null}
            className="glass-card hover:bg-[var(--card-hover)] active:scale-95 transition-all py-4 px-6 text-left flex flex-col justify-between h-28 group relative overflow-hidden disabled:opacity-50 disabled:pointer-events-none"
          >
            <div>
              <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Expiry Checker</span>
              <span className="text-xs font-semibold block text-[var(--text-primary)]">Scan & Queue Expiry warnings</span>
            </div>
            <div className="flex justify-between items-center w-full mt-auto">
              <span className="text-[10px] text-amber-500 font-medium">Trigger Expiry Checks</span>
              {runningTask === 'expiry' ? (
                <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </div>
          </button>

          <button
            onClick={() => handleRunTask('process', () => apiService.triggerProcessNotificationJobs())}
            disabled={runningTask !== null}
            className="glass-card hover:bg-[var(--card-hover)] active:scale-95 transition-all py-4 px-6 text-left flex flex-col justify-between h-28 group relative overflow-hidden disabled:opacity-50 disabled:pointer-events-none"
          >
            <div>
              <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Queue Runner</span>
              <span className="text-xs font-semibold block text-[var(--text-primary)]">Dispatch all pending notices</span>
            </div>
            <div className="flex justify-between items-center w-full mt-auto">
              <span className="text-[10px] text-indigo-500 font-medium">Process Pending Jobs</span>
              {runningTask === 'process' ? (
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </section>

      {/* Metrics Dashboard */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Total Logs</span>
          <span className="text-2xl font-semibold">{metrics.total}</span>
          <div className="absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 bg-[var(--text-primary)] opacity-5 rounded-full"></div>
        </div>
        <div className="glass-card p-5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Pending</span>
          <span className="text-2xl font-semibold text-amber-500">{metrics.pending}</span>
          <div className="absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 bg-amber-500 opacity-5 rounded-full"></div>
        </div>
        <div className="glass-card p-5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Processed</span>
          <span className="text-2xl font-semibold text-emerald-500">{metrics.processed}</span>
          <div className="absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 bg-emerald-500 opacity-5 rounded-full"></div>
        </div>
        <div className="glass-card p-5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Failed</span>
          <span className={`text-2xl font-semibold ${metrics.failed > 0 ? 'text-rose-500 animate-pulse-soft' : ''}`}>
            {metrics.failed}
          </span>
          <div className="absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 bg-rose-500 opacity-5 rounded-full"></div>
        </div>
      </section>

      {/* Live Stream Header + Filters */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-grow">
            <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold whitespace-nowrap">
              Log Archives
            </h2>
            <div className="h-[1px] flex-grow bg-[var(--glass-border)] hidden md:block"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search member, phone or error..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-full px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20 pl-8 text-[var(--text-primary)]"
              />
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto shrink-0 pb-1 sm:pb-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-card px-3 py-1.5 rounded-full text-[10px] uppercase tracking-luxury border-[var(--glass-border)] text-[var(--text-secondary)] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="glass-card px-3 py-1.5 rounded-full text-[10px] uppercase tracking-luxury border-[var(--glass-border)] text-[var(--text-secondary)] focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="welcome">Welcome</option>
                <option value="membership_expiry">Expiry</option>
                <option value="session_reminder">Session</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-luxury text-[9px] bg-[var(--card-hover)]">
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Message Type</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Scheduled For</th>
                  <th className="py-4 px-6">Processed At</th>
                  <th className="py-4 px-6 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[var(--text-secondary)]">
                      No notification jobs match the filter settings.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const recipient = getRecipientInfo(job);
                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className="hover:bg-[var(--card-hover)] transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 flex items-center gap-3">
                          <img
                            src={recipient.image}
                            alt={recipient.name}
                            className="w-8 h-8 rounded-full bg-[var(--glass-border)] object-cover shrink-0 border border-[var(--glass-border)]"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold block truncate text-[var(--text-primary)]">
                              {recipient.name}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)] block truncate">
                              {recipient.phone}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                              job.notification_type === 'welcome'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                                : job.notification_type === 'membership_expiry'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                            }`}
                          >
                            {job.notification_type === 'membership_expiry'
                              ? 'Expiry Alert'
                              : job.notification_type === 'session_reminder'
                              ? 'Session reminder'
                              : job.notification_type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 ${
                              job.status === 'processed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                : job.status === 'failed'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                job.status === 'processed'
                                  ? 'bg-emerald-400'
                                  : job.status === 'failed'
                                  ? 'bg-rose-400'
                                  : 'bg-amber-400'
                              }`}
                            ></span>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[var(--text-secondary)]">
                          {formatDateTime(job.scheduled_for)}
                        </td>
                        <td className="py-4 px-6 text-[var(--text-secondary)]">
                          {formatDateTime(job.processed_at)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button className="text-[10px] uppercase font-bold tracking-luxury text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Details Inspect Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
            data-testid="modal-backdrop"
          ></div>
          <div className="glass-card w-full max-w-xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden border border-[var(--glass-border)] animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">
                  Job #{selectedJob.id} Details
                </span>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Notification Audit Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="glass-card p-1.5 hover:scale-115 hover:text-rose-400 transition-all active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-150px)]">
              {/* Recipient Card */}
              <div className="flex items-center gap-4 bg-[var(--card-hover)] p-4 rounded-2xl border border-[var(--glass-border)]">
                <img
                  src={getRecipientInfo(selectedJob).image}
                  alt={getRecipientInfo(selectedJob).name}
                  className="w-12 h-12 rounded-full border border-[var(--glass-border)] object-cover"
                />
                <div>
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Recipient Details</span>
                  <span className="font-semibold block text-sm text-[var(--text-primary)]">{getRecipientInfo(selectedJob).name}</span>
                  <span className="text-xs text-[var(--text-secondary)] block">{getRecipientInfo(selectedJob).phone}</span>
                </div>
              </div>

              {/* Status & Error Callout */}
              {selectedJob.status === 'failed' && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-500 text-xs">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-bold block uppercase text-[10px] tracking-widest mb-1">Processing Failure log</span>
                    <p className="font-mono leading-relaxed break-all bg-black/10 p-2.5 rounded-lg border border-rose-500/10">
                      {selectedJob.error_message || 'Unknown network error.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-3.5">
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Type</span>
                  <span className="text-xs font-semibold capitalize text-[var(--text-primary)]">{selectedJob.notification_type.replace('_', ' ')}</span>
                </div>
                <div className="glass-card p-3.5">
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Provider</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{selectedJob.provider}</span>
                </div>
                <div className="glass-card p-3.5">
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Scheduled</span>
                  <span className="text-[11px] font-medium text-[var(--text-primary)]">{formatDateTime(selectedJob.scheduled_for)}</span>
                </div>
                <div className="glass-card p-3.5">
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Processed</span>
                  <span className="text-[11px] font-medium text-[var(--text-primary)]">{formatDateTime(selectedJob.processed_at)}</span>
                </div>
                <div className="glass-card p-3.5">
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Created At</span>
                  <span className="text-[11px] font-medium text-[var(--text-primary)]">{formatDateTime(selectedJob.created_at)}</span>
                </div>
                <div className="glass-card p-3.5">
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Updated At</span>
                  <span className="text-[11px] font-medium text-[var(--text-primary)]">{formatDateTime(selectedJob.updated_at)}</span>
                </div>
              </div>

              {/* Raw Payload Section */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] block">
                  Raw payload context
                </span>
                <pre className="p-4 bg-black/25 text-neutral-300 rounded-2xl border border-[var(--glass-border)] text-xs font-mono overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
