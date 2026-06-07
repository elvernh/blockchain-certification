export default function LandingPage({ onEnter }) {
  const roles = [
    {
      key: 'viewer',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      accent: 'indigo',
      title: 'Viewer',
      subtitle: 'Verify authenticity',
      description:
        'Look up any certificate by its ID or the holder\'s wallet address to confirm it was authenticated on-chain by a trusted authority.',
      action: 'Open Viewer Portal',
      badge: 'No wallet required',
      badgeColor: 'bg-indigo-50 text-indigo-600',
    },
    {
      key: 'applier',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      accent: 'emerald',
      title: 'Applier',
      subtitle: 'Submit for authentication',
      description:
        'Upload your certificate and submit it for review. Track your application status and get notified when it\'s approved or rejected.',
      action: 'Open Applier Portal',
      badge: 'Wallet required',
      badgeColor: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'authenticator',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      ),
      accent: 'violet',
      title: 'Authenticator',
      subtitle: 'Review & certify',
      description:
        'Review pending certificate applications, verify their legitimacy, and issue them on-chain — or reject with a reason sent back to the applicant.',
      action: 'Open Authenticator Dashboard',
      badge: 'Issuer wallet required',
      badgeColor: 'bg-violet-50 text-violet-600',
    },
  ];

  const accentMap = {
    indigo: {
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      border: 'hover:border-indigo-200',
      ring: 'focus-visible:ring-indigo-500',
    },
    emerald: {
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
      border: 'hover:border-emerald-200',
      ring: 'focus-visible:ring-emerald-500',
    },
    violet: {
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
      btn: 'bg-violet-600 hover:bg-violet-700',
      border: 'hover:border-violet-200',
      ring: 'focus-visible:ring-violet-500',
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-14 space-y-3">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Blockchain Certificate Authentication
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          A tamper-proof system for issuing, submitting, and verifying academic and professional certificates on-chain.
        </p>
        <p className="text-sm text-slate-400">Choose your role to get started.</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const a = accentMap[role.accent];
          return (
            <div
              key={role.key}
              className={`bg-white border border-slate-200 ${a.border} rounded-2xl shadow-sm p-7 flex flex-col gap-5 transition-all duration-150`}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${a.iconBg} ${a.iconText} flex items-center justify-center`}>
                  {role.icon}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${role.badgeColor}`}>
                  {role.badge}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">{role.title}</h2>
                <p className="text-sm font-medium text-slate-400 mb-2">{role.subtitle}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{role.description}</p>
              </div>

              {/* CTA */}
              <button
                onClick={() => onEnter(role.key)}
                className={`w-full ${a.btn} text-white text-sm font-medium py-2.5 rounded-xl transition-colors`}
              >
                {role.action}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
