import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminPage() {
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Project modals
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ name:'', description:'' });
  const [expandedProject, setExpandedProject] = useState(null);
  const [moduleInput, setModuleInput] = useState('');

  // User modals
  const [editUser, setEditUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'USER';
  const isAdmin = role === 'ADMIN';
  const canManage = ['ADMIN','MANAGER'].includes(role);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem('theme',n?'dark':'light'); };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try { const r = await api.get('/projects'); setProjects(r.data); }
    catch(e) { showToast('Failed to load projects','error'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try { const r = await api.get('/users'); setUsers(r.data); }
    catch(e) {}
  };

  // ── Projects ────────────────────────────────────────────────────────────────
  const handleSaveProject = async () => {
    if (!projectForm.name.trim()) { showToast('Project name required','error'); return; }
    setSaving(true);
    try {
      if (editProject) {
        const r = await api.put(`/projects/${editProject.id}`, projectForm);
        setProjects(p => p.map(x => x.id===editProject.id ? r.data : x));
        showToast('Project updated');
      } else {
        const r = await api.post('/projects', projectForm);
        setProjects(p => [r.data, ...p]);
        showToast('Project created');
      }
      setShowProjectForm(false); setEditProject(null); setProjectForm({name:'',description:''});
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id!==id));
      showToast('Project deleted');
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
  };

  const handleAddModule = async (projectId) => {
    if (!moduleInput.trim()) return;
    try {
      const r = await api.post('/projects/modules', { name: moduleInput.trim(), projectId });
      setProjects(p => p.map(x => x.id===projectId ? {...x, modules:[...x.modules, r.data]} : x));
      setModuleInput(''); showToast('Module added');
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
  };

  const handleDeleteModule = async (moduleId, projectId) => {
    try {
      await api.delete(`/projects/modules/${moduleId}`);
      setProjects(p => p.map(x => x.id===projectId ? {...x, modules:x.modules.filter(m=>m.id!==moduleId)} : x));
      showToast('Module deleted');
    } catch(e) { showToast('Failed','error'); }
  };

  // ── Users ───────────────────────────────────────────────────────────────────
  const handleUpdateRole = async () => {
    setSaving(true);
    try {
      const r = await api.put(`/users/${editUser.id}/role`, { role: selectedRole });
      setUsers(u => u.map(x => x.id===editUser.id ? {...x, role:r.data.role} : x));
      setEditUser(null); showToast('Role updated');
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(u => u.filter(x => x.id!==id));
      showToast('User deleted');
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
  };

  const t = dark ? {
    bg:'#0f1117', topbar:'#161b27', border:'rgba(255,255,255,0.08)', card:'#161b27', card2:'#1a2035',
    text:'#e9ecef', textMuted:'#868e96', textDim:'#6c757d', textFaint:'#495057',
    inputBg:'#0f1117', inputBorder:'rgba(255,255,255,0.1)', inputColor:'#ced4da',
    tblHead:'rgba(255,255,255,0.03)', tblBorder:'rgba(255,255,255,0.05)', tblHover:'rgba(255,255,255,0.03)',
    modalBg:'#1a2035', modalBorder:'rgba(255,255,255,0.1)',
    toggleBg:'rgba(255,255,255,0.06)', toggleBorder:'rgba(255,255,255,0.12)',
  } : {
    bg:'#f0f2f5', topbar:'#ffffff', border:'rgba(0,0,0,0.08)', card:'#ffffff', card2:'#f8f9fa',
    text:'#1a1d23', textMuted:'#6c757d', textDim:'#868e96', textFaint:'#adb5bd',
    inputBg:'#ffffff', inputBorder:'rgba(0,0,0,0.12)', inputColor:'#495057',
    tblHead:'rgba(0,0,0,0.03)', tblBorder:'rgba(0,0,0,0.05)', tblHover:'rgba(0,0,0,0.02)',
    modalBg:'#ffffff', modalBorder:'rgba(0,0,0,0.12)',
    toggleBg:'rgba(0,0,0,0.05)', toggleBorder:'rgba(0,0,0,0.12)',
  };

  const roleColors = {
    ADMIN:    {color:'#e03131',bg:dark?'rgba(224,49,49,0.15)':'rgba(224,49,49,0.1)',border:dark?'rgba(224,49,49,0.3)':'rgba(224,49,49,0.2)'},
    MANAGER:  {color:'#e67700',bg:dark?'rgba(230,119,0,0.15)':'rgba(230,119,0,0.1)',border:dark?'rgba(230,119,0,0.3)':'rgba(230,119,0,0.2)'},
    DEVELOPER:{color:'#1971c2',bg:dark?'rgba(25,113,194,0.15)':'rgba(25,113,194,0.1)',border:dark?'rgba(25,113,194,0.3)':'rgba(25,113,194,0.2)'},
    TESTER:   {color:'#9c36b5',bg:dark?'rgba(156,54,181,0.15)':'rgba(156,54,181,0.1)',border:dark?'rgba(156,54,181,0.3)':'rgba(156,54,181,0.2)'},
    USER:     {color:'#868e96',bg:dark?'rgba(134,142,150,0.12)':'rgba(134,142,150,0.08)',border:dark?'rgba(134,142,150,0.2)':'rgba(134,142,150,0.15)'},
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:${t.bg}}
    .adm-root{min-height:100vh;background:${t.bg};font-family:'Inter',sans-serif;color:${t.text}}
    .adm-topbar{background:${t.topbar};border-bottom:1px solid ${t.border};padding:0 28px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:${dark?'none':'0 1px 8px rgba(0,0,0,0.06)'}}
    .adm-logo{display:flex;align-items:center;gap:10px;font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${t.text}}
    .adm-logo-dot{width:8px;height:8px;border-radius:50%;background:#1ec878;box-shadow:0 0 8px rgba(30,200,120,0.6)}
    .adm-logo-sep{color:${t.textFaint};margin:0 4px}
    .adm-logo-sub{color:#e67700}
    .adm-nav-right{display:flex;align-items:center;gap:10px}
    .btn-theme{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:${t.toggleBg};border:1px solid ${t.toggleBorder};color:${t.textMuted};font-size:12px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-theme:hover{color:${t.text}}
    .adm-user{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;background:${dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'};border:1px solid ${t.border};border-radius:10px}
    .adm-avatar{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#e67700,#e03131);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
    .adm-uname{font-size:13px;font-weight:500;color:${t.text}}
    .adm-role-badge{font-size:10px;font-weight:600;color:#e67700;background:rgba(230,119,0,0.12);border:1px solid rgba(230,119,0,0.25);border-radius:5px;padding:2px 7px;text-transform:uppercase;letter-spacing:0.5px}
    .btn-back{padding:7px 14px;border-radius:8px;background:transparent;border:1px solid ${t.border};color:${t.textMuted};font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;text-decoration:none;display:flex;align-items:center;gap:6px}
    .btn-back:hover{color:${t.text};border-color:${dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.2)'}}
    .adm-body{padding:26px 28px}
    .adm-ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
    .adm-ph-left h1{font-size:22px;font-weight:700;color:${t.text}}
    .adm-ph-left p{font-size:13px;color:${t.textDim};margin-top:3px}
    /* Tabs */
    .tabs-row{display:flex;gap:4px;margin-bottom:20px;background:${t.card};border:1px solid ${t.border};border-radius:12px;padding:4px;width:fit-content}
    .tab-btn{padding:8px 20px;border-radius:9px;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;background:transparent;color:${t.textMuted}}
    .tab-btn.active{background:rgba(230,119,0,0.12);color:#e67700}
    .tab-btn:hover:not(.active){color:${t.text}}
    /* Summary cards */
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
    .sum-card{background:${t.card};border:1px solid ${t.border};border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:12px}
    .sum-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .sum-num{font-family:'Space Mono',monospace;font-size:24px;font-weight:700;line-height:1}
    .sum-lbl{font-size:12px;color:${t.textMuted};margin-top:3px}
    /* Project cards */
    .projects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
    .project-card{background:${t.card};border:1px solid ${t.border};border-radius:16px;overflow:hidden;transition:border-color 0.2s,box-shadow 0.2s}
    .project-card:hover{border-color:${dark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.15)'};box-shadow:${dark?'0 8px 24px rgba(0,0,0,0.3)':'0 8px 24px rgba(0,0,0,0.08)'}}
    .project-card-header{padding:18px 18px 14px;display:flex;align-items:flex-start;justify-content:space-between}
    .project-name{font-size:15px;font-weight:700;color:${t.text};margin-bottom:4px}
    .project-desc{font-size:12px;color:${t.textDim};line-height:1.5}
    .project-meta{display:flex;gap:10px;padding:0 18px 14px;flex-wrap:wrap}
    .meta-badge{font-size:11px;color:${t.textMuted};background:${dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'};border-radius:6px;padding:3px 8px}
    .project-actions{display:flex;gap:6px}
    .btn-sm{padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:'Inter',sans-serif;transition:all 0.15s}
    .btn-edit{background:${dark?'rgba(116,192,252,0.12)':'rgba(25,113,194,0.08)'};border-color:${dark?'rgba(116,192,252,0.3)':'rgba(25,113,194,0.25)'};color:${dark?'#74c0fc':'#1971c2'}}
    .btn-edit:hover{background:${dark?'rgba(116,192,252,0.22)':'rgba(25,113,194,0.15)'}}
    .btn-danger{background:${dark?'rgba(255,107,107,0.1)':'rgba(224,49,49,0.08)'};border-color:${dark?'rgba(255,107,107,0.3)':'rgba(224,49,49,0.2)'};color:${dark?'#ff6b6b':'#e03131'}}
    .btn-danger:hover{background:${dark?'rgba(255,107,107,0.2)':'rgba(224,49,49,0.14)'}}
    .btn-expand{background:transparent;border-color:${t.border};color:${t.textMuted}}
    .btn-expand:hover{color:${t.text}}
    .modules-section{border-top:1px solid ${t.border};padding:14px 18px;background:${dark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)'}}
    .modules-title{font-size:11px;font-weight:600;color:${t.textMuted};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px}
    .module-list{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}
    .module-tag{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:500;background:${dark?'rgba(30,200,120,0.1)':'rgba(30,200,120,0.08)'};border:1px solid ${dark?'rgba(30,200,120,0.2)':'rgba(30,200,120,0.2)'};color:${dark?'#69db7c':'#2f9e44'}}
    .module-del{background:none;border:none;color:${dark?'rgba(255,107,107,0.6)':'rgba(224,49,49,0.5)'};cursor:pointer;font-size:13px;padding:0;line-height:1;transition:color 0.15s}
    .module-del:hover{color:${dark?'#ff6b6b':'#e03131'}}
    .module-add-row{display:flex;gap:8px}
    .module-input{flex:1;background:${t.inputBg};border:1px solid ${t.inputBorder};border-radius:8px;padding:7px 12px;font-size:13px;color:${t.inputColor};font-family:'Inter',sans-serif;outline:none;transition:border-color 0.18s}
    .module-input:focus{border-color:rgba(30,200,120,0.5)}
    .module-input::placeholder{color:${t.textFaint}}
    .btn-add-module{padding:7px 14px;border-radius:8px;background:#1ec878;border:none;color:#0a1a12;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;white-space:nowrap}
    .btn-add-module:hover{background:#2edb87}
    /* Table */
    .tbl-wrap{background:${t.card};border:1px solid ${t.border};border-radius:16px;overflow:hidden;box-shadow:${dark?'none':'0 2px 12px rgba(0,0,0,0.06)'}}
    .adm-tbl{width:100%;border-collapse:collapse}
    .adm-tbl thead tr{background:${t.tblHead};border-bottom:1px solid ${t.border}}
    .adm-tbl th{padding:11px 16px;text-align:left;font-size:11px;font-weight:600;color:${t.textMuted};text-transform:uppercase;letter-spacing:1px;white-space:nowrap}
    .adm-tbl tbody tr{border-bottom:1px solid ${t.tblBorder};transition:background 0.15s}
    .adm-tbl tbody tr:last-child{border-bottom:none}
    .adm-tbl tbody tr:hover{background:${t.tblHover}}
    .adm-tbl td{padding:12px 16px;vertical-align:middle}
    .user-cell{display:flex;align-items:center;gap:10px}
    .u-avatar{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;background:linear-gradient(135deg,#1ec878,#0ea5e9)}
    .u-name{font-size:14px;font-weight:600;color:${t.text}}
    .u-email{font-size:11px;color:${t.textDim};margin-top:2px}
    .bdg{display:inline-flex;align-items:center;padding:4px 9px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid transparent;white-space:nowrap;letter-spacing:0.3px;text-transform:uppercase}
    .stat-cell{font-size:13px;color:${t.textMuted};font-family:'Space Mono',monospace}
    /* Modal */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
    .modal-box{background:${t.modalBg};border:1px solid ${t.modalBorder};border-radius:16px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4)}
    .modal-header{padding:20px 22px 16px;border-bottom:1px solid ${t.border};display:flex;align-items:flex-start;justify-content:space-between}
    .modal-header h3{font-size:15px;font-weight:700;color:${t.text}}
    .modal-close{background:none;border:none;color:${t.textMuted};font-size:18px;cursor:pointer;padding:2px 6px;border-radius:6px;line-height:1}
    .modal-body{padding:18px 22px;display:flex;flex-direction:column;gap:14px}
    .form-field{display:flex;flex-direction:column;gap:6px}
    .form-label{font-size:11px;font-weight:600;color:${t.textMuted};text-transform:uppercase;letter-spacing:0.8px}
    .form-input{background:${t.inputBg};border:1px solid ${t.inputBorder};border-radius:10px;padding:10px 14px;font-size:14px;color:${t.inputColor};font-family:'Inter',sans-serif;outline:none;transition:border-color 0.18s}
    .form-input:focus{border-color:rgba(30,200,120,0.5)}
    .form-input::placeholder{color:${t.textFaint}}
    .form-textarea{resize:vertical;min-height:70px;line-height:1.5}
    .form-select{background:${t.inputBg};border:1px solid ${t.inputBorder};border-radius:10px;padding:10px 14px;font-size:14px;color:${t.inputColor};font-family:'Inter',sans-serif;outline:none;cursor:pointer;appearance:none}
    .form-select:focus{border-color:rgba(30,200,120,0.5)}
    .form-select option{background:${t.inputBg};color:${t.text}}
    .modal-footer{padding:14px 22px;border-top:1px solid ${t.border};display:flex;gap:8px;justify-content:flex-end}
    .btn-cancel{padding:9px 18px;border-radius:8px;background:transparent;border:1px solid ${t.border};color:${t.textMuted};font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif}
    .btn-ok{padding:9px 22px;border-radius:8px;background:#1ec878;border:none;color:#0a1a12;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif}
    .btn-ok:hover:not(:disabled){background:#2edb87}
    .btn-ok:disabled{opacity:0.5;cursor:not-allowed}
    /* New project btn */
    .btn-new{display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:10px;background:#1ec878;border:none;color:#0a1a12;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-new:hover{background:#2edb87;box-shadow:0 4px 20px rgba(30,200,120,0.35);transform:translateY(-1px)}
    /* Toast */
    .toast{position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,0.25);animation:slideUp 0.3s ease}
    .toast-success{background:#1ec878;color:#0a1a12}
    .toast-error{background:#e03131;color:#fff}
    @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    .empty-box{padding:48px;text-align:center;color:${t.textFaint};font-size:13px}
    @media(max-width:900px){.summary-grid{grid-template-columns:repeat(2,1fr)}.adm-body{padding:16px}.adm-topbar{padding:0 16px}.projects-grid{grid-template-columns:1fr}}
  `;

  const totalModules = projects.reduce((s,p)=>s+p.modules.length,0);
  const totalBugs    = projects.reduce((s,p)=>s+(p._count?.bugs||0),0);
  const roleCount    = role => users.filter(u=>u.role===role).length;

  return (
    <>
      <style>{css}</style>
      <div className="adm-root">
        {/* Topbar */}
        <div className="adm-topbar">
          <div className="adm-logo">
            <div className="adm-logo-dot"/>
            BTS<span className="adm-logo-sep">/</span><span className="adm-logo-sub">Admin Panel</span>
          </div>
          <div className="adm-nav-right">
            <button className="btn-theme" onClick={toggleTheme}>{dark?'☀️':'🌙'} {dark?'Light':'Dark'}</button>
            <div className="adm-user">
              <div className="adm-avatar">{user.fullName?.[0]?.toUpperCase()||'A'}</div>
              <span className="adm-uname">{user.fullName}</span>
              <span className="adm-role-badge">{role}</span>
            </div>
            <a href="/#/dashboard" className="btn-back">← Dashboard</a>
          </div>
        </div>

        <div className="adm-body">
          <div className="adm-ph">
            <div className="adm-ph-left">
              <h1>Admin Panel</h1>
              <p>Manage projects, modules and user permissions</p>
            </div>
          </div>

          {/* Summary */}
          <div className="summary-grid">
            <div className="sum-card">
              <div className="sum-icon" style={{background:dark?'rgba(30,200,120,0.12)':'rgba(30,200,120,0.08)'}}>📁</div>
              <div><div className="sum-num" style={{color:'#1ec878'}}>{projects.length}</div><div className="sum-lbl">Projects</div></div>
            </div>
            <div className="sum-card">
              <div className="sum-icon" style={{background:dark?'rgba(116,192,252,0.12)':'rgba(25,113,194,0.08)'}}>🧩</div>
              <div><div className="sum-num" style={{color:dark?'#74c0fc':'#1971c2'}}>{totalModules}</div><div className="sum-lbl">Modules</div></div>
            </div>
            <div className="sum-card">
              <div className="sum-icon" style={{background:dark?'rgba(255,107,107,0.12)':'rgba(224,49,49,0.08)'}}>🐛</div>
              <div><div className="sum-num" style={{color:'#e03131'}}>{totalBugs}</div><div className="sum-lbl">Total Bugs</div></div>
            </div>
            <div className="sum-card">
              <div className="sum-icon" style={{background:dark?'rgba(218,119,242,0.12)':'rgba(156,54,181,0.08)'}}>👥</div>
              <div><div className="sum-num" style={{color:dark?'#da77f2':'#9c36b5'}}>{users.length}</div><div className="sum-lbl">Users</div></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-row">
            <button className={`tab-btn${tab==='projects'?' active':''}`} onClick={()=>setTab('projects')}>📁 Projects</button>
            <button className={`tab-btn${tab==='users'?' active':''}`} onClick={()=>setTab('users')}>👥 Users</button>
          </div>

          {/* ── PROJECTS TAB ── */}
          {tab==='projects'&&(
            <>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'16px'}}>
                {canManage&&(
                  <button className="btn-new" onClick={()=>{setEditProject(null);setProjectForm({name:'',description:''});setShowProjectForm(true);}}>
                    + New Project
                  </button>
                )}
              </div>
              {projects.length===0?(
                <div className="empty-box">No projects yet. Create one to get started.</div>
              ):(
                <div className="projects-grid">
                  {projects.map(p=>(
                    <div className="project-card" key={p.id}>
                      <div className="project-card-header">
                        <div style={{flex:1}}>
                          <div className="project-name">{p.name}</div>
                          {p.description&&<div className="project-desc">{p.description}</div>}
                        </div>
                        {canManage&&(
                          <div className="project-actions">
                            <button className="btn-sm btn-edit" onClick={()=>{setEditProject(p);setProjectForm({name:p.name,description:p.description||''});setShowProjectForm(true);}}>✏ Edit</button>
                            {isAdmin&&<button className="btn-sm btn-danger" onClick={()=>handleDeleteProject(p.id)}>🗑</button>}
                          </div>
                        )}
                      </div>
                      <div className="project-meta">
                        <span className="meta-badge">🐛 {p._count?.bugs||0} bugs</span>
                        <span className="meta-badge">🧩 {p.modules.length} modules</span>
                        <span className="meta-badge">📅 {new Date(p.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                      </div>
                      {/* Modules */}
                      <div className="modules-section">
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                          <div className="modules-title">Modules</div>
                          <button className="btn-sm btn-expand" onClick={()=>setExpandedProject(expandedProject===p.id?null:p.id)}>
                            {expandedProject===p.id?'▲ Collapse':'▼ Expand'}
                          </button>
                        </div>
                        {expandedProject===p.id&&(
                          <>
                            <div className="module-list">
                              {p.modules.length===0?<span style={{fontSize:'12px',color:t.textFaint}}>No modules yet</span>:p.modules.map(m=>(
                                <span className="module-tag" key={m.id}>
                                  {m.name}
                                  {canManage&&<button className="module-del" onClick={()=>handleDeleteModule(m.id,p.id)}>✕</button>}
                                </span>
                              ))}
                            </div>
                            {canManage&&(
                              <div className="module-add-row">
                                <input className="module-input" placeholder="New module name..."
                                  value={expandedProject===p.id?moduleInput:''}
                                  onChange={e=>setModuleInput(e.target.value)}
                                  onKeyDown={e=>e.key==='Enter'&&handleAddModule(p.id)}/>
                                <button className="btn-add-module" onClick={()=>handleAddModule(p.id)}>+ Add</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── USERS TAB ── */}
          {tab==='users'&&(
            <>
              <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
                {['ADMIN','MANAGER','DEVELOPER','TESTER','USER'].map(r=>{
                  const rc=roleColors[r]||{};
                  return <span key={r} className="bdg" style={{background:rc.bg,color:rc.color,borderColor:rc.border}}>{r} <strong style={{marginLeft:'4px'}}>{roleCount(r)}</strong></span>;
                })}
              </div>
              <div className="tbl-wrap">
                <table className="adm-tbl">
                  <thead>
                    <tr><th>User</th><th>Role</th><th>Bugs Assigned</th><th>Bugs Reported</th><th>Joined</th>{isAdmin&&<th>Actions</th>}</tr>
                  </thead>
                  <tbody>
                    {users.length===0?(
                      <tr><td colSpan="6"><div className="empty-box">No users found</div></td></tr>
                    ):users.map(u=>{
                      const rc=roleColors[u.role]||{};
                      return(
                        <tr key={u.id}>
                          <td>
                            <div className="user-cell">
                              <div className="u-avatar">{u.fullName?.[0]?.toUpperCase()}</div>
                              <div><div className="u-name">{u.fullName}</div><div className="u-email">{u.email}</div></div>
                            </div>
                          </td>
                          <td><span className="bdg" style={{background:rc.bg,color:rc.color,borderColor:rc.border}}>{u.role}</span></td>
                          <td><span className="stat-cell">{u._count?.assignedBugs||0}</span></td>
                          <td><span className="stat-cell">{u._count?.reportedBugs||0}</span></td>
                          <td style={{fontSize:'12px',color:t.textDim}}>{new Date(u.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                          {isAdmin&&(
                            <td>
                              <div style={{display:'flex',gap:'6px'}}>
                                <button className="btn-sm btn-edit" onClick={()=>{setEditUser(u);setSelectedRole(u.role);}}>✏ Role</button>
                                {u.id!==user.id&&<button className="btn-sm btn-danger" onClick={()=>handleDeleteUser(u.id)}>🗑</button>}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {showProjectForm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowProjectForm(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editProject?'✏ Edit Project':'➕ New Project'}</h3>
              <button className="modal-close" onClick={()=>setShowProjectForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label className="form-label">Project Name *</label>
                <input className="form-input" placeholder="e.g. Mobile App v2" value={projectForm.name} onChange={e=>setProjectForm({...projectForm,name:e.target.value})}/>
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" placeholder="Brief description..." value={projectForm.description} onChange={e=>setProjectForm({...projectForm,description:e.target.value})}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setShowProjectForm(false)}>Cancel</button>
              <button className="btn-ok" disabled={saving} onClick={handleSaveProject}>{saving?'Saving...':editProject?'Save Changes':'Create Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {editUser&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setEditUser(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>🎭 Change Role</h3>
              <button className="modal-close" onClick={()=>setEditUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label className="form-label">User: <strong style={{color:t.text}}>{editUser.fullName}</strong></label>
              </div>
              <div className="form-field">
                <label className="form-label">New Role</label>
                <select className="form-select" value={selectedRole} onChange={e=>setSelectedRole(e.target.value)}>
                  {['ADMIN','MANAGER','DEVELOPER','TESTER','USER'].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={()=>setEditUser(null)}>Cancel</button>
              <button className="btn-ok" disabled={saving} onClick={handleUpdateRole}>{saving?'Saving...':'Update Role'}</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className={`toast toast-${toast.type}`}>{toast.type==='success'?'✓':'✕'} {toast.msg}</div>}
    </>
  );
}
