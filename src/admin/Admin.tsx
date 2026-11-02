import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge, Btn, Card, ENQ_TYPES, fmtDate, Input, PasswordInput, MeCtx, PageHead, Sel, ToastProvider, useLoad, useMe, useToast, type Me } from './common';
import { EntityEdit, EntityList, TYPES } from './Entities';
import MediaLibrary from './Media';
import Content from './Content';
import { Chats, EnquiryDetail, Enquiries } from './Inbox';

function Login({ onIn }: { onIn: (m: Me) => void }) {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory p-6">
      <form className="w-full max-w-sm" onSubmit={async (e) => { e.preventDefault(); try { onIn(await api('/api/admin/login', { json: f })); } catch (x: any) { setErr(x.message); } }}>
        <img src="/brand/logo-dark.png" alt="G. M. Andreou Marmi" className="mx-auto mb-12 w-44" />
        <div className="space-y-4">
          <Input type="email" placeholder="Email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <PasswordInput placeholder="Password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          {err && <p className="text-sm text-[#8a3b2a]">{err}</p>}
          <Btn className="w-full justify-center py-3.5">Sign in</Btn>
        </div>
      </form>
    </div>
  );
}

function Dashboard() {
  const { data: d } = useLoad<any>('/api/admin/dashboard');
  const { me } = useMe();
  if (!d) return <div className="p-10 text-taupe">Loading…</div>;
  const ev = Object.fromEntries((d.events || []).map((e: any) => [e.name, e.n]));
  const stat = (label: string, n: any, to?: string) => (
    <Link to={to || '#'} className="block border border-charcoal/10 bg-white p-5 transition-colors hover:border-charcoal/40">
      <div className="text-[10px] uppercase tracking-wide2 text-warm">{label}</div><div className="mt-2 font-display text-4xl font-light">{n ?? 0}</div>
    </Link>
  );
  return (
    <>
      <PageHead title={`Welcome${me?.name ? `, ${me.name}` : ''}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat('New enquiries', d.enquiries.new, '/admin/enquiries')}{stat('Unread enquiries', d.enquiries.unread, '/admin/enquiries')}
        {stat('Open chats', d.chats.open, '/admin/chat')}{stat('Unread chat messages', d.chats.unread, '/admin/chat')}
        {stat('Products', d.counts.product, '/admin/content/product')}{stat('Collections', d.counts.collection, '/admin/content/collection')}
        {stat('Projects', d.counts.project, '/admin/content/project')}{stat('Categories', d.counts.category, '/admin/content/category')}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Recent enquiries" className="xl:col-span-2" action={<Link to="/admin/enquiries" className="text-xs underline">All</Link>}>
          {d.recent.length ? d.recent.map((e: any) => (
            <Link key={e.id} to={`/admin/enquiries/${e.id}`} className="flex items-center justify-between gap-4 border-b border-charcoal/5 py-3 text-sm hover:bg-ivory">
              <span className={e.is_read ? '' : 'font-semibold'}>{e.name}<span className="ml-2 text-xs font-normal text-taupe">{ENQ_TYPES[e.enquiry_type]}{e.product_name ? ` · ${e.product_name}` : ''}</span></span>
              <span className="flex items-center gap-3"><Badge tone={e.status}>{e.status.replace('_', ' ')}</Badge><span className="text-xs text-taupe">{fmtDate(e.created_at)}</span></span>
            </Link>
          )) : <p className="text-sm text-taupe">No enquiries yet.</p>}
        </Card>
        <Card title="Last 30 days">
          {[['Page views', 'page_view'], ['Material views', 'product_view'], ['Enquiries sent', 'enquiry_submit'], ['Quote requests', 'quote_request'], ['Phone clicks', 'phone_click'], ['Chats started', 'chat_start']].map(([l, k]) => (
            <div key={k} className="flex justify-between py-1 text-sm"><span className="text-warm">{l}</span>{ev[k] || 0}</div>
          ))}
        </Card>
        <Card title="Recent activity" className="xl:col-span-3">
          {d.activity.map((a: any, i: number) => <div key={i} className="flex justify-between border-b border-charcoal/5 py-2 text-sm"><span>{a.action.replace(/_/g, ' ')} <span className="text-taupe">{a.detail}</span></span><span className="text-xs text-taupe">{a.name || 'Website'} · {fmtDate(a.created_at)}</span></div>)}
        </Card>
      </div>
    </>
  );
}

function Users() {
  const { data, reload } = useLoad<any[]>('/api/admin/users');
  const [f, setF] = useState({ email: '', name: '', role: 'staff', password: '' });
  const toast = useToast();
  const roles = [{ value: 'super_admin', label: 'Super admin (everything)' }, { value: 'content_manager', label: 'Content manager' }, { value: 'staff', label: 'Sales / staff' }];
  return (
    <>
      <PageHead title="Users" />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Team" className="xl:col-span-2">
          {data?.map((u) => (
            <div key={u.id} className="grid items-center gap-3 border-b border-charcoal/5 py-3 text-sm sm:grid-cols-[1fr_200px_auto_auto]">
              <div><div className="font-medium">{u.name || u.email}</div><div className="text-xs text-taupe">{u.email} · last login {u.last_login ? fmtDate(u.last_login) : 'never'}</div></div>
              <Sel value={u.role} onChange={async (e) => { try { await api(`/api/admin/users/${u.id}`, { method: 'PUT', json: { role: e.target.value } }); toast('Role updated'); reload(); } catch (x: any) { toast(x.message, 'err'); } }} options={roles} />
              <Btn kind="line" onClick={async () => { const p = prompt('New password (at least 10 characters)'); if (!p) return; try { await api(`/api/admin/users/${u.id}`, { method: 'PUT', json: { password: p } }); toast('Password changed'); } catch (x: any) { toast(x.message, 'err'); } }}>Password</Btn>
              <Btn kind="danger" onClick={async () => { if (!confirm(`Remove ${u.email}?`)) return; try { await api(`/api/admin/users/${u.id}`, { method: 'DELETE' }); reload(); } catch (x: any) { toast(x.message, 'err'); } }}>Remove</Btn>
            </div>
          ))}
        </Card>
        <Card title="Add user">
          <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await api('/api/admin/users', { json: f }); toast('User added'); setF({ email: '', name: '', role: 'staff', password: '' }); reload(); } catch (x: any) { toast(x.message, 'err'); } }}>
            <Input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Sel value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} options={roles} />
            <PasswordInput placeholder="Temporary password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <Btn className="w-full justify-center">Add user</Btn>
          </form>
        </Card>
      </div>
    </>
  );
}

function Account() {
  const [f, setF] = useState({ current: '', next: '' });
  const toast = useToast();
  return (
    <>
      <PageHead title="My account" />
      <Card title="Change password" className="max-w-md">
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await api('/api/admin/me/password', { method: 'PUT', json: f }); toast('Password changed'); setF({ current: '', next: '' }); } catch (x: any) { toast(x.message, 'err'); } }}>
          <PasswordInput placeholder="Current password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
          <PasswordInput placeholder="New password (10+ characters)" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
          <Btn>Update</Btn>
        </form>
      </Card>
    </>
  );
}

function Shell() {
  const { me, setMe } = useMe();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: d } = useLoad<any>('/api/admin/dashboard', [pathname]);
  useEffect(() => setOpen(false), [pathname]);
  const p = me?.perms || [];
  // staff accounts (enquiries and chat only) do not see the dashboard
  const full = p.some((x) => ['content', 'media', 'settings', 'users'].includes(x));
  const link = (to: string, label: string, n?: number) => (
    <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `flex items-center justify-between px-5 py-2 text-sm ${isActive ? 'bg-ivory/10 text-ivory' : 'text-ivory/60 hover:text-ivory'}`}>
      {label}{n ? <span className="rounded-full bg-bronze px-1.5 text-[10px] text-white">{n}</span> : null}
    </NavLink>
  );
  return (
    <div className="min-h-screen bg-[#f3efe9] font-sans text-charcoal lg:pl-60">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 overflow-y-auto bg-ink py-6 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/admin" className="mb-8 block px-5"><img src="/brand/logo-light.png" alt="GM Andreou Marmi" className="w-32" /></Link>
        {full && link('/admin', 'Dashboard')}
        {p.includes('enquiries') && link('/admin/enquiries', 'Enquiries', d?.enquiries?.unread)}
        {p.includes('chat') && link('/admin/chat', 'Live chat', d?.chats?.unread)}
        {p.includes('content') && (
          <>
            <div className="mt-6 px-5 pb-2 text-[10px] uppercase tracking-wide2 text-ivory/35">Catalogue</div>
            {['product', 'category', 'collection', 'brand', 'faq'].map((t) => link(`/admin/content/${t}`, TYPES[t].plural))}
            {/* same grouping as the website menu: Applications and Projects live under Inspiration */}
            <div className="mt-6 px-5 pb-2 text-[10px] uppercase tracking-wide2 text-ivory/35">Inspiration</div>
            {['application', 'project'].map((t) => link(`/admin/content/${t}`, TYPES[t].plural))}
          </>
        )}
        {(p.includes('media') || p.includes('settings')) && <div className="mt-6 px-5 pb-2 text-[10px] uppercase tracking-wide2 text-ivory/35">Website</div>}
        {p.includes('media') && link('/admin/media', 'Media library')}
        {p.includes('settings') && link('/admin/website/home', 'Website content')}
        {p.includes('users') && link('/admin/users', 'Users')}
        <div className="mt-6 px-5 pb-2 text-[10px] uppercase tracking-wide2 text-ivory/35">{me?.email}</div>
        {link('/admin/account', 'My account')}
        <a href="/" target="_blank" className="block px-5 py-2 text-sm text-ivory/60 hover:text-ivory">View website ↗</a>
        <button onClick={async () => { await api('/api/admin/logout', { method: 'POST' }); setMe(null); }} className="px-5 py-2 text-sm text-ivory/60 hover:text-ivory">Sign out</button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} className="text-ivory">☰</button><img src="/brand/logo-light.png" alt="" className="w-24" /><span />
      </div>
      <main className="mx-auto max-w-[1400px] p-5 sm:p-8 lg:p-10">
        <Routes>
          <Route index element={full ? <Dashboard /> : <Navigate to={p.includes('enquiries') ? '/admin/enquiries' : '/admin/account'} replace />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="enquiries/:id" element={<EnquiryDetail />} />
          <Route path="chat" element={<Chats />} />
          <Route path="chat/:id" element={<Chats />} />
          <Route path="content/:type" element={<EntityList />} />
          <Route path="content/:type/:id" element={<EntityEdit />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="website/:tab" element={<Content />} />
          <Route path="users" element={<Users />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function Admin() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { document.title = 'Admin | GM Andreou Marmi'; api<Me>('/api/admin/me').then(setMe).catch(() => {}).finally(() => setReady(true)); }, []);
  if (!ready) return null;
  return (
    <MeCtx.Provider value={{ me, setMe }}>
      <ToastProvider>{me ? <Routes><Route path="/admin/*" element={<Shell />} /></Routes> : <Login onIn={setMe} />}</ToastProvider>
    </MeCtx.Provider>
  );
}
