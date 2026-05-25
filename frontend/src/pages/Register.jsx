import { useState } from 'react';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '', role: 'DEVELOPER' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColor = ['', '#e24b4a', '#ef9f27', '#1ec878'][strength];
  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'][strength];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          min-height: 100vh;
          background: #080c14;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(30,200,120,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,200,120,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .glow-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(30,200,120,0.15) 0%, transparent 70%);
          top: -100px; left: -100px;
        }
        .glow-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(56,120,255,0.12) 0%, transparent 70%);
          bottom: -80px; right: -80px;
        }

        .left-panel {
          flex: 1;
          display: flex; flex-direction: column; justify-content: center;
          padding: 64px; position: relative; z-index: 1;
        }

        .brand-tag {
          font-family: 'Space Mono', monospace;
          font-size: 11px; color: #1ec878;
          letter-spacing: 3px; text-transform: uppercase;
          margin-bottom: 24px;
          display: flex; align-items: center; gap: 8px;
        }
        .brand-tag::before {
          content: ''; display: inline-block;
          width: 24px; height: 1px; background: #1ec878;
        }

        .hero-title {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 300; color: #e8edf5;
          line-height: 1.15; margin-bottom: 20px; letter-spacing: -1px;
        }
        .hero-title strong { font-weight: 600; color: #ffffff; }
        .hero-title .accent { color: #1ec878; font-weight: 600; }

        .hero-sub {
          font-size: 15px; color: #6b7a94;
          line-height: 1.7; max-width: 380px; margin-bottom: 48px;
        }

        .steps { display: flex; flex-direction: column; gap: 20px; }
        .step { display: flex; align-items: flex-start; gap: 16px; }
        .step-num {
          font-family: 'Space Mono', monospace;
          font-size: 11px; color: #1ec878;
          border: 1px solid rgba(30,200,120,0.3);
          border-radius: 6px; padding: 3px 8px;
          flex-shrink: 0; margin-top: 2px;
        }
        .step-text strong { display: block; font-size: 14px; font-weight: 600; color: #e8edf5; margin-bottom: 2px; }
        .step-text span { font-size: 13px; color: #4a5568; }

        .divider-v {
          width: 1px; background: rgba(255,255,255,0.06);
          margin: 0 40px; position: relative; z-index: 1;
        }

        .right-panel {
          width: 500px;
          display: flex; align-items: center; justify-content: center;
          padding: 40px; position: relative; z-index: 1;
          overflow-y: auto;
        }

        .reg-card {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 36px;
          backdrop-filter: blur(20px);
        }

        .card-header { margin-bottom: 28px; }
        .card-header h2 { font-size: 22px; font-weight: 600; color: #ffffff; margin-bottom: 6px; }
        .card-header p { font-size: 14px; color: #4a5568; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .form-group { margin-bottom: 14px; }
        .form-group.no-mb { margin-bottom: 0; }

        .form-label {
          display: block; font-size: 11px; font-weight: 500;
          color: #6b7a94; text-transform: uppercase;
          letter-spacing: 1px; margin-bottom: 7px;
        }

        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          color: #3a4458; font-size: 15px; pointer-events: none;
        }
        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px 13px 12px 40px;
          font-size: 14px; color: #e8edf5;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
        }
        .form-input::placeholder { color: #3a4458; }
        .form-input:focus {
          border-color: rgba(30,200,120,0.4);
          background: rgba(30,200,120,0.04);
        }
        .form-select {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px 13px 12px 40px;
          font-size: 14px; color: #e8edf5;
          font-family: 'DM Sans', sans-serif;
          outline: none; cursor: pointer;
          transition: border-color 0.2s;
          appearance: none;
        }
        .form-select:focus { border-color: rgba(30,200,120,0.4); }
        .form-select option { background: #0f1520; color: #e8edf5; }

        .toggle-pw {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; color: #3a4458;
          cursor: pointer; font-size: 15px; transition: color 0.2s;
        }
        .toggle-pw:hover { color: #6b7a94; }

        .strength-row {
          display: flex; gap: 4px; align-items: center; margin-top: 7px;
        }
        .strength-seg {
          flex: 1; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .strength-label { font-size: 11px; margin-left: 6px; transition: color 0.3s; }

        .btn-register {
          width: 100%;
          background: #1ec878; border: none; border-radius: 10px;
          padding: 14px; font-size: 15px; font-weight: 600;
          color: #080c14; font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 6px;
        }
        .btn-register:hover:not(:disabled) {
          background: #26e88a;
          box-shadow: 0 0 24px rgba(30,200,120,0.35);
        }
        .btn-register:active:not(:disabled) { transform: scale(0.99); }
        .btn-register:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(8,12,20,0.3);
          border-top-color: #080c14; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-link {
          text-align: center; margin-top: 18px;
          font-size: 13px; color: #4a5568;
        }
        .login-link a {
          color: #1ec878; text-decoration: none; font-weight: 600;
        }
        .login-link a:hover { text-decoration: underline; }

        .success-box { text-align: center; padding: 16px 0; }
        .success-icon { font-size: 48px; margin-bottom: 16px; }
        .success-box h3 { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 8px; }
        .success-box p { font-size: 14px; color: #4a5568; margin-bottom: 24px; }
        .btn-go-login {
          display: inline-block; background: #1ec878;
          color: #080c14; font-weight: 600; font-size: 14px;
          padding: 12px 32px; border-radius: 10px;
          text-decoration: none; transition: background 0.2s;
        }
        .btn-go-login:hover { background: #26e88a; }

        @media (max-width: 900px) {
          .left-panel { display: none; }
          .divider-v { display: none; }
          .right-panel { width: 100%; padding: 24px; }
          .reg-root { justify-content: center; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="reg-root">
        <div className="grid-bg" />
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />

        <div className="left-panel">
          <div className="brand-tag">Bug Tracking System</div>
          <h1 className="hero-title">
            Join your<br />
            <strong>team's <span className="accent">workspace.</span></strong>
          </h1>
          <p className="hero-sub">
            Create your account and start collaborating with your team to track, prioritize, and resolve bugs faster.
          </p>
          <div className="steps">
            <div className="step">
              <span className="step-num">01</span>
              <div className="step-text">
                <strong>Create your account</strong>
                <span>Fill in your details to get started</span>
              </div>
            </div>
            <div className="step">
              <span className="step-num">02</span>
              <div className="step-text">
                <strong>Join or create a project</strong>
                <span>Collaborate with your engineering team</span>
              </div>
            </div>
            <div className="step">
              <span className="step-num">03</span>
              <div className="step-text">
                <strong>Start tracking bugs</strong>
                <span>Capture, assign and resolve issues</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-v" />

        <div className="right-panel">
          <div className="reg-card">
            {success ? (
              <div className="success-box">
                <div className="success-icon">✅</div>
                <h3>Account created!</h3>
                <p>Your account has been successfully created.<br />You can now sign in.</p>
                <a href="/#/" className="btn-go-login">Go to Login →</a>
              </div>
            ) : (
              <>
                <div className="card-header">
                  <h2>Create account</h2>
                  <p>Fill in your details below</p>
                </div>

                <form onSubmit={handleRegister}>
                  <div className="form-row">
                    <div className="form-group no-mb">
                      <label className="form-label">Full name</label>
                      <div className="input-wrap">
                        <span className="input-icon">👤</span>
                        <input name="fullName" type="text" placeholder="John Doe"
                          className="form-input" value={form.fullName}
                          onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="form-group no-mb">
                      <label className="form-label">Username</label>
                      <div className="input-wrap">
                        <span className="input-icon" style={{fontStyle:'normal',fontWeight:600,fontSize:'14px'}}>@</span>
                        <input name="username" type="text" placeholder="johndoe"
                          className="form-input" value={form.username}
                          onChange={handleChange} required />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div className="input-wrap">
                      <span className="input-icon">✉</span>
                      <input name="email" type="email" placeholder="you@company.com"
                        className="form-input" value={form.email}
                        onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div className="input-wrap">
                      <span className="input-icon">🎭</span>
                      <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                        <option value="DEVELOPER">Developer</option>
                        <option value="USER">User</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-wrap">
                      <span className="input-icon">🔒</span>
                      <input name="password" type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        className="form-input" value={form.password}
                        onChange={handleChange} required minLength={6} />
                      <button type="button" className="toggle-pw"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? '🙈' : '👁'}
                      </button>
                    </div>
                    <div className="strength-row">
                      {[1,2,3].map(i => (
                        <div key={i} className="strength-seg"
                          style={{ background: strength >= i ? strengthColor : 'rgba(255,255,255,0.08)' }} />
                      ))}
                      {form.password.length > 0 &&
                        <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                      }
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm password</label>
                    <div className="input-wrap">
                      <span className="input-icon">🔒</span>
                      <input name="confirmPassword" type={showPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        className="form-input"
                        style={form.confirmPassword && form.confirmPassword !== form.password
                          ? { borderColor: 'rgba(226,75,74,0.5)' } : {}}
                        value={form.confirmPassword}
                        onChange={handleChange} required />
                    </div>
                  </div>

                  <button type="submit" className="btn-register" disabled={loading}>
                    {loading
                      ? <><div className="spinner" /> Creating account...</>
                      : 'Create account →'}
                  </button>
                </form>

                <div className="login-link">
                  Already have an account? <a href="/#/">Sign in</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
