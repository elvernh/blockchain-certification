import { useState } from 'react';
import { verifyCertificate } from '../hooks/useContract';

const STATUS_CONFIG = {
  VALID:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Valid' },
  REVOKED:  { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Revoked' },
  EXPIRED:  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Expired' },
  UNKNOWN:  { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Unknown' },
};

export default function VerifierPortal() {
  const [certIdStr, setCertIdStr] = useState('');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      setResult(await verifyCertificate(certIdStr));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = STATUS_CONFIG[result?.status] ?? STATUS_CONFIG.UNKNOWN;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center space-y-1 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify a Certificate</h1>
        <p className="text-slate-500 text-sm">Enter a certificate ID to check its authenticity on-chain.</p>
      </div>

      {/* Search card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleVerify} className="flex gap-2">
          <input
            type="text"
            value={certIdStr}
            onChange={(e) => setCertIdStr(e.target.value)}
            placeholder="Certificate ID — e.g. CERT-2024-001"
            required
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            )}
            Verify
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}
      </div>

      {/* Result card */}
      {result && (
        <div className={`border rounded-2xl shadow-sm overflow-hidden ${s.border}`}>
          {/* Status header */}
          <div className={`${s.bg} px-6 py-4 flex items-center justify-between border-b ${s.border}`}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${s.text}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              {s.label}
            </div>
            <span className="text-xs text-slate-400 font-mono">{result.cert.certId}</span>
          </div>

          {/* Details grid */}
          <div className="bg-white px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {[
              ['Certificate Name', result.cert.name,         false],
              ['Holder',           result.cert.holder,       true],
              ['Issuer',           result.cert.issuer,       true],
              ['Issued',           result.cert.issuedAt,     false],
              ['Expires',          result.cert.expiresAt,    false],
              result.cert.revokeReason
                ? ['Revoke Reason', result.cert.revokeReason, false]
                : null,
            ].filter(Boolean).map(([label, value, mono]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
                <dd className={`text-sm text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
