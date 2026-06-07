import { useState, useEffect } from 'react';
import { getAuthToken } from '../hooks/useWallet';
import { issueCertificate } from '../hooks/useContract';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STATUS = {
  PENDING:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pending' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approved' },
  REJECTED: { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Rejected' },
};

const twoYearsFromNow = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().split('T')[0];
};

const shorten = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

export default function AuthenticatorDashboard() {
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [processing, setProcessing] = useState(false);

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState(null);
  const [expiresAt, setExpiresAt]         = useState(twoYearsFromNow());

  // Reject modal state
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [rejectReason, setRejectReason]   = useState('');

  const authHeader = { Authorization: `Bearer ${getAuthToken()}` };

  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/applications/pending`, { headers: authHeader });
      if (!res.ok) throw new Error('Failed to load applications');
      setApps(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const openApprove = (app) => {
    setApproveTarget(app);
    setExpiresAt(twoYearsFromNow());
  };

  const openReject = (app) => {
    setRejectTarget(app);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setProcessing(true);
    setError(null);
    try {
      const certId = `CERT-${approveTarget.applicant_address.slice(2, 8).toUpperCase()}-${Date.now()}`;

      const receipt = await issueCertificate({
        certIdStr: certId,
        holderAddress: approveTarget.applicant_address,
        name: approveTarget.name,
        expiryDate: expiresAt,
        metadataHash: certId,
      });

      const res = await fetch(`${API}/applications/${approveTarget.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ cert_id: certId, tx_hash: receipt.transactionHash }),
      });
      if (!res.ok) throw new Error('Backend update failed after on-chain approval');

      setApproveTarget(null);
      fetchApps();
    } catch (err) {
      setError(err.shortMessage || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API}/applications/${rejectTarget.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ reject_reason: rejectReason }),
      });
      if (!res.ok) throw new Error('Rejection failed');

      setRejectTarget(null);
      fetchApps();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const pending  = apps.filter((a) => a.status === 'PENDING');
  const reviewed = apps.filter((a) => a.status !== 'PENDING');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-1 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Authenticator Dashboard</h1>
        <p className="text-slate-500 text-sm">Review certificate applications and authenticate them on-chain.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      {/* Pending section */}
      <Section title={`Pending Applications (${pending.length})`}>
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        ) : pending.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm">No pending applications — all caught up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((app) => (
              <AppCard key={app.id} app={app} onApprove={() => openApprove(app)} onReject={() => openReject(app)} />
            ))}
          </div>
        )}
      </Section>

      {/* Reviewed section */}
      {reviewed.length > 0 && (
        <Section title={`Reviewed (${reviewed.length})`}>
          <div className="space-y-2">
            {reviewed.map((app) => {
              const s = STATUS[app.status] ?? STATUS.PENDING;
              return (
                <div key={app.id} className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{app.name}</p>
                    <p className="text-xs text-slate-400">
                      {shorten(app.applicant_address)}
                      {app.institution ? ` · ${app.institution}` : ''}
                      {app.reviewed_at ? ` · ${new Date(app.reviewed_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Approve modal */}
      {approveTarget && (
        <Modal title="Approve Certificate" onClose={() => setApproveTarget(null)}>
          <p className="text-sm text-slate-500 mb-4">
            Issue <strong className="text-slate-700">{approveTarget.name}</strong> on-chain to{' '}
            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{approveTarget.applicant_address}</span>.
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
          <input
            type="date"
            value={expiresAt}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          />
          <p className="text-xs text-slate-400 -mt-3 mb-4">Defaults to 2 years from today.</p>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {processing ? 'Processing on-chain…' : 'Confirm Approval'}
            </button>
            <button
              onClick={() => setApproveTarget(null)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <Modal title="Reject Application" onClose={() => setRejectTarget(null)}>
          <p className="text-sm text-slate-500 mb-4">
            Provide a reason for rejecting <strong className="text-slate-700">{rejectTarget.name}</strong>.
            The applicant will see this message.
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="e.g. Certificate details could not be verified…"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {processing ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setRejectTarget(null)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AppCard({ app, onApprove, onReject }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-semibold text-slate-900">{app.name}</h3>
          {(app.institution || app.course_name) && (
            <p className="text-sm text-slate-500">
              {[app.institution, app.course_name].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          {new Date(app.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
        <p className="text-xs text-slate-400 mb-0.5">Applicant</p>
        <p className="text-xs font-mono text-slate-700 break-all">{app.applicant_address}</p>
      </div>

      {app.description && (
        <p className="text-sm text-slate-600 mb-3">{app.description}</p>
      )}

      {app.file_url && (
        <a
          href={`http://localhost:3001${app.file_url}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          View Certificate Document
        </a>
      )}

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          className="border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm px-5 py-2 rounded-xl font-medium transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
