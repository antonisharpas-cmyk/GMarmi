import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Area, Badge, Btn, Card, ENQ_TYPES, fmtDate, Input, PageHead, Sel, STATUSES, useLoad, useToast } from './common';

export function Enquiries() {
  const [f, setF] = useState({ status: '', type: '', search: '', archived: 'false', sort: 'new' });
  const qs = new URLSearchParams(f).toString();
  const { data } = useLoad<any[]>(`/api/admin/enquiries?${qs}`, [qs]);
  const nav = useNavigate();
  return (
    <>
      <PageHead title="Enquiries">
        <a href="/api/admin/enquiries/export.csv" className="inline-flex items-center border border-charcoal/20 px-4 py-2.5 text-[11px] uppercase tracking-wide2 hover:border-charcoal">Export CSV</a>
      </PageHead>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Search name, email, company, ref" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} className="lg:col-span-2" />
        <Sel value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))]} />
        <Sel value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={[{ value: '', label: 'All types' }, ...Object.entries(ENQ_TYPES).map(([v, l]) => ({ value: v, label: l }))]} />
        <div className="flex gap-2">
          <Sel value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} options={[{ value: 'new', label: 'Newest' }, { value: 'old', label: 'Oldest' }, { value: 'name', label: 'Name' }]} />
          <Sel value={f.archived} onChange={(e) => setF({ ...f, archived: e.target.value })} options={[{ value: 'false', label: 'Inbox' }, { value: 'true', label: 'Archived' }]} />
        </div>
      </div>
      <div className="overflow-x-auto border border-charcoal/10 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead><tr className="border-b border-charcoal/10 text-left text-[10px] uppercase tracking-wide2 text-warm">
            {['Ref', 'Date', 'Name', 'Type', 'Product', 'Status', 'Assigned'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {data?.map((e) => (
              <tr key={e.id} onClick={() => nav(`/admin/enquiries/${e.id}`)} className={`cursor-pointer border-b border-charcoal/5 hover:bg-ivory ${e.is_read ? '' : 'font-semibold'}`}>
                <td className="px-4 py-3">{!e.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#2d4a6b]" />}{e.ref}</td>
                <td className="px-4 py-3 text-xs text-warm">{fmtDate(e.created_at)}</td>
                <td className="px-4 py-3">{e.name}<div className="text-xs font-normal text-taupe">{e.company || e.email}</div></td>
                <td className="px-4 py-3 text-xs">{ENQ_TYPES[e.enquiry_type] || e.enquiry_type}{e.source === 'chat' && <span className="ml-1"><Badge>chat</Badge></span>}</td>
                <td className="px-4 py-3 text-xs">{e.product_name}</td>
                <td className="px-4 py-3"><Badge tone={e.status}>{e.status.replace('_', ' ')}</Badge></td>
                <td className="px-4 py-3 text-xs">{e.assigned_name || '·'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && !data.length && <div className="p-10 text-center text-sm text-taupe">No enquiries.</div>}
      </div>
    </>
  );
}

export function EnquiryDetail() {
  const { id } = useParams();
  const { data: e, reload } = useLoad<any>(`/api/admin/enquiries/${id}`, [id]);
  const { data: staff } = useLoad<any[]>('/api/admin/staff');
  const [note, setNote] = useState('');
  const [reply, setReply] = useState('');
  const toast = useToast();
  if (!e) return <div className="p-10 text-taupe">Loading…</div>;
  const upd = async (body: any) => { await api(`/api/admin/enquiries/${id}`, { method: 'PUT', json: body }); toast('Updated'); reload(); };
  return (
    <>
      <div className="mb-2 text-xs"><Link to="/admin/enquiries" className="text-warm hover:text-charcoal">← Enquiries</Link></div>
      <PageHead title={`${e.ref} · ${e.name}`}>
        <Btn kind="line" onClick={() => upd({ archived: !e.archived })}>{e.archived ? 'Unarchive' : 'Archive'}</Btn>
        <Btn kind="line" onClick={() => upd({ is_read: false })}>Mark unread</Btn>
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Message">
            <p className="whitespace-pre-wrap leading-relaxed">{e.message}</p>
            {e.attachment_name && <a href={`/api/admin/enquiries/${e.id}/attachment`} className="mt-5 inline-flex border border-charcoal/20 px-4 py-2 text-xs hover:border-charcoal">📎 {e.attachment_name}</a>}
          </Card>
          <Card title="Reply by email">
            <Area rows={5} value={reply} onChange={(ev) => setReply(ev.target.value)} placeholder={`Dear ${e.name},`} />
            <div className="mt-3 flex items-center gap-3"><Btn disabled={!reply.trim()} onClick={async () => { const r = await api(`/api/admin/enquiries/${id}/reply`, { json: { body: reply } }); toast(r.sent ? 'Reply sent' : 'Saved. Email not sent (SMTP not configured)', r.sent ? 'ok' : 'err'); setReply(''); reload(); }}>Send reply</Btn>
              <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Your enquiry ${e.ref}`)}`} className="text-xs text-warm underline">Or open in your mail app</a></div>
          </Card>
          <Card title="Timeline and internal notes">
            <div className="space-y-4">
              {e.notes.map((n: any) => (
                <div key={n.id} className={`border-l-2 pl-4 ${n.kind === 'reply' ? 'border-[#3d6b4a]' : n.kind === 'status' ? 'border-sand' : 'border-bronze'}`}>
                  <div className="text-[10px] uppercase tracking-wide2 text-taupe">{n.kind} · {n.user_name || 'System'} · {fmtDate(n.created_at)}</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">{n.body}</div>
                </div>
              ))}
              <div className="flex gap-2"><Input value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Add an internal note (not visible to the customer)" />
                <Btn disabled={!note.trim()} onClick={async () => { await api(`/api/admin/enquiries/${id}/notes`, { json: { body: note } }); setNote(''); reload(); }}>Add</Btn></div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Status">
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => <button key={s} onClick={() => upd({ status: s })} className={`border px-3 py-2 text-xs capitalize ${e.status === s ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/15 hover:border-charcoal'}`}>{s.replace('_', ' ')}</button>)}
            </div>
            <div className="mt-5"><div className="mb-1.5 text-[10px] uppercase tracking-wide2 text-warm">Assigned to</div>
              <Sel value={e.assigned_to ?? ''} onChange={(ev) => upd({ assigned_to: ev.target.value ? Number(ev.target.value) : null })} options={[{ value: '', label: 'Unassigned' }, ...(staff || []).map((s) => ({ value: s.id, label: s.name || s.email }))]} /></div>
          </Card>
          <Card title="Customer">
            <dl className="space-y-3 text-sm">
              {[['Name', e.name], ['Company', e.company], ['Email', e.email], ['Phone', e.phone], ['Type', ENQ_TYPES[e.enquiry_type]], ['Product', e.product_name], ['Project', e.project_type], ['Language', e.lang === 'el' ? 'Greek' : 'English'], ['Source', e.source], ['Received', fmtDate(e.created_at)]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-2"><dt className="text-warm">{k}</dt><dd className="col-span-2 break-words">{k === 'Email' ? <a className="underline" href={`mailto:${v}`}>{v}</a> : k === 'Phone' ? <a className="underline" href={`tel:${v}`}>{v}</a> : v}</dd></div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

export function Chats() {
  const { id } = useParams();
  const [filter, setFilter] = useState('open');
  const { data: list, reload } = useLoad<any[]>('/api/admin/chats');
  const { data: conv, reload: reloadConv } = useLoad<any>(id ? `/api/admin/chats/${id}` : null, [id]);
  const [text, setText] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const toast = useToast();
  useEffect(() => { const t = setInterval(() => { reload(); if (id) reloadConv(); }, 5000); return () => clearInterval(t); }, [id, reload, reloadConv]);
  useEffect(() => { box.current?.scrollTo({ top: 1e6 }); }, [conv?.messages?.length]);
  const shown = (list || []).filter((c) => filter === 'all' ? true : filter === 'unread' ? c.unread_admin > 0 : filter === 'open' ? c.status !== 'closed' : c.status === filter);
  const send = async (ev: React.FormEvent) => { ev.preventDefault(); if (!text.trim()) return; await api(`/api/admin/chats/${id}/messages`, { json: { body: text } }); setText(''); reloadConv(); reload(); };
  return (
    <>
      <PageHead title="Live chat" />
      <div className="grid h-[calc(100vh-180px)] min-h-[520px] border border-charcoal/10 bg-white lg:grid-cols-[300px_1fr_260px]">
        <div className="flex min-h-0 flex-col border-r border-charcoal/10">
          <div className="flex flex-wrap gap-1 border-b border-charcoal/10 p-2">
            {['open', 'active', 'waiting', 'unread', 'closed', 'all'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-[10px] uppercase tracking-wide ${filter === f ? 'bg-charcoal text-ivory' : 'text-warm'}`}>{f}</button>)}
          </div>
          <div className="flex-1 overflow-y-auto">
            {shown.map((c) => (
              <button key={c.id} onClick={() => nav(`/admin/chat/${c.id}`)} className={`block w-full border-b border-charcoal/5 px-4 py-3 text-left hover:bg-ivory ${String(c.id) === id ? 'bg-ivory' : ''}`}>
                <div className="flex items-center justify-between"><span className={`text-sm ${c.unread_admin ? 'font-semibold' : ''}`}>{c.name || 'Visitor'}</span>{c.unread_admin > 0 && <span className="rounded-full bg-[#2d4a6b] px-1.5 text-[10px] text-white">{c.unread_admin}</span>}</div>
                <div className="truncate text-xs text-taupe">{c.last_body}</div>
                <div className="mt-1 flex items-center gap-2"><Badge tone={c.status}>{c.status}</Badge><span className="text-[10px] text-taupe">{fmtDate(c.last_message_at)}</span></div>
              </button>
            ))}
            {!shown.length && <div className="p-6 text-center text-xs text-taupe">No conversations</div>}
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          {conv ? (
            <>
              <div ref={box} className="flex-1 space-y-3 overflow-y-auto bg-ivory/50 p-5">
                {conv.messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 text-sm ${m.sender === 'visitor' ? 'bg-white shadow-sm' : 'bg-charcoal text-ivory'}`}>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className={`mt-1 text-[10px] ${m.sender === 'visitor' ? 'text-taupe' : 'text-ivory/50'}`}>{m.user_name ? `${m.user_name} · ` : ''}{fmtDate(m.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-charcoal/10 p-3">
                <Input value={text} onChange={(ev) => setText(ev.target.value)} placeholder="Type a reply" /><Btn>Send</Btn>
              </form>
            </>
          ) : <div className="flex flex-1 items-center justify-center text-sm text-taupe">Select a conversation</div>}
        </div>
        <div className="hidden border-l border-charcoal/10 p-5 lg:block">
          {conv && (
            <div className="space-y-4 text-sm">
              <div className="text-[10px] uppercase tracking-wide2 text-warm">Visitor</div>
              <div className="font-medium">{conv.name}</div>
              {conv.email && <a href={`mailto:${conv.email}`} className="block underline">{conv.email}</a>}
              {conv.phone && <a href={`tel:${conv.phone}`} className="block underline">{conv.phone}</a>}
              <div className="text-xs text-taupe">Started on {conv.page || '/'} · {conv.lang === 'el' ? 'Greek' : 'English'} · {conv.channel}</div>
              <div className="flex flex-wrap gap-2 pt-2">
                {['active', 'waiting', 'closed'].map((s) => <button key={s} onClick={async () => { await api(`/api/admin/chats/${conv.id}`, { method: 'PUT', json: { status: s } }); reloadConv(); reload(); }} className={`border px-2.5 py-1 text-xs capitalize ${conv.status === s ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/15'}`}>{s}</button>)}
              </div>
              <Btn kind="line" onClick={async () => { const r = await api(`/api/admin/chats/${conv.id}/convert`, { method: 'POST' }); toast('Enquiry created'); nav(`/admin/enquiries/${r.id}`); }}>Convert to enquiry</Btn>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
