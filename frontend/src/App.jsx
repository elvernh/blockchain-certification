import { useState } from 'react';
import WalletButton from './components/WalletButton';
import IssueCertForm from './components/IssueCertForm';
import RevokeCertForm from './components/RevokeCertForm';
import VerifierPortal from './pages/VerifierPortal';
import { useWallet } from './hooks/useWallet';

export default function App() {
  const [page, setPage] = useState('verify');
  const [dashTab, setDashTab] = useState('issue');
  const { account } = useWallet();

  return (
    <div className="min-h-screen bg-dot-grid">
      {/* Navbar */}
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
            <NavTab active={page === 'verify'} onClick={() => setPage('verify')}>Verify</NavTab>
            <NavTab active={page === 'dashboard'} onClick={() => setPage('dashboard')}>Issuer Dashboard</NavTab>
          </div>

          <WalletButton />
        </nav>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {page === 'verify' && <VerifierPortal />}

        {page === 'dashboard' && (
          account ? (
            <div className="space-y-6">
              {/* Dashboard tab switcher */}
              <div className="flex gap-3 border-b border-slate-200 pb-0">
                <DashTab active={dashTab === 'issue'} onClick={() => setDashTab('issue')}>
                  Issue Certificate
                </DashTab>
                <DashTab active={dashTab === 'revoke'} color="rose" onClick={() => setDashTab('revoke')}>
                  Revoke Certificate
                </DashTab>
              </div>
              {dashTab === 'issue'  && <IssueCertForm />}
              {dashTab === 'revoke' && <RevokeCertForm />}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-900 font-semibold text-base">Wallet required</p>
                <p className="text-slate-500 text-sm mt-1">Connect your Rabby Wallet to access the Issuer Dashboard.</p>
              </div>
              <WalletButton />
            </div>
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
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function DashTab({ active, color = 'indigo', onClick, children }) {
  const activeClass = color === 'rose'
    ? 'text-rose-600 border-rose-500'
    : 'text-indigo-600 border-indigo-500';
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
        active ? activeClass : 'text-slate-400 border-transparent hover:text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
