'use client';
// components/auth/AuthInput.tsx
// Reusable styled input and select for auth forms.
// Keeps all the cyberpunk input styling in one component.

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightElement?: React.ReactNode;
}

interface AuthSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function AuthInput({ label, rightElement, ...props }: AuthInputProps) {
  return (
    <>
      <style>{`
        .ai-field { display:flex;flex-direction:column;gap:6px; }
        .ai-label { font-size:.67rem;font-weight:600;text-transform:uppercase;
          letter-spacing:.12em;color:rgba(255,255,255,.35); }
        .ai-wrap { position:relative; }
        .ai-input {
          width:100%;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);
          padding:12px 15px;border-radius:4px;color:#fff;font-family:'Exo 2',sans-serif;
          font-size:.9rem;font-weight:500;outline:none;transition:.22s;box-sizing:border-box;
        }
        .ai-input::placeholder { color:rgba(255,255,255,.18); }
        .ai-input:focus { border-color:#00dcff;background:rgba(0,220,255,.04);
          box-shadow:0 0 0 3px rgba(0,220,255,.08); }
        .ai-input-pr { padding-right:44px; }
        .ai-glow { position:absolute;bottom:0;left:10%;width:80%;height:1px;
          background:linear-gradient(90deg,transparent,#00dcff,transparent);
          opacity:0;transition:.3s;pointer-events:none;border-radius:9px; }
        .ai-input:focus ~ .ai-glow { opacity:1; }
        .ai-right { position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;color:rgba(255,255,255,.28);cursor:pointer;
          padding:4px;display:flex;align-items:center;transition:.2s;line-height:0; }
        .ai-right:hover { color:#00dcff; }
      `}</style>
      <div className="ai-field">
        <label className="ai-label">{label}</label>
        <div className="ai-wrap">
          <input
            className={`ai-input${rightElement ? ' ai-input-pr' : ''}`}
            {...props}
          />
          {rightElement && <span className="ai-right">{rightElement}</span>}
          <span className="ai-glow" />
        </div>
      </div>
    </>
  );
}

export function AuthSelect({ label, options, ...props }: AuthSelectProps) {
  return (
    <div className="ai-field">
      <label className="ai-label">{label}</label>
      <div className="ai-wrap">
        <select
          className="ai-input"
          style={{ appearance:'none', color: props.value ? '#fff' : 'rgba(255,255,255,.35)' }}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background:'#0a1020' }}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="ai-glow" />
      </div>
    </div>
  );
}

export function AuthButton({
  children, loading, loadingText = 'Loading...', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingText?: string }) {
  return (
    <>
      <style>{`
        .ab-btn {
          width:100%;position:relative;overflow:hidden;
          background:linear-gradient(105deg,#00b8d4,#8c3cff);
          border:none;padding:15px;border-radius:4px;color:#fff;
          font-family:'Orbitron',monospace;font-weight:600;font-size:.72rem;
          letter-spacing:.18em;text-transform:uppercase;cursor:pointer;
          transition:.2s;box-shadow:0 0 30px rgba(0,184,212,.2);margin-top:6px;
        }
        .ab-btn::before { content:'';position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.14) 50%,transparent 65%);
          transform:translateX(-120%);transition:.55s ease; }
        .ab-btn:hover::before { transform:translateX(120%); }
        .ab-btn:hover:not(:disabled) { transform:translateY(-1px);
          box-shadow:0 0 40px rgba(0,184,212,.35); }
        .ab-btn:disabled { opacity:.55;cursor:not-allowed; }
        .ab-inner { display:flex;align-items:center;justify-content:center;
          gap:9px;position:relative;z-index:1; }
        .ab-spin { width:15px;height:15px;border:2px solid rgba(255,255,255,.3);
          border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg);} }
      `}</style>
      <button className="ab-btn" disabled={loading} {...props}>
        <span className="ab-inner">
          {loading ? <><span className="ab-spin" />{loadingText}</> : children}
        </span>
      </button>
    </>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <>
      <style>{`
        .ae-error { background:rgba(255,40,80,.09);border:1px solid rgba(255,40,80,.28);
          border-radius:4px;color:#ff6080;font-size:.82rem;padding:10px 14px;
          margin-bottom:16px;animation:shake .35s both; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
      `}</style>
      <div className="ae-error">{message}</div>
    </>
  );
}
