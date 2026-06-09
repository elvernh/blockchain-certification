import { useState } from 'react';
import WalletButton from './components/WalletButton';
import LandingPage from './pages/LandingPage';
import VerifierPortal from './pages/VerifierPortal';
import ApplierPortal from './pages/ApplierPortal';
import AuthenticatorDashboard from './pages/AuthenticatorDashboard';
import { useWallet } from './hooks/useWallet';

// page keys: 'home' | 'viewer' | 'applier' | 'authenticator'

const NAV = [
  { key: 'viewer',        label: 'Viewer',        color: 'indigo' },
  { key: 'applier',       label: 'Applier',        color: 'emerald' },
  { key: 'authenticator', label: 'Authenticator',  color: 'violet' },
];

const COLOR = {
  indigo:  { active: 'bg-white text-indigo-600 shadow-sm',  dot: 'bg-indigo-500' },
  emerald: { active: 'bg-white text-emerald-600 shadow-sm', dot: 'bg-emerald-500' },
  violet:  { active: 'bg-white text-violet-600 shadow-sm',  dot: 'bg-violet-500' },
};

export default function App() {
  const { account, connect, isConnecting } = useWallet();
  const [page, setPage] = useState('home');

  return (
    <div className="min-h-screen bg-dot-grid">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

          {/* Brand — always returns home */}
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
              CertChain
            </span>
          </button>

          {/* Portal tabs — all three always visible */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {NAV.map(({ key, label, color }) => {
              const active = page === key;
              const c = COLOR[color];
              return (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    active ? c.active : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {active && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
                  {label}
                </button>
              );
            })}
          </div>

          <WalletButton />
        </nav>
      </header>

      <main>
        {page === 'home' && <LandingPage onEnter={setPage} />}

        {page === 'viewer' && (
          <div className="max-w-5xl mx-auto px-6 py-10">
            <PortalHeader
              color="indigo"
              icon={<EyeIcon />}
              title="Viewer Portal"
              subtitle="Verify certificate authenticity — no wallet needed"
            />
            <VerifierPortal />
          </div>
        )}

        {page === 'applier' && (
          <div className="max-w-5xl mx-auto px-6 py-10">
            <PortalHeader
              color="emerald"
              icon={<DocIcon />}
              title="Applier Portal"
              subtitle="Submit your certificate for authentication"
            />
            {account ? (
              <ApplierPortal account={account} />
            ) : (
              <ConnectPrompt
                color="emerald"
                title="Connect your wallet to continue"
                description="You need to connect your Rabby Wallet to submit and track your certificate applications."
                connect={connect}
                isConnecting={isConnecting}
              />
            )}
          </div>
        )}

        {page === 'authenticator' && (
          <div className="max-w-5xl mx-auto px-6 py-10">
            <PortalHeader
              color="violet"
              icon={<BadgeIcon />}
              title="Authenticator Dashboard"
              subtitle="Review and certify certificate applications on-chain"
            />
            {account ? (
              <AuthenticatorDashboard />
            ) : (
              <ConnectPrompt
                color="violet"
                title="Connect your issuer wallet"
                description="This dashboard is restricted to wallets registered as issuers on the smart contract."
                connect={connect}
                isConnecting={isConnecting}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function PortalHeader({ color, icon, title, subtitle }) {
  const bg   = { indigo: 'bg-indigo-100',  emerald: 'bg-emerald-100',  violet: 'bg-violet-100'  }[color];
  const text = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', violet: 'text-violet-600' }[color];
  const bar  = { indigo: 'bg-indigo-500',  emerald: 'bg-emerald-500',  violet: 'bg-violet-500'  }[color];

  return (
    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
      <div className={`w-11 h-11 rounded-xl ${bg} ${text} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex items-start gap-3">
        <div className={`w-1 h-10 rounded-full ${bar} shrink-0 mt-0.5`} />
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ConnectPrompt({ color, title, description, connect, isConnecting }) {
  const btn = { indigo: 'bg-indigo-600 hover:bg-indigo-700', emerald: 'bg-emerald-600 hover:bg-emerald-700', violet: 'bg-violet-600 hover:bg-violet-700' }[color];
  const ring = { indigo: 'bg-indigo-100', emerald: 'bg-emerald-100', violet: 'bg-violet-100' }[color];
  const icon = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', violet: 'text-violet-600' }[color];

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center">
      <div className={`w-14 h-14 rounded-2xl ${ring} ${icon} flex items-center justify-center`}>
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <div>
        <p className="text-slate-900 font-semibold">{title}</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">{description}</p>
      </div>
      <button
        onClick={connect}
        disabled={isConnecting}
        className={`${btn} disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors`}
      >
        {isConnecting ? 'Connecting…' : 'Connect Rabby Wallet'}
      </button>
    </div>
  );
}

/* ── Icons ──────────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DocIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const BadgeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
);
