import NotificationBell from '../components/NotificationBell';
import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import CreateBugForm from '../components/CreateBugForm';

const STATUS_TRANSITIONS = {
  ADMIN:     { NEW:['ASSIGNED','CLOSED'], ASSIGNED:['IN_PROGRESS','CLOSED'], IN_PROGRESS:['FIXED','CLOSED'], FIXED:['TESTING','CLOSED'], TESTING:['VERIFIED','REOPENED'], VERIFIED:['CLOSED'], CLOSED:['REOPENED'], REOPENED:['ASSIGNED','IN_PROGRESS'] },
  MANAGER:   { NEW:['ASSIGNED','CLOSED'], ASSIGNED:['IN_PROGRESS','CLOSED'], IN_PROGRESS:['FIXED','CLOSED'], FIXED:['TESTING'], TESTING:['VERIFIED','REOPENED'], VERIFIED:['CLOSED'], CLOSED:['REOPENED'], REOPENED:['ASSIGNED'] },
  DEVELOPER: { ASSIGNED:['IN_PROGRESS'], IN_PROGRESS:['FIXED'], REOPENED:['IN_PROGRESS'] },
  TESTER:    { FIXED:['TESTING'], TESTING:['VERIFIED','REOPENED'] },
  USER:      {},
};

// ── Mini SVG Charts ───────────────────────────────────────────────────────────
function DonutChart({ data, size=160 }) {
  const total = data.reduce((s,d)=>s+d.value,0);
  if (total===0) return <div style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',color:'#4a5568',fontSize:'13px'}}>No data</div>;
  let cum = 0;
  const cx=size/2, cy=size/2, r=size*0.38, inner=size*0.24;
  const slices = data.map(d=>{
    const pct = d.value/total;
    const start = cum; cum += pct;
    return {...d, pct, startAngle: start*2*Math.PI, endAngle: cum*2*Math.PI};
  }).filter(d=>d.value>0);
  const arc = (startA, endA, outerR, innerR) => {
    const x1=cx+outerR*Math.sin(startA), y1=cy-outerR*Math.cos(startA);
    const x2=cx+outerR*Math.sin(endA),   y2=cy-outerR*Math.cos(endA);
    const x3=cx+innerR*Math.sin(endA),   y3=cy-innerR*Math.cos(endA);
    const x4=cx+innerR*Math.sin(startA), y4=cy-innerR*Math.cos(startA);
    const lg = endA-startA > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${outerR},${outerR} 0 ${lg} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${lg} 0 ${x4},${y4} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s,i)=>(
        <path key={i} d={arc(s.startAngle,s.endAngle,r,inner)} fill={s.color} opacity={0.9}>
          <title>{s.label}: {s.value} ({Math.round(s.pct*100)}%)</title>
        </path>
      ))}
      <text x={cx} y={cy-6} textAnchor="middle" fill="#e9ecef" fontSize="18" fontWeight="700" fontFamily="Space Mono">{total}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fill="#6c757d" fontSize="9" fontFamily="Inter">TOTAL</text>
    </svg>
  );
}

