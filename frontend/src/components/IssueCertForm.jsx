import { useState } from 'react';
import { issueCertificate } from '../hooks/useContract';

const EMPTY = { certIdStr: '', holderAddress: '', name: '', expiryDate: '', metadataHash: '' };

export default function IssueCertForm() {
  const [form, setForm]     = useState(EMPTY);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const receipt = await issueCertificate(form);
      setStatus({ ok: true, msg: `Certificate issued successfully.`, tx: receipt.transactionHash });
      setForm(EMPTY);
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Issue Certificate</h2>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the details below to mint a certificate on-chain.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Certificate ID"   name="certIdStr"      value={form.certIdStr}      onChange={handleChange} placeholder="CERT-2024-001" />
            <Field label="Certificate Name" name="name"           value={form.name}           onChange={handleChange} placeholder="Bachelor of Science" />
            <Field label="Holder Address"   name="holderAddress"  value={form.holderAddress}  onChange={handleChange} placeholder="0x…" mono />
            <Field label="Expiry Date"      name="expiryDate"     value={form.expiryDate}     onChange={handleChange} type="date" />
          </div>
          <Field label="Metadata Hash" name="metadataHash" value={form.metadataHash} onChange={handleChange} placeholder="ipfs://… or any identifier" mono />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Submitting transaction…
              </>
            ) : 'Issue Certificate'}
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

function Field({ label, name, type = 'text', value, onChange, placeholder, mono }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}
