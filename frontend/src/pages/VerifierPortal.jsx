import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STATUS = {
  VALID:   { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Valid' },
  REVOKED: { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Revoked' },
  EXPIRED: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Expired' },
};

const isAddress = (val) => /^0x[0-9a-fA-F]{40}$/.test(val.trim());

export default function VerifierPortal() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState(null);  // null = no search yet, [] = no results, [...] = certs
  const [single, setSingle]   = useState(null);  // single cert lookup
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const val = query.trim();
    if (!val) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setSingle(null);

    try {
      if (isAddress(val)) {
        // Search by holder address
        const res = await fetch(`${API}/certificates?holder=${val.toLowerCase()}`);
        if (!res.ok) throw new Error('Search failed');
        setResults(await res.json());
      } else {
        // Search by certificate ID
        const res = await fetch(`${API}/certificates/${encodeURIComponent(val)}`);
        if (res.status === 404) {
          setError('No certificate found with that ID.');
        } else if (!res.ok) {
          throw new Error('Search failed');
        } else {
          setSingle(await res.json());
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify a Certificate</h1>
        <p className="text-slate-500 text-sm">
          Enter a Certificate ID or a wallet address to check authenticity.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Certificate ID or wallet address (0x…)"
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

      {/* Single cert result */}
      {single && <CertCard cert={single} />}

      {/* Address results */}
      {results !== null && (
        results.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm">No authenticated certificates found for this address.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{results.length} certificate{results.length !== 1 ? 's' : ''} found</p>
            {results.map((cert) => <CertCard key={cert.cert_id} cert={cert} />)}
          </div>
        )
      )}
    </div>
  );
}

function CertCard({ cert }) {
  const s = STATUS[cert.status] ?? STATUS.VALID;
  return (
    <div className={`border rounded-2xl shadow-sm overflow-hidden ${s.border}`}>
      <div className={`${s.bg} px-6 py-3.5 flex items-center justify-between border-b ${s.border}`}>
        <div className={`flex items-center gap-2 text-sm font-semibold ${s.text}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
          {s.label}
        </div>
        <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{cert.cert_id}</span>
      </div>

      <div className="bg-white px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {[
          ['Certificate Name', cert.name,             false],
          ['Institution',      cert.institution,       false],
          ['Course / Program', cert.course_name,       false],
          ['Holder',           cert.holder_address,    true],
          ['Authenticated by', cert.issuer_address,    true],
          ['Issued',           cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : null, false],
          ['Expires',          cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : null, false],
          cert.revoke_reason ? ['Revoke Reason', cert.revoke_reason, false] : null,
        ]
          .filter((row) => row && row[1])
          .map(([label, value, mono]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
              <dd className={`text-sm text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</dd>
            </div>
          ))}
      </div>

      {cert.file_url && (
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3">
          <a
            href={`http://localhost:3001${cert.file_url}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View Certificate Document
          </a>
        </div>
      )}
    </div>
  );
}
