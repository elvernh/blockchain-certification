import { useState, useEffect } from 'react';
import WalletButton from './components/WalletButton';
import VerifierPortal from './pages/VerifierPortal';
import ApplierPortal from './pages/ApplierPortal';
import AuthenticatorDashboard from './pages/AuthenticatorDashboard';
import { useWallet } from './hooks/useWallet';
import { checkIsIssuer } from './hooks/useContract';

export default function App() {
  const { account, connect, isConnecting } = useWallet();
  const [isAuthenticator, setIsAuthenticator] = useState(false);
  const [roleReady, setRoleReady]             = useState(false);
  const [page, setPage]                       = useState('verify');

  // Determine role when account changes
  useEffect(() => {
    if (!account) {
      setIsAuthenticator(false);
      setRoleReady(false);
      setPage('verify');
      return;
    }
    setRoleReady(false);
    checkIsIssuer(account)
      .then((result) => {
        setIsAuthenticator(result);
        setPage(result ? 'dashboard' : 'apply');
      })
      .catch(() => {
        // Contract unreachable — default to applier
        setIsAuthenticator(false);
        setPage('apply');
      })
      .finally(() => setRoleReady(true));
  }, [account]);

  return (
    <div className="min-h-screen bg-dot-grid">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight">CertChain</span>
          </div>

          {/* Nav tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <NavTab active={page === 'verify'} onClick={() => setPage('verify')}>
              Verify
            </NavTab>

            {account && !isAuthenticator && roleReady && (
              <NavTab active={page === 'apply'} onClick={() => setPage('apply')}>
                My Applications
              </NavTab>
            )}

            {account && isAuthenticator && roleReady && (
              <NavTab active={page === 'dashboard'} onClick={() => setPage('dashboard')}>
                Review Applications
              </NavTab>
            )}
          </div>

          <WalletButton />
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {page === 'verify' && <VerifierPortal />}

        {page === 'apply' && (
          account ? (
            <ApplierPortal account={account} />
          ) : (
            <ConnectPrompt
              title="Connect your wallet"
              description="Connect your Rabby Wallet to submit and track your certificate applications."
              connect={connect}
              isConnecting={isConnecting}
            />
          )
        )}

        {page === 'dashboard' && (
          account && isAuthenticator ? (
            <AuthenticatorDashboard />
          ) : (
            <ConnectPrompt
              title="Authenticator access only"
              description="This dashboard is restricted to registered authenticators."
              connect={connect}
              isConnecting={isConnecting}
            />
          )
        )}
      </main>
    </div>
  );
}

function NavTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function ConnectPrompt({ title, description, connect, isConnecting }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
        <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <div>
        <p className="text-slate-900 font-semibold text-base">{title}</p>
        <p className="text-slate-500 text-sm mt-1">{description}</p>
      </div>
      <button
        onClick={connect}
        disabled={isConnecting}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        {isConnecting ? 'Connecting…' : 'Connect Rabby Wallet'}
      </button>
    </div>
  );
}
