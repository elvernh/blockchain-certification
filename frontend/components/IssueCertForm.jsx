import { useState } from 'react';
import { issueCertificate } from '../hooks/useContract';

export default function IssueCertForm() {
  const [form, setForm] = useState({
    certIdStr: '', holderAddress: '', name: '', expiryDate: '', metadataHash: ''
  });
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const receipt = await issueCertificate(form);
      setTxHash(receipt.transactionHash);
      setStatus('success');
      setForm({ certIdStr: '', holderAddress: '', name: '', expiryDate: '', metadataHash: '' });
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border">
      <h2 className="text-lg font-semibold text-gray-800">Issue New Certificate</h2>

      <input
        placeholder="Certificate ID (e.g. CERT-2025-001)"
        value={form.certIdStr}
        onChange={e => setForm({...form, certIdStr: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        required
      />
      <input
        placeholder="Holder Wallet Address (0x...)"
        value={form.holderAddress}
        onChange={e => setForm({...form, holderAddress: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
        required
      />
      <input
        placeholder="Certificate Name (e.g. AWS Solutions Architect)"
        value={form.name}
        onChange={e => setForm({...form, name: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        required
      />
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Expiry Date</label>
        <input
          type="date"
          value={form.expiryDate}
          onChange={e => setForm({...form, expiryDate: e.target.value})}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          required
        />
      </div>
      <input
        placeholder="Metadata Hash (SHA-256 of PDF file)"
        value={form.metadataHash}
        onChange={e => setForm({...form, metadataHash: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
        required
      />

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {status === 'loading' ? 'Waiting for MetaMask...' : 'Issue Certificate'}
      </button>

      {status === 'success' && (
        <p className="text-sm text-green-600 break-all">
          ✓ Issued! Tx: {txHash}
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}