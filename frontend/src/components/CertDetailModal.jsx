const STATUS = {
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approved' },
  REJECTED: { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Rejected' },
  PENDING:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pending' },
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text);
}

export default function CertDetailModal({ app, onClose }) {
  if (!app) return null;
  const s = STATUS[app.status] ?? STATUS.PENDING;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{app.name}</h2>
            {(app.institution || app.course_name) && (
              <p className="text-sm text-slate-500 mt-0.5">
                {[app.institution, app.course_name].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Certificate ID */}
          {app.cert_id && (
            <Section label="Certificate ID">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                <span className="text-xs font-mono text-slate-700 flex-1 break-all">{app.cert_id}</span>
                <button
                  onClick={() => copyToClipboard(app.cert_id)}
                  title="Copy"
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
            </Section>
          )}

          {/* Addresses */}
          <div className="grid grid-cols-1 gap-4">
            <Section label="Holder (Applicant)">
              <AddressBox address={app.applicant_address} />
            </Section>
            {app.authenticator_address && (
              <Section label="Authenticated By">
                <AddressBox address={app.authenticator_address} />
              </Section>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Section label="Submitted">
              <p className="text-sm text-slate-700">{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </Section>
            {app.reviewed_at && (
              <Section label={app.status === 'APPROVED' ? 'Approved On' : 'Reviewed On'}>
                <p className="text-sm text-slate-700">{new Date(app.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </Section>
            )}
          </div>

          {/* Description */}
          {app.description && (
            <Section label="Description">
              <p className="text-sm text-slate-700 leading-relaxed">{app.description}</p>
            </Section>
          )}

          {/* Rejection reason */}
          {app.status === 'REJECTED' && app.reject_reason && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-1">Rejection Reason</p>
              <p className="text-sm text-rose-700">{app.reject_reason}</p>
            </div>
          )}

          {/* Transaction hash */}
          {app.tx_hash && (
            <Section label="Transaction Hash">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                <span className="text-xs font-mono text-slate-600 flex-1 break-all">{app.tx_hash}</span>
                <button
                  onClick={() => copyToClipboard(app.tx_hash)}
                  title="Copy"
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
            </Section>
          )}

          {/* Document */}
          {app.file_url && (
            <Section label="Certificate Document">
              <a
                href={`${API_BASE}${app.file_url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Open Document
              </a>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function AddressBox({ address }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
      <span className="text-xs font-mono text-slate-700 flex-1 break-all">{address}</span>
      <button onClick={() => copyToClipboard(address)} title="Copy" className="text-slate-400 hover:text-slate-600 shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      </button>
    </div>
  );
}
