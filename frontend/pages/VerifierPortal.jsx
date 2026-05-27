import { useState } from 'react';
import { verifyCertificate, toBytes32 } from '../hooks/useContract';

const STATUS_STYLES = {
  VALID:    'bg-green-100 text-green-800',
  REVOKED:  'bg-red-100 text-red-800',
  EXPIRED:  'bg-yellow-100 text-yellow-800',
  UNKNOWN:  'bg-gray-100 text-gray-700',
};

export default function VerifierPortal() {
  const [certIdStr, setCertIdStr] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const certId = toBytes32(certIdStr);
      const data = await verifyCertificate(certId);
      setResult(data);
    } catch (err) {
      setError(err.message); // e.g. "Certificate not found"
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Certificate</h1>
      <p className="text-sm text-gray-500 mb-6">No wallet required. Enter a Certificate ID to check its status.</p>

      <form onSubmit={handleVerify} className="flex gap-2 mb-6">
        <input
          value={certIdStr}
          onChange={e => setCertIdStr(e.target.value)}
          placeholder="Certificate ID (e.g. CERT-2025-001)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Verify'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{result.cert.name}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[result.status]}`}>
              {result.status}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Holder:</span> <span className="font-mono">{result.cert.holder}</span></p>
            <p><span className="font-medium">Issuer:</span> <span className="font-mono">{result.cert.issuer}</span></p>
            <p><span className="font-medium">Issued:</span> {result.cert.issuedAt}</p>
            <p><span className="font-medium">Expires:</span> {result.cert.expiresAt}</p>
            {result.cert.revokeReason && (
              <p className="text-red-600"><span className="font-medium">Revoked because:</span> {result.cert.revokeReason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}