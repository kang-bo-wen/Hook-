'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest, getToken } from '../../../api';

type Hook = {
  id: string; title: string; content: string; category: string; status: string; createdAt: string;
  preferredResponses: string[]; depthLevel: string | null;
  assignment?: { id: string; status: string; assignedAt: string; respondedAt: string | null } | null;
  replies?: { content: string; createdAt: string }[];
};
const categories = ['日常片段', '认真问题', '兴趣分享', '想认识你'];
const statusLabel: Record<string, string> = { WAITING_MATCH: '等待匹配', ASSIGNED: '已送达', ANSWERED: '已收到回应', CLOSED: '已关闭', DRAFT: '草稿' };

export default function HookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [hook, setHook] = useState<Hook | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: categories[0], depthLevel: 'MEDIUM' });

  useEffect(() => {
    if (!getToken()) { window.location.href = '/auth'; return; }
    params.then(({ id }) => apiRequest<Hook>(`/hooks/${id}`)).then(data => {
      setHook(data);
      setForm({ title: data.title, content: data.content, category: data.category, depthLevel: data.depthLevel || 'MEDIUM' });
    }).catch(e => setError(e instanceof Error ? e.message : '加载失败'));
  }, [params]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hook) return;
    setBusy(true); setError('');
    try {
      const updated = await apiRequest<Hook>(`/hooks/${hook.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      setHook(current => current ? { ...current, ...updated } : updated);
      setEditing(false);
    } catch (e) { setError(e instanceof Error ? e.message : '保存失败'); } finally { setBusy(false); }
  }

  async function remove() {
    if (!hook || !window.confirm('确定删除这个 Hook 吗？删除后无法恢复。')) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/hooks/${hook.id}`, { method: 'DELETE' });
      window.location.href = '/me';
    } catch (e) { setError(e instanceof Error ? e.message : '删除失败'); setBusy(false); }
  }

  if (!hook && error) return <main className="container"><div className="error">{error}</div><Link className="button secondary" href="/me">返回我的主页</Link></main>;
  if (!hook) return <main className="container"><p className="lede">正在打开 Hook…</p></main>;
  const canManage = !hook.assignment && ['DRAFT', 'WAITING_MATCH'].includes(hook.status);

  return <><header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><Link className="back" href="/me">← 返回我的主页</Link></header><main className="container"><article className="panel detail-panel"><div className="eyebrow">我的 Hook · {statusLabel[hook.status] || hook.status}</div>{error && <div className="error">{error}</div>}{editing ? <form onSubmit={save}><div className="form-row"><label htmlFor="title">标题</label><input id="title" required maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div><div className="form-row"><label>它属于</label><div className="chips">{categories.map(item => <button type="button" key={item} className={`chip ${form.category === item ? 'active' : ''}`} onClick={() => setForm({ ...form, category: item })}>{item}</button>)}</div></div><div className="form-row"><label htmlFor="content">内容</label><textarea id="content" required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div><div className="form-row"><label htmlFor="depthLevel">希望回应的深度</label><select id="depthLevel" value={form.depthLevel} onChange={e => setForm({ ...form, depthLevel: e.target.value })}><option value="LIGHT">轻松聊聊</option><option value="MEDIUM">认真回应</option><option value="DEEP">深入一点</option></select></div><div className="actions"><button className="button primary" disabled={busy}>{busy ? '保存中…' : '保存修改'}</button><button type="button" className="button secondary" onClick={() => setEditing(false)} disabled={busy}>取消</button></div></form> : <><h2>{hook.title}</h2><p className="detail-content">{hook.content}</p><div className="detail-meta"><span>{hook.category}</span><span>发布于 {new Date(hook.createdAt).toLocaleString('zh-CN')}</span></div>{canManage && <div className="actions"><button className="button primary" onClick={() => setEditing(true)}>重新编辑</button><button className="button secondary" onClick={remove} disabled={busy}>{busy ? '删除中…' : '删除 Hook'}</button></div>}{hook.assignment && <div className="notice">这个 Hook 已经被送达给一位接收者，不能再编辑或删除。</div>}{hook.replies?.map(reply => <div className="reply-card" key={reply.createdAt}><small>收到回应 · {new Date(reply.createdAt).toLocaleString('zh-CN')}</small><p>{reply.content}</p></div>)}</>}</article></main></>;
}
