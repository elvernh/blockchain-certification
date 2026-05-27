import { useState } from 'react';
import { revokeCertificate } from '../hooks/useContract';

export default function RevokeCertForm() {
  const [certIdStr, setCertIdStr] = useState('');
  const [reason, setReason]       = useState('');
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const receipt = await revokeCertificate({ certIdStr, reason });
      setStatus({ ok: true, msg: 'Certificate revoked successfully.', tx: receipt.transactionHash });
      setCertIdStr('');
      setReason('');
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-rose-100 rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Revoke Certificate</h2>
          <p className="text-slate-500 text-sm mt-0.5">This action is permanent and recorded on-chain.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Certificate ID</label>
            <input
              type="text"
              value={certIdStr}
              onChange={(e) => setCertIdStr(e.target.value)}
              placeholder="CERT-2024-001"
              required
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Reason for Revocation</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this certificate is being revoked…"
              required
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Revocation cannot be undone. Make sure this is the correct certificate ID.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Submitting transaction…
              </>
            ) : 'Revoke Certificate'}
          </button>
        </form>

        {status && (
          <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
            status.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {status.ok ? (
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            <div className="min-w-0">
              <p>{status.msg}</p>
              {status.tx && <p className="font-mono text-xs mt-1 break-all opacity-70">{status.tx}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
