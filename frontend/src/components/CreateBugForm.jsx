import { useState, useEffect } from 'react';
import api from '../services/api';

export default function CreateBugForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM',
    projectId: '', moduleId: '', assigneeId: '', environment: '', version: '', dueDate: ''
  });
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.projectId) {
      api.get(`/projects/${form.projectId}/modules`)
        .then(r => setModules(r.data))
        .catch(() => setModules([]));
      setForm(f => ({ ...f, moduleId: '' }));
    } else {
      setModules([]);
    }
  }, [form.projectId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.severity) e.severity = 'Severity is required';
    if (!form.priority) e.priority = 'Priority is required';
    if (!form.projectId) e.projectId = 'Project is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/bugs', {
        ...form,
        moduleId: form.moduleId || null,
        assigneeId: form.assigneeId || null,
        attachments: files.map(f => f.name)
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi hệ thống, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const severityColors = { CRITICAL: '#e24b4a', HIGH: '#ef9f27', MEDIUM: '#3b82f6', LOW: '#1ec878' };
  const priorityColors = { HIGHEST: '#e24b4a', HIGH: '#ef9f27', MEDIUM: '#3b82f6', LOW: '#6b7a94', LOWEST: '#374151' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .cbf-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(4, 7, 13, 0.85);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; font-family: 'DM Sans', sans-serif;
        }

        .cbf-modal {
          width: 100%; max-width: 780px; max-height: 92vh;
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0,0,0,0.6);
        }

        .cbf-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .cbf-header-left { display: flex; align-items: center; gap: 12px; }
        .cbf-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(30,200,120,0.12);
          border: 1px solid rgba(30,200,120,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .cbf-header h2 { font-size: 17px; font-weight: 600; color: #fff; margin: 0; }
        .cbf-header p { font-size: 12px; color: #4a5568; margin: 2px 0 0; }
        .cbf-close {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: #6b7a94; font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .cbf-close:hover { background: rgba(226,75,74,0.15); color: #e24b4a; border-color: rgba(226,75,74,0.3); }

        .cbf-body {
          flex: 1; overflow-y: auto; padding: 24px 28px;
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .cbf-section { margin-bottom: 24px; }
        .cbf-section-title {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #1ec878;
          text-transform: uppercase; letter-spacing: 2px;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .cbf-section-title::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(30,200,120,0.15);
        }

        .cbf-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .cbf-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

        .cbf-field { display: flex; flex-direction: column; gap: 6px; }
        .cbf-label {
          font-size: 11px; font-weight: 500; color: #6b7a94;
          text-transform: uppercase; letter-spacing: 0.8px;
          display: flex; align-items: center; gap: 4px;
        }
        .cbf-required { color: #e24b4a; }

        .cbf-input, .cbf-select, .cbf-textarea {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px; color: #e8edf5;
          font-family: 'DM Sans', sans-serif;
          outline: none; width: 100%;
          transition: border-color 0.2s, background 0.2s;
        }
        .cbf-input::placeholder, .cbf-textarea::placeholder { color: #2d3748; }
        .cbf-input:focus, .cbf-select:focus, .cbf-textarea:focus {
          border-color: rgba(30,200,120,0.4);
          background: rgba(30,200,120,0.03);
        }
        .cbf-input.error, .cbf-select.error, .cbf-textarea.error {
          border-color: rgba(226,75,74,0.5);
          background: rgba(226,75,74,0.03);
        }
        .cbf-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .cbf-select { appearance: none; cursor: pointer; }
        .cbf-select option { background: #0d1117; }

        .cbf-error-msg { font-size: 11px; color: #e24b4a; margin-top: 2px; }

        .severity-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .sev-btn {
          padding: 9px 6px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; text-align: center; border: 1px solid transparent;
          transition: all 0.2s; background: rgba(255,255,255,0.03);
          color: #6b7a94; font-family: 'DM Sans', sans-serif;
        }
        .sev-btn:hover { border-color: rgba(255,255,255,0.15); color: #e8edf5; }
        .sev-btn.active-CRITICAL { background: rgba(226,75,74,0.15); border-color: #e24b4a; color: #e24b4a; }
        .sev-btn.active-HIGH { background: rgba(239,159,39,0.15); border-color: #ef9f27; color: #ef9f27; }
        .sev-btn.active-MEDIUM { background: rgba(59,130,246,0.15); border-color: #3b82f6; color: #3b82f6; }
        .sev-btn.active-LOW { background: rgba(30,200,120,0.15); border-color: #1ec878; color: #1ec878; }

        .priority-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        .pri-btn {
          padding: 9px 4px; border-radius: 8px; font-size: 11px; font-weight: 600;
          cursor: pointer; text-align: center; border: 1px solid transparent;
          transition: all 0.2s; background: rgba(255,255,255,0.03);
          color: #6b7a94; font-family: 'DM Sans', sans-serif;
        }
        .pri-btn:hover { border-color: rgba(255,255,255,0.15); color: #e8edf5; }
        .pri-btn.active-HIGHEST { background: rgba(226,75,74,0.15); border-color: #e24b4a; color: #e24b4a; }
        .pri-btn.active-HIGH { background: rgba(239,159,39,0.15); border-color: #ef9f27; color: #ef9f27; }
        .pri-btn.active-MEDIUM { background: rgba(59,130,246,0.15); border-color: #3b82f6; color: #3b82f6; }
        .pri-btn.active-LOW { background: rgba(107,122,148,0.15); border-color: #6b7a94; color: #6b7a94; }
        .pri-btn.active-LOWEST { background: rgba(55,65,81,0.3); border-color: #374151; color: #4a5568; }

        .file-drop {
          border: 1px dashed rgba(255,255,255,0.1); border-radius: 10px;
          padding: 20px; text-align: center; cursor: pointer;
          transition: all 0.2s; background: rgba(255,255,255,0.02);
        }
        .file-drop:hover { border-color: rgba(30,200,120,0.3); background: rgba(30,200,120,0.02); }
        .file-drop-icon { font-size: 24px; margin-bottom: 6px; }
        .file-drop-text { font-size: 13px; color: #4a5568; }
        .file-drop-text span { color: #1ec878; }
        .file-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .file-tag {
          background: rgba(30,200,120,0.08); border: 1px solid rgba(30,200,120,0.2);
          border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #1ec878;
          display: flex; align-items: center; gap: 6px;
        }
        .file-tag button {
          background: none; border: none; color: #e24b4a;
          cursor: pointer; font-size: 13px; padding: 0; line-height: 1;
        }

        .cbf-footer {
          padding: 18px 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; justify-content: flex-end; gap: 10px;
          flex-shrink: 0;
        }
        .btn-cancel {
          padding: 11px 22px; border-radius: 10px; font-size: 14px; font-weight: 500;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: #6b7a94; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.08); color: #e8edf5; }
        .btn-submit {
          padding: 11px 28px; border-radius: 10px; font-size: 14px; font-weight: 600;
          background: #1ec878; border: none; color: #080c14;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .btn-submit:hover:not(:disabled) { background: #26e88a; box-shadow: 0 0 20px rgba(30,200,120,0.3); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          width: 14px; height: 14px; border: 2px solid rgba(8,12,20,0.3);
          border-top-color: #080c14; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .cbf-grid-2, .cbf-grid-3 { grid-template-columns: 1fr; }
          .severity-grid { grid-template-columns: repeat(2,1fr); }
          .priority-grid { grid-template-columns: repeat(3,1fr); }
        }
      `}</style>

      <div className="cbf-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div className="cbf-modal">
          <div className="cbf-header">
            <div className="cbf-header-left">
              <div className="cbf-icon">🐛</div>
              <div>
                <h2>New Bug Report</h2>
                <p>Fill in the details to create a new bug</p>
              </div>
            </div>
            <button className="cbf-close" onClick={onClose}>✕</button>
          </div>

          <div className="cbf-body">
            <form onSubmit={handleSubmit} id="bug-form">

              {/* Basic Info */}
              <div className="cbf-section">
                <div className="cbf-section-title">Basic Information</div>
                <div className="cbf-field" style={{marginBottom:'14px'}}>
                  <label className="cbf-label">Title <span className="cbf-required">*</span></label>
                  <input name="title" className={`cbf-input ${errors.title ? 'error' : ''}`}
                    placeholder="Short, descriptive bug title..."
                    value={form.title} onChange={handleChange} />
                  {errors.title && <span className="cbf-error-msg">⚠ {errors.title}</span>}
                </div>
                <div className="cbf-field">
                  <label className="cbf-label">Description / Steps to Reproduce <span className="cbf-required">*</span></label>
                  <textarea name="description" className={`cbf-textarea ${errors.description ? 'error' : ''}`}
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe that..."
                    value={form.description} onChange={handleChange} />
                  {errors.description && <span className="cbf-error-msg">⚠ {errors.description}</span>}
                </div>
              </div>

              {/* Severity */}
              <div className="cbf-section">
                <div className="cbf-section-title">Severity <span style={{color:'#e24b4a',fontSize:'10px'}}>*</span></div>
                <div className="severity-grid">
                  {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
                    <button key={s} type="button"
                      className={`sev-btn ${form.severity === s ? `active-${s}` : ''}`}
                      onClick={() => { setForm({...form, severity: s}); setErrors({...errors, severity:''}); }}>
                      {s === 'CRITICAL' ? '🔴' : s === 'HIGH' ? '🟠' : s === 'MEDIUM' ? '🔵' : '🟢'} {s}
                    </button>
                  ))}
                </div>
                {errors.severity && <span className="cbf-error-msg">⚠ {errors.severity}</span>}
              </div>

              {/* Priority */}
              <div className="cbf-section">
                <div className="cbf-section-title">Priority <span style={{color:'#e24b4a',fontSize:'10px'}}>*</span></div>
                <div className="priority-grid">
                  {['HIGHEST','HIGH','MEDIUM','LOW','LOWEST'].map(p => (
                    <button key={p} type="button"
                      className={`pri-btn ${form.priority === p ? `active-${p}` : ''}`}
                      onClick={() => { setForm({...form, priority: p}); setErrors({...errors, priority:''}); }}>
                      {p}
                    </button>
                  ))}
                </div>
                {errors.priority && <span className="cbf-error-msg">⚠ {errors.priority}</span>}
              </div>

              {/* Project & Module */}
              <div className="cbf-section">
                <div className="cbf-section-title">Project & Assignment</div>
                <div className="cbf-grid-2" style={{marginBottom:'14px'}}>
                  <div className="cbf-field">
                    <label className="cbf-label">Project <span className="cbf-required">*</span></label>
                    <select name="projectId" className={`cbf-select ${errors.projectId ? 'error' : ''}`}
                      value={form.projectId} onChange={handleChange}>
                      <option value="">— Select project —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {errors.projectId && <span className="cbf-error-msg">⚠ {errors.projectId}</span>}
                  </div>
                  <div className="cbf-field">
                    <label className="cbf-label">Module</label>
                    <select name="moduleId" className="cbf-select"
                      value={form.moduleId} onChange={handleChange}
                      disabled={!form.projectId || modules.length === 0}>
                      <option value="">— Select module —</option>
                      {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="cbf-field">
                  <label className="cbf-label">Assignee</label>
                  <select name="assigneeId" className="cbf-select"
                    value={form.assigneeId} onChange={handleChange}>
                    <option value="">— Unassigned —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Environment */}
              <div className="cbf-section">
                <div className="cbf-section-title">Environment & Version</div>
                <div className="cbf-grid-3">
                  <div className="cbf-field">
                    <label className="cbf-label">Environment</label>
                    <input name="environment" className="cbf-input"
                      placeholder="e.g. Production" value={form.environment} onChange={handleChange} />
                  </div>
                  <div className="cbf-field">
                    <label className="cbf-label">Version</label>
                    <input name="version" className="cbf-input"
                      placeholder="e.g. v1.2.3" value={form.version} onChange={handleChange} />
                  </div>
                  <div className="cbf-field">
                    <label className="cbf-label">Due Date</label>
                    <input name="dueDate" type="date" className="cbf-input"
                      value={form.dueDate} onChange={handleChange}
                      style={{colorScheme:'dark'}} />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="cbf-section">
                <div className="cbf-section-title">Attachments</div>
                <label className="file-drop">
                  <input type="file" multiple style={{display:'none'}}
                    accept="image/*,.pdf,.txt,.log"
                    onChange={e => setFiles([...files, ...Array.from(e.target.files)])} />
                  <div className="file-drop-icon">📎</div>
                  <div className="file-drop-text">
                    Drop files here or <span>browse</span>
                    <div style={{fontSize:'11px',marginTop:'4px',color:'#2d3748'}}>PNG, JPG, PDF, TXT, LOG</div>
                  </div>
                </label>
                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((f, i) => (
                      <div key={i} className="file-tag">
                        📄 {f.name}
                        <button type="button" onClick={() => setFiles(files.filter((_,j) => j !== i))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </form>
          </div>

          <div className="cbf-footer">
            <button className="btn-cancel" onClick={onClose} type="button">Cancel</button>
            <button className="btn-submit" form="bug-form" type="submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating...</> : '🐛 Create Bug Report'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
