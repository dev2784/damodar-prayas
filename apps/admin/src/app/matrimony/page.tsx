'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, clearAdminSession, getAdminToken, verifyAdminSession } from '@/lib/auth';

type Profile = { id:string; firstName:string; lastName:string; gender:string; dateOfBirth:string; currentCity?:string|null; state?:string|null; education?:string|null; occupation?:string|null; contactPhone?:string|null; status:string; photos?:Array<{url:string;isPrimary:boolean;status:string}> };
type DeleteRequest = { id:string; reason:string; status:string; createdAt:string; requestedBy:{firstName?:string|null;lastName?:string|null;phone:string}; matrimonyProfile:{id:string;firstName:string;lastName:string;status:string;currentCity?:string|null;state?:string|null} };
const nav=[['⌂','Dashboard','/'],['♡','Matrimony','/matrimony'],['▤','Community','#'],['◈','Samiti','#'],['⌁','Advertisements','#'],['⚑','Reports','#'],['◎','Users','#']];

async function api(path:string, options:RequestInit={}) {
  const token=getAdminToken(); if(!token) throw new Error('SESSION_EXPIRED');
  const response=await fetch(`${API_BASE_URL}${path}`,{...options,headers:{authorization:`Bearer ${token}`,'content-type':'application/json',accept:'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(response.status===401||response.status===403) throw new Error('SESSION_EXPIRED');
  if(!response.ok) throw new Error(data?.message||data?.error||`Request failed (${response.status})`);
  return data;
}

export default function MatrimonyModerationPage(){
  const router=useRouter();
  const [tab,setTab]=useState<'profiles'|'deletions'>('profiles');
  const [profiles,setProfiles]=useState<Profile[]>([]); const [deletions,setDeletions]=useState<DeleteRequest[]>([]);
  const [loading,setLoading]=useState(true); const [busy,setBusy]=useState<string|null>(null); const [error,setError]=useState<string|null>(null);

  const load=useCallback(async()=>{setLoading(true);setError(null);try{
    const admin=await verifyAdminSession();if(!admin){router.replace('/login');return;}
    const [profileData,deleteData]=await Promise.all([api('/admin/matrimony?status=PENDING&page=1&limit=50'),api('/admin/matrimony/delete-requests?status=PENDING')]);
    setProfiles(profileData.items||[]);setDeletions(deleteData.items||[]);
  }catch(e){if(e instanceof Error&&e.message==='SESSION_EXPIRED'){clearAdminSession();router.replace('/login');return;}setError(e instanceof Error?e.message:'Data load failed');}finally{setLoading(false);}},[router]);
  useEffect(()=>{void load();},[load]);

  async function action(path:string,body?:unknown){setBusy(path);setError(null);try{await api(path,{method:'POST',body:body?JSON.stringify(body):undefined});await load();}catch(e){setError(e instanceof Error?e.message:'Action failed');}finally{setBusy(null);}}
  function rejectProfile(id:string){const reason=window.prompt('Reject करने का कारण लिखें:');if(reason?.trim())void action(`/admin/matrimony/${id}/reject`,{reason:reason.trim()});}
  function rejectDeletion(id:string){const reason=window.prompt('Deletion request reject करने का कारण लिखें:');if(reason?.trim())void action(`/admin/matrimony/delete-requests/${id}/reject`,{reason:reason.trim()});}

  const content=<>
    <div className="moderation-top"><div><Link href="/" className="back-link">← Dashboard</Link><p className="eyebrow">MATRIMONY MODERATION</p><h1>वैवाहिक Approval Center</h1><p className="subtitle">Pending profiles और profile deletion requests review करें।</p></div><button className="small-btn" onClick={()=>void load()}>Refresh</button></div>
    <div className="moderation-tabs"><button className={tab==='profiles'?'active':''} onClick={()=>setTab('profiles')}>Pending Profiles <b>{profiles.length}</b></button><button className={tab==='deletions'?'active':''} onClick={()=>setTab('deletions')}>Deletion Requests <b>{deletions.length}</b></button></div>
    {error?<div className="moderation-error">{error}</div>:null}
    {loading?<div className="empty-state">Live queue load हो रही है…</div>:tab==='profiles'?
      <section className="moderation-list">{profiles.length===0?<div className="empty-state">कोई pending matrimony profile नहीं है।</div>:profiles.map(p=><article className="moderation-card" key={p.id}><div className="profile-summary"><div className="profile-photo">{(p.photos?.find(x=>x.isPrimary)?.url||p.photos?.[0]?.url)?<img src={p.photos?.find(x=>x.isPrimary)?.url||p.photos?.[0]?.url} alt=""/>:<span>{p.firstName?.[0]||'P'}</span>}</div><div><h2>{p.firstName} {p.lastName}</h2><p>{p.gender} • {p.currentCity||'City not provided'}{p.state?`, ${p.state}`:''}</p><p>{p.education||'Education not provided'} • {p.occupation||'Occupation not provided'}</p><small>{p.contactPhone||'Contact hidden/not provided'}</small></div></div><div className="moderation-actions"><button disabled={!!busy} className="reject-action" onClick={()=>rejectProfile(p.id)}>Reject</button><button disabled={!!busy} className="approve-action" onClick={()=>window.confirm(`${p.firstName} ${p.lastName} की profile approve करें?`)&&void action(`/admin/matrimony/${p.id}/approve`)}>Approve</button></div></article>)}</section>
      :<section className="moderation-list">{deletions.length===0?<div className="empty-state">कोई pending deletion request नहीं है।</div>:deletions.map(d=><article className="moderation-card deletion-card" key={d.id}><div><span className="danger-label">DELETE REQUEST</span><h2>{d.matrimonyProfile.firstName} {d.matrimonyProfile.lastName}</h2><p className="request-meta">Requested by: {[d.requestedBy.firstName,d.requestedBy.lastName].filter(Boolean).join(' ')||d.requestedBy.phone} • {new Date(d.createdAt).toLocaleDateString('en-IN')}</p><div className="reason-box"><b>User reason</b><p>{d.reason}</p></div><small>Profile status: {d.matrimonyProfile.status} • {d.matrimonyProfile.currentCity||'Location unavailable'}{d.matrimonyProfile.state?`, ${d.matrimonyProfile.state}`:''}</small></div><div className="moderation-actions"><button disabled={!!busy} className="reject-action" onClick={()=>rejectDeletion(d.id)}>Reject request</button><button disabled={!!busy} className="danger-action" onClick={()=>window.confirm('Approve करने पर यह matrimony profile app से remove हो जाएगी. Continue?')&&void action(`/admin/matrimony/delete-requests/${d.id}/approve`)}>Approve deletion</button></div></article>)}</section>}
  </>;

  return <div className="admin-shell"><aside className="sidebar"><div className="brand"><div className="brand-seal">DP</div><div><strong>दामोदर प्रयास</strong><span>ADMIN PORTAL</span></div></div><nav className="nav-list">{nav.map(([icon,label,href])=><Link className={label==='Matrimony'?'nav-item active':'nav-item'} href={href} key={label}><span>{icon}</span>{label}</Link>)}</nav><div className="sidebar-note"><span>सुरक्षित प्रशासन</span><p>Approval-first moderation keeps community content trusted.</p></div></aside><main className="main moderation-page">{content}</main></div>;
}
