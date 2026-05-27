import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const { account, connect, disconnect, isConnecting, error } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {account ? (
        <>
          <span className="text-sm text-green-600 font-mono">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm hover:bg-red-200 transition"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}