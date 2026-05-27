import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const { account, connect, disconnect, isConnecting, error } = useWallet();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {error && (
        <span className="hidden sm:block text-xs text-rose-500 max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
      {account ? (
        <button
          onClick={disconnect}
          title="Click to disconnect"
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 pl-2 pr-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          {account.slice(0, 6)}…{account.slice(-4)}
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          {isConnecting ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Connecting…
            </>
          ) : (
            'Connect Rabby'
          )}
        </button>
      )}
    </div>
  );
}
