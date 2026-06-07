import { useState, useEffect } from 'react';
import { getAuthToken } from '../hooks/useWallet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STATUS = {
  PENDING:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pending Review' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approved' },
  REJECTED: { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'Rejected' },
};

export default function ApplierPortal({ account }) {
  const [tab, setTab]               = useState('submit');
  const [applications, setApps]     = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);

  const [form, setForm] = useState({
    name: '', institution: '', course_name: '', description: '', file_url: '',
  });

  const patch = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const fetchApps = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch(`${API}/applications/mine`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setApps(await res.json());
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => { if (tab === 'status') fetchApps(); }, [tab]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setForm((f) => ({ ...f, file_url: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Submission failed');
      }
      setSuccess('Application submitted! An authenticator will review it shortly.');
      setForm({ name: '', institution: '', course_name: '', description: '', file_url: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificate Applications</h1>
        <p className="text-slate-500 text-sm">
          Submit your certificate for authentication or track your application status.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200">
        {[['submit', 'Submit Application'], ['status', 'My Applications']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'submit' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          {error   && <Alert type="error"   msg={error}   onClose={() => setError(null)} />}
          {success && <Alert type="success" msg={success} onClose={() => setSuccess(null)} />}

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <Field label="Certificate Name *">
              <input
                required
                value={form.name}
                onChange={patch('name')}
                className={input}
                placeholder="e.g. Bachelor of Computer Science"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Institution">
                <input value={form.institution} onChange={patch('institution')} className={input} placeholder="e.g. MIT" />
              </Field>
              <Field label="Course / Program">
                <input value={form.course_name} onChange={patch('course_name')} className={input} placeholder="e.g. Computer Science" />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={patch('description')}
                rows={3}
                className={input}
                placeholder="Any additional details about this certificate…"
              />
            </Field>

            <Field label="Certificate Document (PDF / PNG / JPG)">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} className="text-sm text-slate-500" />
              {uploading && <p className="text-xs text-indigo-500 mt-1">Uploading…</p>}
              {form.file_url && !uploading && (
                <p className="text-xs text-emerald-600 mt-1">✓ File uploaded</p>
              )}
            </Field>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      {tab === 'status' && (
        <div>
          {loadingApps ? (
            <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">No applications yet. Submit one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const s = STATUS[app.status] ?? STATUS.PENDING;
                return (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-semibold text-slate-900">{app.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>

                    {(app.institution || app.course_name) && (
                      <p className="text-sm text-slate-500 mb-2">
                        {[app.institution, app.course_name].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {app.status === 'REJECTED' && app.reject_reason && (
                      <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm text-rose-700">
                        <span className="font-medium">Rejection reason: </span>{app.reject_reason}
                      </div>
                    )}

                    {app.status === 'APPROVED' && app.cert_id && (
                      <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                        <span className="font-medium">Certificate ID: </span>
                        <span className="font-mono">{app.cert_id}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-3">
                      Submitted {new Date(app.created_at).toLocaleDateString()}
                      {app.reviewed_at && ` · Reviewed ${new Date(app.reviewed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Alert({ type, msg, onClose }) {
  const cls = type === 'error'
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-2 mb-4 ${cls}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

const input =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';