function BarChart({ data, color='#1ec878', height=140, dark=true }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  const barW = Math.min(40, Math.floor((300-data.length*8)/data.length));
  const totalW = data.length*(barW+8);
  return (
    <svg width={totalW} height={height+30} viewBox={`0 0 ${totalW} ${height+30}`} style={{overflow:'visible'}}>
      {data.map((d,i)=>{
        const bh = Math.max((d.value/max)*height, d.value>0?4:0);
        const x = i*(barW+8);
        const y = height-bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill={color} opacity={0.85}/>
            {d.value>0&&<text x={x+barW/2} y={y-4} textAnchor="middle" fill={dark?'#ced4da':'#495057'} fontSize="10" fontFamily="Inter" fontWeight="600">{d.value}</text>}
            <text x={x+barW/2} y={height+16} textAnchor="middle" fill={dark?'#6c757d':'#868e96'} fontSize="9" fontFamily="Inter">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, color='#1ec878', height=100, dark=true }) {
  if (data.length < 2) return <div style={{color:'#4a5568',fontSize:'13px',padding:'20px 0'}}>Need more data</div>;
  const max = Math.max(...data.map(d=>d.value), 1);
  const w=320, pad=10;
  const pts = data.map((d,i)=>({
    x: pad + (i/(data.length-1))*(w-pad*2),
    y: height - pad - (d.value/max)*(height-pad*2),
    ...d
  }));
  const path = pts.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
  const area = `${path} L${pts[pts.length-1].x},${height} L${pts[0].x},${height} Z`;
  return (
    <svg width={w} height={height+20} viewBox={`0 0 ${w} ${height+20}`}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color}/>
          <text x={p.x} y={height+16} textAnchor="middle" fill={dark?'#6c757d':'#868e96'} fontSize="9" fontFamily="Inter">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [bugs, setBugs]         = useState([]);
  const [allBugs, setAllBugs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('bugs');
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);

  // Filters
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject,  setFilterProject]  = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [search,   setSearch]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Modals
  const [assignModal, setAssignModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [toast,  setToast]            = useState(null);

  const [dark, setDark] = useState(()=>localStorage.getItem('theme')!=='light');
  const user = JSON.parse(localStorage.getItem('user')||'{}');
  const role = user.role||'USER';
  const canAssign = ['ADMIN','MANAGER'].includes(role);
  const searchTimer = useRef(null);

  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem('theme',n?'dark':'light'); };
  const showToast = (msg,type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(()=>{
    fetchAllBugs();
    api.get('/projects').then(r=>setProjects(r.data)).catch(()=>{});
    if(canAssign) api.get('/users').then(r=>setUsers(r.data)).catch(()=>{});
  },[]);

  useEffect(()=>{ fetchBugs(); },[filterStatus,filterSeverity,filterPriority,filterProject,filterAssignee,dateFrom,dateTo,search]);

  const fetchAllBugs = async()=>{ try{ const r=await api.get('/bugs'); setAllBugs(r.data); }catch(e){} };

  const fetchBugs = async()=>{
    setLoading(true);
    try{
      const p=new URLSearchParams();
      if(filterStatus)   p.append('status',   filterStatus);
      if(filterSeverity) p.append('severity',  filterSeverity);
      if(filterPriority) p.append('priority',  filterPriority);
      if(filterProject)  p.append('projectId', filterProject);
      if(search)         p.append('search',    search);
      const r=await api.get(`/bugs?${p}`);
      let data=r.data;
      if(filterAssignee) data=data.filter(b=>b.assigneeId===filterAssignee);
      if(dateFrom) data=data.filter(b=>new Date(b.createdAt)>=new Date(dateFrom));
      if(dateTo)   data=data.filter(b=>new Date(b.createdAt)<=new Date(dateTo+'T23:59:59'));
      setBugs(data);
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const clearFilters = ()=>{ setFilterStatus(''); setFilterSeverity(''); setFilterPriority(''); setFilterProject(''); setFilterAssignee(''); setDateFrom(''); setDateTo(''); setSearch(''); setSearchInput(''); };
  const hasFilters = filterStatus||filterSeverity||filterPriority||filterProject||filterAssignee||dateFrom||dateTo||search;

  const handleAssign = async(bugId,assigneeId)=>{
    setSaving(true);
    try{ const r=await api.put(`/bugs/${bugId}/assign`,{assigneeId:assigneeId||null}); setBugs(p=>p.map(b=>b.id===bugId?r.data:b)); setAllBugs(p=>p.map(b=>b.id===bugId?r.data:b)); setAssignModal(null); showToast(assigneeId?'Bug assigned':'Assignee removed'); }
    catch(e){ showToast(e.response?.data?.message||'Failed','error'); }
    finally{ setSaving(false); }
  };
  const handleStatus = async(bugId,status)=>{
    setSaving(true);
    try{ const r=await api.put(`/bugs/${bugId}/status`,{status}); setBugs(p=>p.map(b=>b.id===bugId?r.data:b)); setAllBugs(p=>p.map(b=>b.id===bugId?r.data:b)); setStatusModal(null); showToast('Status updated'); }
    catch(e){ showToast(e.response?.data?.message||'Failed','error'); }
    finally{ setSaving(false); }
  };
  const getNextStatuses = (s)=>STATUS_TRANSITIONS[role]?.[s]||[];

  // ── Analytics data ──────────────────────────────────────────────────────────
  const sevColors  = {CRITICAL:'#e03131',HIGH:'#e67700',MEDIUM:'#1971c2',LOW:'#2f9e44'};
  const staColors  = {NEW:'#868e96',ASSIGNED:'#1971c2',IN_PROGRESS:'#e67700',FIXED:'#2f9e44',TESTING:'#9c36b5',VERIFIED:'#0ca678',CLOSED:'#495057',REOPENED:'#e03131'};
  const priColors  = {HIGHEST:'#e03131',HIGH:'#e67700',MEDIUM:'#1971c2',LOW:'#868e96',LOWEST:'#495057'};

  const sevData  = ['CRITICAL','HIGH','MEDIUM','LOW'].map(k=>({label:k,value:allBugs.filter(b=>b.severity===k).length,color:sevColors[k]}));
  const staData  = ['NEW','ASSIGNED','IN_PROGRESS','FIXED','TESTING','VERIFIED','CLOSED','REOPENED'].map(k=>({label:k.replace('_','\n'),value:allBugs.filter(b=>b.status===k).length,color:staColors[k]}));
  const priData  = ['HIGHEST','HIGH','MEDIUM','LOW','LOWEST'].map(k=>({label:k,value:allBugs.filter(b=>b.priority===k).length,color:priColors[k]}));

  // Bugs per day last 14 days
  const last14 = Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-13+i); return d; });
  const trendData = last14.map(d=>{
    const ds=d.toISOString().slice(0,10);
    return { label:d.toLocaleDateString('en',{month:'short',day:'numeric'}), value:allBugs.filter(b=>b.createdAt?.slice(0,10)===ds).length };
  });

  // Top assignees
  const assigneeMap = {};
  allBugs.forEach(b=>{ if(b.assignee){ const k=b.assignee.fullName; assigneeMap[k]=(assigneeMap[k]||0)+1; } });
  const topAssignees = Object.entries(assigneeMap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // ── Theme ───────────────────────────────────────────────────────────────────
  const t = dark?{
    bg:'#0f1117',topbar:'#161b27',border:'rgba(255,255,255,0.08)',card:'#161b27',card2:'#1a2035',
    tblHead:'rgba(255,255,255,0.03)',tblBorder:'rgba(255,255,255,0.05)',tblHover:'rgba(255,255,255,0.03)',
    text:'#e9ecef',textMuted:'#868e96',textDim:'#6c757d',textFaint:'#495057',
    inputBg:'#0f1117',inputBorder:'rgba(255,255,255,0.1)',inputColor:'#ced4da',
    userBg:'rgba(255,255,255,0.05)',userBorder:'rgba(255,255,255,0.1)',
    toggleBg:'rgba(255,255,255,0.06)',toggleBorder:'rgba(255,255,255,0.12)',
    modalBg:'#1a2035',modalBorder:'rgba(255,255,255,0.1)',
    tabActive:'#1ec878',tabActiveBg:'rgba(30,200,120,0.12)',
    toggleIcon:'☀️',toggleLabel:'Light',
  }:{
    bg:'#f0f2f5',topbar:'#ffffff',border:'rgba(0,0,0,0.08)',card:'#ffffff',card2:'#f8f9fa',
    tblHead:'rgba(0,0,0,0.03)',tblBorder:'rgba(0,0,0,0.05)',tblHover:'rgba(0,0,0,0.02)',
    text:'#1a1d23',textMuted:'#6c757d',textDim:'#868e96',textFaint:'#adb5bd',
    inputBg:'#ffffff',inputBorder:'rgba(0,0,0,0.12)',inputColor:'#495057',
    userBg:'rgba(0,0,0,0.04)',userBorder:'rgba(0,0,0,0.1)',
    toggleBg:'rgba(0,0,0,0.05)',toggleBorder:'rgba(0,0,0,0.12)',
    modalBg:'#ffffff',modalBorder:'rgba(0,0,0,0.12)',
    tabActive:'#1ec878',tabActiveBg:'rgba(30,200,120,0.1)',
    toggleIcon:'🌙',toggleLabel:'Dark',
  };

  const sevCfg = {
    CRITICAL:{color:'#e03131',bg:dark?'rgba(224,49,49,0.15)':'rgba(224,49,49,0.1)',border:dark?'rgba(224,49,49,0.35)':'rgba(224,49,49,0.25)',icon:'🔴'},
    HIGH:    {color:'#e67700',bg:dark?'rgba(230,119,0,0.15)':'rgba(230,119,0,0.1)',border:dark?'rgba(230,119,0,0.35)':'rgba(230,119,0,0.25)',icon:'🟠'},
    MEDIUM:  {color:'#1971c2',bg:dark?'rgba(25,113,194,0.15)':'rgba(25,113,194,0.1)',border:dark?'rgba(25,113,194,0.35)':'rgba(25,113,194,0.25)',icon:'🔵'},
    LOW:     {color:'#2f9e44',bg:dark?'rgba(47,158,68,0.15)':'rgba(47,158,68,0.1)',border:dark?'rgba(47,158,68,0.35)':'rgba(47,158,68,0.25)',icon:'🟢'},
  };
  const staCfg = {
    NEW:        {color:dark?'#ced4da':'#495057',bg:dark?'rgba(206,212,218,0.1)':'rgba(73,80,87,0.08)',border:dark?'rgba(206,212,218,0.2)':'rgba(73,80,87,0.2)'},
    ASSIGNED:   {color:dark?'#74c0fc':'#1971c2',bg:dark?'rgba(116,192,252,0.1)':'rgba(25,113,194,0.08)',border:dark?'rgba(116,192,252,0.25)':'rgba(25,113,194,0.2)'},
    IN_PROGRESS:{color:dark?'#ffa94d':'#e67700',bg:dark?'rgba(255,169,77,0.1)':'rgba(230,119,0,0.08)',border:dark?'rgba(255,169,77,0.25)':'rgba(230,119,0,0.2)'},
    FIXED:      {color:dark?'#69db7c':'#2f9e44',bg:dark?'rgba(105,219,124,0.1)':'rgba(47,158,68,0.08)',border:dark?'rgba(105,219,124,0.25)':'rgba(47,158,68,0.2)'},
    TESTING:    {color:dark?'#da77f2':'#9c36b5',bg:dark?'rgba(218,119,242,0.1)':'rgba(156,54,181,0.08)',border:dark?'rgba(218,119,242,0.25)':'rgba(156,54,181,0.2)'},
    VERIFIED:   {color:dark?'#38d9a9':'#0ca678',bg:dark?'rgba(56,217,169,0.1)':'rgba(12,166,120,0.08)',border:dark?'rgba(56,217,169,0.25)':'rgba(12,166,120,0.2)'},
    CLOSED:     {color:dark?'#868e96':'#868e96',bg:dark?'rgba(134,142,150,0.1)':'rgba(134,142,150,0.08)',border:dark?'rgba(134,142,150,0.2)':'rgba(134,142,150,0.2)'},
    REOPENED:   {color:dark?'#ff6b6b':'#e03131',bg:dark?'rgba(255,107,107,0.1)':'rgba(224,49,49,0.08)',border:dark?'rgba(255,107,107,0.25)':'rgba(224,49,49,0.2)'},
  };
  const priCfg = {
    HIGHEST:{color:dark?'#ff6b6b':'#e03131',label:'↑↑ Highest'},
    HIGH:   {color:dark?'#ffa94d':'#e67700',label:'↑ High'},
    MEDIUM: {color:dark?'#74c0fc':'#1971c2',label:'→ Medium'},
    LOW:    {color:dark?'#adb5bd':'#868e96',label:'↓ Low'},
    LOWEST: {color:dark?'#6c757d':'#adb5bd',label:'↓↓ Lowest'},
  };

  const stats=[
    {label:'Total Bugs', value:allBugs.length,                                                          icon:'🐛',color:t.text,   iconBg:dark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.05)'},
    {label:'Critical',   value:allBugs.filter(b=>b.severity==='CRITICAL').length,                       icon:'🔴',color:'#e03131',iconBg:dark?'rgba(224,49,49,0.15)':'rgba(224,49,49,0.1)'},
    {label:'Open',       value:allBugs.filter(b=>!['CLOSED','VERIFIED'].includes(b.status)).length,     icon:'⚡',color:'#e67700',iconBg:dark?'rgba(230,119,0,0.15)':'rgba(230,119,0,0.1)'},
    {label:'In Progress',value:allBugs.filter(b=>b.status==='IN_PROGRESS').length,                      icon:'🔧',color:'#1971c2',iconBg:dark?'rgba(25,113,194,0.15)':'rgba(25,113,194,0.1)'},
  ];

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:${t.bg};transition:background 0.25s}
    .db-root{min-height:100vh;background:${t.bg};font-family:'Inter',sans-serif;color:${t.text};transition:background 0.25s,color 0.25s}
    .db-topbar{background:${t.topbar};border-bottom:1px solid ${t.border};padding:0 28px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:${dark?'none':'0 1px 8px rgba(0,0,0,0.06)'}}
    .db-logo{display:flex;align-items:center;gap:10px;font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${t.text}}
    .db-logo-dot{width:8px;height:8px;border-radius:50%;background:#1ec878;box-shadow:0 0 8px rgba(30,200,120,0.6)}
    .db-logo-sep{color:${t.textFaint};margin:0 4px}
    .db-logo-sub{color:#1ec878}
    .db-nav-right{display:flex;align-items:center;gap:10px}
    .btn-theme{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:${t.toggleBg};border:1px solid ${t.toggleBorder};color:${t.textMuted};font-size:12px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;white-space:nowrap}
    .btn-theme:hover{color:${t.text}}
    .db-user{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;background:${t.userBg};border:1px solid ${t.userBorder};border-radius:10px}
    .db-avatar{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#1ec878,#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
    .db-uname{font-size:13px;font-weight:500;color:${t.text}}
    .db-urole{font-size:10px;font-weight:600;color:#1ec878;background:rgba(30,200,120,0.12);border:1px solid rgba(30,200,120,0.25);border-radius:5px;padding:2px 7px;text-transform:uppercase;letter-spacing:0.5px}
    .btn-logout{padding:7px 14px;border-radius:8px;background:transparent;border:1px solid ${dark?'rgba(255,100,100,0.3)':'rgba(224,49,49,0.3)'};color:${dark?'#ff8787':'#e03131'};font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-logout:hover{background:${dark?'rgba(255,107,107,0.12)':'rgba(224,49,49,0.08)'}}
    .db-body{padding:26px 28px}
    .db-ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
    .db-ph-left h1{font-size:22px;font-weight:700;color:${t.text}}
    .db-ph-left p{font-size:13px;color:${t.textDim};margin-top:3px}
    .btn-new{display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:10px;background:#1ec878;border:none;color:#0a1a12;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-new:hover{background:#2edb87;box-shadow:0 4px 20px rgba(30,200,120,0.35);transform:translateY(-1px)}
    .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
    .stat-card{background:${t.card};border:1px solid ${t.border};border-radius:14px;padding:18px 20px;display:flex;align-items:center;gap:14px;transition:border-color 0.2s,transform 0.2s,box-shadow 0.2s}
    .stat-card:hover{border-color:${dark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.15)'};transform:translateY(-2px);box-shadow:${dark?'0 8px 24px rgba(0,0,0,0.3)':'0 8px 24px rgba(0,0,0,0.08)'}}
    .stat-icon-box{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
    .stat-num{font-family:'Space Mono',monospace;font-size:28px;font-weight:700;line-height:1}
    .stat-lbl{font-size:12px;color:${t.textMuted};margin-top:4px;font-weight:500}
    /* Tabs */
    .tabs-row{display:flex;gap:4px;margin-bottom:20px;background:${t.card};border:1px solid ${t.border};border-radius:12px;padding:4px;width:fit-content}
    .tab-btn{padding:8px 20px;border-radius:9px;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;background:transparent;color:${t.textMuted}}
    .tab-btn.active{background:${t.tabActiveBg};color:${t.tabActive};box-shadow:${dark?'none':'0 1px 4px rgba(0,0,0,0.08)'}}
    .tab-btn:hover:not(.active){color:${t.text}}
    /* Filters */
    .filters-card{background:${t.card};border:1px solid ${t.border};border-radius:14px;padding:16px 18px;margin-bottom:16px}
    .filter-row1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .filter-row2{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid ${t.border}}
    .tb-label{font-size:11px;color:${t.textMuted};font-weight:600;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap}
    .search-wrap{position:relative;display:inline-flex;align-items:center}
    .search-icon{position:absolute;left:10px;font-size:13px;color:${t.textFaint};pointer-events:none}
    .tb-search{background:${t.inputBg};border:1px solid ${t.inputBorder};border-radius:8px;padding:8px 14px 8px 34px;font-size:13px;color:${t.inputColor};font-family:'Inter',sans-serif;outline:none;transition:border-color 0.18s;width:200px}
    .tb-search:focus{border-color:rgba(30,200,120,0.5)}
    .tb-search::placeholder{color:${t.textFaint}}
    .tb-select{background:${t.inputBg};border:1px solid ${t.inputBorder};border-radius:8px;padding:8px 28px 8px 12px;font-size:13px;color:${t.inputColor};font-family:'Inter',sans-serif;outline:none;cursor:pointer;transition:border-color 0.18s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23868e96'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center}
    .tb-select:focus{border-color:rgba(30,200,120,0.5)}
    .tb-select option{background:${t.inputBg};color:${t.text}}
    .tb-date{background:${t.inputBg};border:1px solid ${t.inputBorder};border-radius:8px;padding:8px 12px;font-size:13px;color:${t.inputColor};font-family:'Inter',sans-serif;outline:none;transition:border-color 0.18s;colorScheme:${dark?'dark':'light'}}
    .tb-date:focus{border-color:rgba(30,200,120,0.5)}
    .btn-advanced{padding:8px 12px;border-radius:8px;background:transparent;border:1px solid ${t.inputBorder};color:${t.textMuted};font-size:12px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-advanced.on{border-color:rgba(30,200,120,0.4);color:#1ec878;background:rgba(30,200,120,0.08)}
    .btn-clear{padding:8px 12px;border-radius:8px;background:transparent;border:1px solid ${dark?'rgba(255,107,107,0.3)':'rgba(224,49,49,0.3)'};color:${dark?'#ff6b6b':'#e03131'};font-size:12px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-clear:hover{background:${dark?'rgba(255,107,107,0.1)':'rgba(224,49,49,0.06)'}}
    .filter-badge{background:rgba(30,200,120,0.12);border:1px solid rgba(30,200,120,0.25);color:#1ec878;font-size:11px;font-weight:700;border-radius:20px;padding:2px 8px;margin-left:4px}
    .result-count{margin-left:auto;font-size:12px;color:${t.textDim}}
    /* Table */
    .tbl-wrap{background:${t.card};border:1px solid ${t.border};border-radius:16px;overflow:hidden;box-shadow:${dark?'none':'0 2px 12px rgba(0,0,0,0.06)'}}
    .db-tbl{width:100%;border-collapse:collapse}
    .db-tbl thead tr{background:${t.tblHead};border-bottom:1px solid ${t.border}}
    .db-tbl th{padding:11px 16px;text-align:left;font-size:11px;font-weight:600;color:${t.textMuted};text-transform:uppercase;letter-spacing:1px;white-space:nowrap}
    .db-tbl tbody tr{border-bottom:1px solid ${t.tblBorder};transition:background 0.15s}
    .db-tbl tbody tr:last-child{border-bottom:none}
    .db-tbl tbody tr:hover{background:${t.tblHover}}
    .db-tbl td{padding:12px 16px;vertical-align:middle}
    .bug-title-main{font-size:14px;font-weight:600;color:${t.text}}
    .bug-title-sub{font-size:11px;color:${t.textDim};margin-top:3px}
    .bdg{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid transparent;white-space:nowrap;letter-spacing:0.3px;text-transform:uppercase}
    .pri-text{font-size:13px;font-weight:600}
    .av-dot{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;background:linear-gradient(135deg,#1ec878,#0ea5e9)}
    .assignee-cell{display:flex;align-items:center;gap:7px}
    .assignee-name{font-size:13px;color:${t.inputColor}}
    .unassigned{font-size:12px;color:${t.textFaint};font-style:italic}
    .date-cell{font-size:12px;color:${t.textDim};white-space:nowrap}
    .actions-cell{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .btn-action{padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:'Inter',sans-serif;transition:all 0.15s;white-space:nowrap}
    .btn-assign{background:${dark?'rgba(116,192,252,0.12)':'rgba(25,113,194,0.08)'};border-color:${dark?'rgba(116,192,252,0.3)':'rgba(25,113,194,0.25)'};color:${dark?'#74c0fc':'#1971c2'}}
    .btn-assign:hover{background:${dark?'rgba(116,192,252,0.22)':'rgba(25,113,194,0.15)'}}
    .btn-status{background:${dark?'rgba(105,219,124,0.12)':'rgba(47,158,68,0.08)'};border-color:${dark?'rgba(105,219,124,0.3)':'rgba(47,158,68,0.25)'};color:${dark?'#69db7c':'#2f9e44'}}
    .btn-status:hover{background:${dark?'rgba(105,219,124,0.22)':'rgba(47,158,68,0.15)'}}
    /* Analytics */
    .analytics-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px}
    .analytics-grid-2{display:grid;grid-template-columns:2fr 1fr;gap:16px}
    .chart-card{background:${t.card};border:1px solid ${t.border};border-radius:16px;padding:20px;box-shadow:${dark?'none':'0 2px 12px rgba(0,0,0,0.06)'}}
    .chart-title{font-size:13px;font-weight:700;color:${t.text};margin-bottom:4px}
    .chart-sub{font-size:11px;color:${t.textDim};margin-bottom:16px}
    .chart-body{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap}
    .donut-legend{display:flex;flex-direction:column;gap:7px;justify-content:center}
    .legend-item{display:flex;align-items:center;gap:7px;font-size:12px;color:${t.textMuted}}
    .legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
    .legend-val{font-weight:700;color:${t.text};font-family:'Space Mono',monospace;font-size:11px}
    .bar-scroll{overflow-x:auto;padding-bottom:4px}
    .assignee-list{display:flex;flex-direction:column;gap:8px}
    .assignee-row{display:flex;align-items:center;gap:10px}
    .assignee-bar-wrap{flex:1;background:${dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)'};border-radius:4px;height:8px;overflow:hidden}
    .assignee-bar{height:100%;border-radius:4px;background:linear-gradient(90deg,#1ec878,#0ea5e9);transition:width 0.6s ease}
    .assignee-row-name{font-size:12px;color:${t.textMuted};width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .assignee-row-val{font-size:12px;font-weight:700;color:${t.text};width:24px;text-align:right;font-family:'Space Mono',monospace}
    /* Empty/loading */
    .empty-wrap{padding:64px 0;text-align:center}
    .empty-emoji{font-size:44px;margin-bottom:12px;opacity:${dark?0.25:0.2}}
    .empty-title{font-size:15px;font-weight:600;color:${t.textMuted};margin-bottom:5px}
    .empty-sub{font-size:12px;color:${t.textFaint}}
    .loading-wrap{padding:56px 0;text-align:center}
    .loading-dots{display:flex;justify-content:center;gap:6px}
    .loading-dots span{width:8px;height:8px;border-radius:50%;background:#1ec878;opacity:0.6;animation:bounce 1.2s ease-in-out infinite}
    .loading-dots span:nth-child(2){animation-delay:0.2s}
    .loading-dots span:nth-child(3){animation-delay:0.4s}
    @keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:0.4}40%{transform:scale(1.2);opacity:1}}
    /* Modal */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
    .modal-box{background:${t.modalBg};border:1px solid ${t.modalBorder};border-radius:16px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4)}
    .modal-header{padding:20px 22px 16px;border-bottom:1px solid ${t.border};display:flex;align-items:flex-start;justify-content:space-between}
    .modal-header h3{font-size:15px;font-weight:700;color:${t.text}}
    .modal-header p{font-size:12px;color:${t.textDim};margin-top:3px}
    .modal-close{background:none;border:none;color:${t.textMuted};font-size:18px;cursor:pointer;padding:2px 6px;border-radius:6px;transition:all 0.15s;line-height:1}
    .modal-close:hover{background:${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'};color:${t.text}}
    .modal-body{padding:18px 22px}
    .modal-label{font-size:11px;font-weight:600;color:${t.textMuted};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;display:block}
    .modal-select{width:100%;background:${t.inputBg};border:1px solid ${t.inputBorder};border-radius:10px;padding:10px 14px;font-size:14px;color:${t.inputColor};font-family:'Inter',sans-serif;outline:none;cursor:pointer;appearance:none}
    .modal-select:focus{border-color:rgba(30,200,120,0.5)}
    .modal-select option{background:${t.inputBg};color:${t.text}}
    .modal-footer{padding:14px 22px;border-top:1px solid ${t.border};display:flex;gap:8px;justify-content:flex-end}
    .btn-modal-cancel{padding:9px 18px;border-radius:8px;background:transparent;border:1px solid ${t.inputBorder};color:${t.textMuted};font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-modal-ok{padding:9px 22px;border-radius:8px;background:#1ec878;border:none;color:#0a1a12;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s}
    .btn-modal-ok:hover:not(:disabled){background:#2edb87;box-shadow:0 0 16px rgba(30,200,120,0.3)}
    .btn-modal-ok:disabled{opacity:0.5;cursor:not-allowed}
    .status-options{display:flex;flex-direction:column;gap:8px}
    .status-opt-btn{padding:11px 16px;border-radius:10px;border:1px solid transparent;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;text-align:left;transition:all 0.15s;display:flex;align-items:center;gap:8px}
    /* Toast */
    .toast{position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,0.25);animation:slideUp 0.3s ease}
    .toast-success{background:#1ec878;color:#0a1a12}
    .toast-error{background:#e03131;color:#fff}
    @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)}.analytics-grid{grid-template-columns:1fr}.analytics-grid-2{grid-template-columns:1fr}.db-body{padding:16px}.db-topbar{padding:0 16px}}
  `;

  const activeFiltersCount = [filterStatus,filterSeverity,filterPriority,filterProject,filterAssignee,dateFrom,dateTo,search].filter(Boolean).length;

  // ── Modals ──────────────────────────────────────────────────────────────────
  const AssignModal = ()=>{
    const [sel,setSel]=useState(assignModal?.assigneeId||'');
    return(
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setAssignModal(null)}>
        <div className="modal-box">
          <div className="modal-header">
            <div><h3>👤 Assign Bug</h3><p>{assignModal?.title}</p></div>
            <button className="modal-close" onClick={()=>setAssignModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <label className="modal-label">Select Assignee</label>
            <select className="modal-select" value={sel} onChange={e=>setSel(e.target.value)}>
              <option value="">— Unassigned —</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn-modal-cancel" onClick={()=>setAssignModal(null)}>Cancel</button>
            <button className="btn-modal-ok" disabled={saving} onClick={()=>handleAssign(assignModal.id,sel)}>{saving?'Saving...':'Confirm'}</button>
          </div>
        </div>
      </div>
    );
  };

  const StatusModal = ()=>{
    const next=getNextStatuses(statusModal?.status);
    return(
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setStatusModal(null)}>
        <div className="modal-box">
          <div className="modal-header">
            <div><h3>🔄 Update Status</h3><p>{statusModal?.title}</p></div>
            <button className="modal-close" onClick={()=>setStatusModal(null)}>✕</button>
          </div>
          <div className="modal-body">
            <label className="modal-label">Current: <span style={{color:staColors[statusModal?.status]||'#868e96'}}>{statusModal?.status?.replace('_',' ')}</span></label>
            {next.length===0?(
              <div style={{marginTop:'10px',padding:'12px 14px',borderRadius:'10px',background:dark?'rgba(255,169,77,0.08)':'rgba(230,119,0,0.06)',border:`1px solid ${dark?'rgba(255,169,77,0.2)':'rgba(230,119,0,0.2)'}`}}>
                <p style={{color:dark?'#ffa94d':'#e67700',fontSize:'13px',fontWeight:600,marginBottom:'6px'}}>⚠ No actions available</p>
                <p style={{color:t.textDim,fontSize:'12px',lineHeight:'1.6'}}>
                  Your role <strong style={{color:t.text}}>({role})</strong> cannot change this status.<br/>
                  Flow: <span style={{color:'#868e96',fontSize:'11px'}}>NEW → ASSIGNED → IN PROGRESS → FIXED → TESTING → VERIFIED → CLOSED</span><br/>
                  Closing requires <strong style={{color:'#1ec878'}}>ADMIN</strong> or <strong style={{color:'#1ec878'}}>MANAGER</strong>.
                </p>
              </div>
            ):(
              <div className="status-options" style={{marginTop:'10px'}}>
                {next.map(s=>{ const sc=staCfg[s]||{}; return(
                  <button key={s} className="status-opt-btn" style={{background:sc.bg,borderColor:sc.border,color:sc.color}} disabled={saving} onClick={()=>handleStatus(statusModal.id,s)}>
                    → {s.replace('_',' ')}
                  </button>
                );})}
              </div>
            )}
          </div>
          <div className="modal-footer"><button className="btn-modal-cancel" onClick={()=>setStatusModal(null)}>Close</button></div>
        </div>
      </div>
    );
  };

  return(
    <>
      <style>{css}</style>
      <div className="db-root">
        {/* Topbar */}
        <div className="db-topbar">
          <div className="db-logo">
            <div className="db-logo-dot"/>
            BTS<span className="db-logo-sep">/</span><span className="db-logo-sub">Dashboard</span>
          </div>
          <div className="db-nav-right">
            <button className="btn-theme" onClick={toggleTheme}>{t.toggleIcon} {t.toggleLabel}</button>
            <NotificationBell dark={dark} />
            <div className="db-user">
              <div className="db-avatar">{user.fullName?.[0]?.toUpperCase()||'U'}</div>
              <span className="db-uname">{user.fullName||'User'}</span>
              <span className="db-urole">{role}</span>
            </div>
            {canAssign && <a href="/admin" style={{padding:'7px 14px',borderRadius:'8px',background:'rgba(230,119,0,0.12)',border:'1px solid rgba(230,119,0,0.3)',color:'#e67700',fontSize:'13px',fontWeight:600,textDecoration:'none'}}>⚙ Admin</a>}
            <button className="btn-logout" onClick={()=>{localStorage.clear();window.location.href='/'}}>Sign out</button>
          </div>
        </div>

        <div className="db-body">
          {/* Header */}
          <div className="db-ph">
            <div className="db-ph-left">
              <h1>Bug Reports</h1>
              <p>{allBugs.length} issue{allBugs.length!==1?'s':''} tracked across {projects.length} project{projects.length!==1?'s':''}</p>
            </div>
            <button className="btn-new" onClick={()=>setShowForm(true)}><span style={{fontSize:'16px'}}>+</span> New Bug Report</button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {stats.map((s,i)=>(
              <div className="stat-card" key={i}>
                <div className="stat-icon-box" style={{background:s.iconBg}}>{s.icon}</div>
                <div><div className="stat-num" style={{color:s.color}}>{s.value}</div><div className="stat-lbl">{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="tabs-row">
            <button className={`tab-btn${activeTab==='bugs'?' active':''}`} onClick={()=>setActiveTab('bugs')}>🐛 Bug List</button>
            <button className={`tab-btn${activeTab==='analytics'?' active':''}`} onClick={()=>setActiveTab('analytics')}>📊 Analytics</button>
          </div>

          {/* ── BUG LIST TAB ── */}
          {activeTab==='bugs'&&(
            <>
              {/* Filters */}
              <div className="filters-card">
                <div className="filter-row1">
                  <span className="tb-label">Search & Filter</span>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input className="tb-search" placeholder="Search title or description..."
                      value={searchInput}
                      onChange={e=>{setSearchInput(e.target.value);clearTimeout(searchTimer.current);searchTimer.current=setTimeout(()=>setSearch(e.target.value),400);}}/>
                  </div>
                  <select className="tb-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    {['NEW','ASSIGNED','IN_PROGRESS','FIXED','TESTING','VERIFIED','CLOSED','REOPENED'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                  <select className="tb-select" value={filterSeverity} onChange={e=>setFilterSeverity(e.target.value)}>
                    <option value="">All Severity</option>
                    {['CRITICAL','HIGH','MEDIUM','LOW'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className={`btn-advanced${showAdvanced?' on':''}`} onClick={()=>setShowAdvanced(!showAdvanced)}>
                    ⚙ Advanced {activeFiltersCount>2&&<span className="filter-badge">{activeFiltersCount}</span>}
                  </button>
                  {hasFilters&&<button className="btn-clear" onClick={clearFilters}>✕ Clear all</button>}
                  <span className="result-count">{bugs.length} result{bugs.length!==1?'s':''}</span>
                </div>
                {showAdvanced&&(
                  <div className="filter-row2">
                    <span className="tb-label">Advanced</span>
                    <select className="tb-select" value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
                      <option value="">All Priority</option>
                      {['HIGHEST','HIGH','MEDIUM','LOW','LOWEST'].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="tb-select" value={filterProject} onChange={e=>setFilterProject(e.target.value)}>
                      <option value="">All Projects</option>
                      {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="tb-select" value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}>
                      <option value="">All Assignees</option>
                      <option value="__unassigned__">Unassigned</option>
                      {users.map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                    <span className="tb-label">From</span>
                    <input type="date" className="tb-date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{colorScheme:dark?'dark':'light'}}/>
                    <span className="tb-label">To</span>
                    <input type="date" className="tb-date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{colorScheme:dark?'dark':'light'}}/>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="tbl-wrap">
                <table className="db-tbl">
                  <thead>
                    <tr>
                      <th>Title</th><th>Severity</th><th>Priority</th><th>Status</th>
                      <th>Project</th><th>Assignee</th><th>Created</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading?(
                      <tr><td colSpan="8"><div className="loading-wrap"><div className="loading-dots"><span/><span/><span/></div></div></td></tr>
                    ):bugs.length===0?(
                      <tr><td colSpan="8"><div className="empty-wrap">
                        <div className="empty-emoji">🔍</div>
                        <div className="empty-title">{hasFilters?'No bugs match your filters':'No bugs yet'}</div>
                        <div className="empty-sub">{hasFilters?'Try adjusting your search or filters':'Click "+ New Bug Report" to get started'}</div>
                      </div></td></tr>
                    ):bugs.map(bug=>{
                      const sev=sevCfg[bug.severity]||{};
                      const sta=staCfg[bug.status]||{};
                      const pri=priCfg[bug.priority]||{};
                      const nxt=getNextStatuses(bug.status);
                      return(
                        <tr key={bug.id}>
                          <td><div className="bug-title-main">{bug.title}</div><div className="bug-title-sub">{bug.project?.name}{bug.module?` › ${bug.module.name}`:''}</div></td>
                          <td><span className="bdg" style={{background:sev.bg,color:sev.color,borderColor:sev.border}}>{sev.icon} {bug.severity}</span></td>
                          <td><span className="pri-text" style={{color:pri.color}}>{pri.label||bug.priority}</span></td>
                          <td><span className="bdg" style={{background:sta.bg,color:sta.color,borderColor:sta.border}}>{bug.status?.replace('_',' ')}</span></td>
                          <td style={{fontSize:'13px',color:t.textMuted}}>{bug.project?.name||'—'}</td>
                          <td>{bug.assignee?<div className="assignee-cell"><div className="av-dot">{bug.assignee.fullName?.[0]?.toUpperCase()}</div><span className="assignee-name">{bug.assignee.fullName}</span></div>:<span className="unassigned">Unassigned</span>}</td>
                          <td className="date-cell">{new Date(bug.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                          <td><div className="actions-cell">
                            {canAssign&&<button className="btn-action btn-assign" onClick={()=>setAssignModal(bug)}>👤 Assign</button>}
                            {nxt.length>0&&<button className="btn-action btn-status" onClick={()=>setStatusModal(bug)}>🔄 Status</button>}
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab==='analytics'&&(
            <>
              <div className="analytics-grid">
                {/* Severity donut */}
                <div className="chart-card">
                  <div className="chart-title">Bugs by Severity</div>
                  <div className="chart-sub">Distribution of bug severity levels</div>
                  <div className="chart-body">
                    <DonutChart data={sevData} size={150}/>
                    <div className="donut-legend">
                      {sevData.map(d=>(
                        <div className="legend-item" key={d.label}>
                          <div className="legend-dot" style={{background:d.color}}/>
                          <span>{d.label}</span>
                          <span className="legend-val">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Priority donut */}
                <div className="chart-card">
                  <div className="chart-title">Bugs by Priority</div>
                  <div className="chart-sub">Distribution of bug priority levels</div>
                  <div className="chart-body">
                    <DonutChart data={priData} size={150}/>
                    <div className="donut-legend">
                      {priData.map(d=>(
                        <div className="legend-item" key={d.label}>
                          <div className="legend-dot" style={{background:d.color}}/>
                          <span>{d.label}</span>
                          <span className="legend-val">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top assignees */}
                <div className="chart-card">
                  <div className="chart-title">Top Assignees</div>
                  <div className="chart-sub">Bugs assigned per developer</div>
                  {topAssignees.length===0?(
                    <div style={{color:t.textFaint,fontSize:'13px',paddingTop:'16px'}}>No assignments yet</div>
                  ):(
                    <div className="assignee-list">
                      {topAssignees.map(([name,count])=>(
                        <div className="assignee-row" key={name}>
                          <div className="av-dot" style={{width:26,height:26,fontSize:11}}>{name[0]?.toUpperCase()}</div>
                          <span className="assignee-row-name">{name}</span>
                          <div className="assignee-bar-wrap">
                            <div className="assignee-bar" style={{width:`${(count/topAssignees[0][1])*100}%`}}/>
                          </div>
                          <span className="assignee-row-val">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="analytics-grid-2">
                {/* Status bar chart */}
                <div className="chart-card">
                  <div className="chart-title">Bugs by Status</div>
                  <div className="chart-sub">Current status breakdown</div>
                  <div className="bar-scroll">
                    <BarChart data={staData.map(d=>({label:d.label.replace('\n',' ').substring(0,3),value:d.value}))} color="#1ec878" height={120} dark={dark}/>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'12px'}}>
                    {staData.filter(d=>d.value>0).map(d=>(
                      <span key={d.label} className="bdg" style={{background:staCfg[d.label.replace('\n','_')]?.bg||'rgba(255,255,255,0.05)',color:staCfg[d.label.replace('\n','_')]?.color||'#868e96',borderColor:staCfg[d.label.replace('\n','_')]?.border||'transparent'}}>
                        {d.label.replace('\n',' ')} <strong>{d.value}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trend line chart */}
                <div className="chart-card">
                  <div className="chart-title">Bug Trend (14 days)</div>
                  <div className="chart-sub">New bugs reported per day</div>
                  <div style={{overflowX:'auto'}}>
                    <LineChart data={trendData} color="#1ec878" height={120} dark={dark}/>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {assignModal&&<AssignModal/>}
      {statusModal&&<StatusModal/>}
      {showForm&&<CreateBugForm onClose={()=>setShowForm(false)} onSuccess={()=>{setShowForm(false);fetchBugs();fetchAllBugs();}} dark={dark}/>}
      {toast&&<div className={`toast toast-${toast.type}`}>{toast.type==='success'?'✓':'✕'} {toast.msg}</div>}
    </>
  );
}
