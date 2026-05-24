import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root { height: 100%; }

        .lr-page {
          min-height: 100vh;
          width: 100%;
          background: #03050a;
          display: flex;
          font-family: 'Syne', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .lr-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,255,160,0.015) 2px,
            rgba(0,255,160,0.015) 4px
          );
          pointer-events: none;
          z-index: 100;
        }

        .lr-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .lr-bg svg {
          width: 100%; height: 100%;
          opacity: 0.18;
        }

        .lr-blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          animation: blobPulse 8s ease-in-out infinite;
        }
        .lr-blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(0,255,140,0.08) 0%, transparent 65%);
          top: -200px; right: 100px;
          animation-delay: 0s;
        }
        .lr-blob-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(0,180,255,0.07) 0%, transparent 65%);
          bottom: -150px; left: 0;
          animation-delay: 3s;
        }
        .lr-blob-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(120,0,255,0.06) 0%, transparent 65%);
          top: 40%; left: 40%;
          animation-delay: 6s;
        }
        @keyframes blobPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }

        .lr-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 72px;
          position: relative;
          z-index: 1;
        }

        .lr-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 36px;
        }
        .lr-eyebrow-dot {
          width: 8px; height: 8px;
          background: #00ff9a;
          border-radius: 50%;
          box-shadow: 0 0 10px #00ff9a, 0 0 20px rgba(0,255,154,0.4);
          animation: dotBlink 2s ease-in-out infinite;
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .lr-eyebrow-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 400;
          color: #00ff9a;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .lr-headline {
          font-size: clamp(42px, 5vw, 68px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-bottom: 24px;
        }
        .lr-headline-dim { color: #1a2535; }
        .lr-headline-white { color: #e8f0ff; }
        .lr-headline-accent {
          color: transparent;
          -webkit-text-stroke: 1.5px #00ff9a;
        }

        .lr-desc {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 300;
          color: #3a4d6a;
          line-height: 1.8;
          max-width: 360px;
          margin-bottom: 56px;
          border-left: 2px solid #0d1f35;
          padding-left: 16px;
        }
        .lr-desc span { color: #1e6a4a; }

        .lr-metrics {
          display: flex;
          gap: 0;
        }
        .lr-metric {
          flex: 1;
          padding: 20px 24px;
          border: 1px solid #0d1f35;
          position: relative;
          transition: border-color 0.3s;
        }
        .lr-metric:first-child { border-radius: 8px 0 0 8px; }
        .lr-metric:last-child { border-radius: 0 8px 8px 0; }
        .lr-metric:not(:last-child) { border-right: none; }
        .lr-metric:hover { border-color: #0d3d2a; }
        .lr-metric-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px;
          font-weight: 500;
          color: #00ff9a;
          margin-bottom: 4px;
        }
        .lr-metric-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #1e3550;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .lr-divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, #0d1f35 20%, #0d1f35 80%, transparent);
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        .lr-right {
          width: 520px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 56px;
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        .lr-card {
          width: 100%;
          background: rgba(5, 12, 24, 0.85);
          border: 1px solid #0d2035;
          border-radius: 16px;
          padding: 44px 40px;
          backdrop-filter: blur(24px);
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(16px);
          animation: cardIn 0.5s ease forwards;
          animation-delay: 0.1s;
        }

        .lr-card::before, .lr-card::after {
          content: '';
          position: absolute;
          width: 20px; height: 20px;
          border-color: #00ff9a;
          border-style: solid;
          opacity: 0.5;
        }
        .lr-card::before {
          top: -1px; left: -1px;
          border-width: 2px 0 0 2px;
          border-radius: 16px 0 0 0;
        }
        .lr-card::after {
          bottom: -1px; right: -1px;
          border-width: 0 2px 2px 0;
          border-radius: 0 0 16px 0;
        }

        .lr-card-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #00ff9a;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 24px;
          opacity: 0.6;
        }

        .lr-card-title {
          font-size: 26px;
          font-weight: 700;
          color: #e8f0ff;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .lr-card-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #2a4060;
          margin-bottom: 36px;
        }

        .lr-field { margin-bottom: 20px; }
        .lr-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #2a4a6a;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .lr-label-line {
          flex: 1;
          height: 1px;
          background: #0a1828;
        }

        .lr-input-wrap { position: relative; }
        .lr-input-prefix {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #0d2035;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #1e3550;
          pointer-events: none;
          transition: color 0.2s, border-color 0.2s;
        }
        .lr-input {
          width: 100%;
          background: #040a14;
          border: 1px solid #0d2035;
          border-radius: 8px;
          padding: 13px 16px 13px 52px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #a0c0e0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          caret-color: #00ff9a;
        }
        .lr-input::placeholder { color: #101e30; }
        .lr-input:focus {
          border-color: #00ff9a;
          background: #040e1a;
          box-shadow: 0 0 0 3px rgba(0,255,154,0.06);
        }
        .lr-input-wrap:focus-within .lr-input-prefix {
          color: #00ff9a;
          border-color: #00ff9a;
        }
        .lr-pw-toggle {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #1e3550;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 4px 8px;
          transition: color 0.2s;
        }
        .lr-pw-toggle:hover { color: #00ff9a; }

        .lr-forgot {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 28px;
          margin-top: -8px;
        }
        .lr-forgot a {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #1e3550;
          text-decoration: none;
          transition: color 0.2s;
        }
        .lr-forgot a:hover { color: #00ff9a; }

        .lr-btn {
          width: 100%;
          background: #00ff9a;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #020a06;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .lr-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s;
        }
        .lr-btn:hover:not(:disabled)::before { left: 100%; }
        .lr-btn:hover:not(:disabled) { background: #1affa8; }
        .lr-btn:active:not(:disabled) { transform: scale(0.99); }
        .lr-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .lr-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(2,10,6,0.3);
          border-top-color: #020a06;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lr-bottom {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #070f1c;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }
        .lr-security {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #0d1e30;
          letter-spacing: 1px;
        }
        .lr-security-dot {
          width: 6px; height: 6px;
          background: #0d3d2a;
          border-radius: 50%;
        }
        .lr-register {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #1e3550;
          letter-spacing: 0.5px;
        }
        .lr-register a {
          color: #00ff9a;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .lr-register a:hover { opacity: 0.7; }

        .lr-left > * {
          opacity: 0;
          transform: translateX(-16px);
          animation: slideIn 0.5s ease forwards;
        }
        .lr-eyebrow { animation-delay: 0.05s; }
        .lr-headline { animation-delay: 0.1s; }
        .lr-desc { animation-delay: 0.15s; }
        .lr-metrics { animation-delay: 0.2s; }
        @keyframes cardIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 960px) {
          .lr-left { display: none; }
          .lr-divider { display: none; }
          .lr-right { width: 100%; padding: 32px 24px; }
        }
      `}</style>

      <div className="lr-page">
        <div className="lr-bg">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00ff9a" strokeWidth="0.4"/>
              </pattern>
              <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="0" cy="0" r="1.2" fill="#00ff9a"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#dots)" />
            <path d="M0 200 H300 V350 H600 V200 H900" fill="none" stroke="#00ff9a" strokeWidth="0.8" strokeDasharray="4 8"/>
            <path d="M1440 400 H1100 V550 H800 V400 H500" fill="none" stroke="#00b4ff" strokeWidth="0.8" strokeDasharray="4 8"/>
            <path d="M200 900 V600 H500 V750 H800 V600 H1100 V900" fill="none" stroke="#00ff9a" strokeWidth="0.6" strokeDasharray="4 12"/>
            <circle cx="300" cy="350" r="4" fill="none" stroke="#00ff9a" strokeWidth="1.2"/>
            <circle cx="600" cy="200" r="4" fill="none" stroke="#00ff9a" strokeWidth="1.2"/>
            <circle cx="1100" cy="550" r="4" fill="none" stroke="#00b4ff" strokeWidth="1.2"/>
            <circle cx="500" cy="750" r="3" fill="none" stroke="#00ff9a" strokeWidth="1"/>
            <circle cx="800" cy="600" r="3" fill="none" stroke="#00ff9a" strokeWidth="1"/>
          </svg>
        </div>

        <div className="lr-blob lr-blob-1" />
        <div className="lr-blob lr-blob-2" />
        <div className="lr-blob lr-blob-3" />

        <div className="lr-left">
          <div className="lr-eyebrow">
            <div className="lr-eyebrow-dot" />
            <span className="lr-eyebrow-text">System Online</span>
          </div>
          <h1 className="lr-headline">
            <span className="lr-headline-dim">TRACK</span><br/>
            <span className="lr-headline-white">EVERY</span><br/>
            <span className="lr-headline-accent">BUG.</span>
          </h1>
          <p className="lr-desc">
            Centralized issue tracking for<br/>
            <span>engineering teams.</span> Capture,<br/>
            prioritize, and ship bug-free.
          </p>
          <div className="lr-metrics">
            <div className="lr-metric">
              <div className="lr-metric-val">99.9%</div>
              <div className="lr-metric-label">Uptime</div>
            </div>
            <div className="lr-metric">
              <div className="lr-metric-val">2.4x</div>
              <div className="lr-metric-label">Faster fix</div>
            </div>
            <div className="lr-metric">
              <div className="lr-metric-val">SOC2</div>
              <div className="lr-metric-label">Compliant</div>
            </div>
          </div>
        </div>

        <div className="lr-divider" />

        <div className="lr-right">
          <div className="lr-card">
            <div className="lr-card-tag">// auth.login</div>
            <div className="lr-card-title">Welcome back</div>
            <div className="lr-card-sub">$ sign in to your workspace_</div>

            <form onSubmit={handleLogin}>
              <div className="lr-field">
                <label className="lr-label">
                  Email
                  <span className="lr-label-line" />
                </label>
                <div className="lr-input-wrap">
                  <input
                    type="email"
                    className="lr-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <div className="lr-input-prefix">@</div>
                </div>
              </div>

              <div className="lr-field">
                <label className="lr-label">
                  Password
                  <span className="lr-label-line" />
                </label>
                <div className="lr-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="lr-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: '64px' }}
                  />
                  <div className="lr-input-prefix">##</div>
                  <button
                    type="button"
                    className="lr-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'hide' : 'show'}
                  </button>
                </div>
              </div>

              <div className="lr-forgot">
                <a href="#">Forgot password?</a>
              </div>

              <button type="submit" className="lr-btn" disabled={loading}>
                {loading ? (
                  <><div className="lr-spinner" /> Authenticating...</>
                ) : (
                  <>Execute login &rarr;</>
                )}
              </button>
            </form>

            <div className="lr-bottom">
              <div className="lr-security">
                <div className="lr-security-dot" />
                AES-256 end-to-end encrypted
                <div className="lr-security-dot" />
              </div>
              <div className="lr-register">
                No account?{' '}
                <a href="/register">Create one &rarr;</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}