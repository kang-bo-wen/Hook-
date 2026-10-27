'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../api';

const topics = ['日常片段', '认真问题', '兴趣分享', '想认识你'];
type Preference = { topicTypes: string[]; responseModes: string[]; depthLevel: string | null; excludedTypes: string[]; naturalLanguage: string | null };

export default function ReceivePage() {
  const [selected, setSelected] = useState<string[]>(['认真问题']);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [mode, setMode] = useState('TEXT');
  const [depth, setDepth] = useState('MEDIUM');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false); const [error, setError] = useState('');
  useEffect(() => { apiRequest<Preference | null>('/receiver-preferences/me').then(data => { if (!data) return; setSelected(data.topicTypes); setExcluded(data.excludedTypes); setMode(data.responseModes[0] || 'TEXT'); setDepth(data.depthLevel || 'MEDIUM'); setNote(data.naturalLanguage || ''); }).catch(() => undefined); }, []);
  const toggle = (topic: string, setter: typeof setSelected) => setter(current => current.includes(topic) ? current.filter(item => item !== topic) : [...current, topic]);
  async function save() { setError(''); setSaved(false); if (!selected.length) { setError('请至少选择一个想聊的话题'); return; } try { await apiRequest('/receiver-preferences/me', { method: 'PATCH', body: JSON.stringify({ topicTypes: selected, responseModes: [mode], excludedTypes: excluded, depthLevel: depth, naturalLanguage: note }) }); setSaved(true); } catch (err) { setError(err instanceof Error ? err.message : '请先登录后保存'); } }
  return <><header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><Link className="back" href="/me">← 返回我的主页</Link></header><main className="container"><div className="panel"><div className="eyebrow">接收区</div><h2>你想收到什么？</h2><p className="lede">偏好会直接参与匹配。系统还会避免一天内重复接收、未处理时继续分配，以及短期内反复匹配同一位发布者。</p>{saved && <div className="notice">偏好已保存。下一次匹配会使用这些条件。</div>}<div className="form-row"><label>我想聊聊</label><div className="chips">{topics.map(topic => <span key={topic} className={`chip ${selected.includes(topic) ? 'active' : ''}`} onClick={() => toggle(topic, setSelected)}>{topic}</span>)}</div></div><div className="form-row"><label>这次不想收到</label><div className="chips">{topics.map(topic => <span key={topic} className={`chip ${excluded.includes(topic) ? 'active' : ''}`} onClick={() => toggle(topic, setExcluded)}>{topic}</span>)}</div></div><div className="form-row"><label htmlFor="mode">我愿意怎样回应</label><select id="mode" value={mode} onChange={event => setMode(event.target.value)}><option value="TEXT">认真写一段文字</option><option value="QUESTION">用问题继续了解</option><option value="SHARE">分享相似经历</option><option value="VOICE">语音交流</option></select></div><div className="form-row"><label htmlFor="depth">这次想要的深度</label><select id="depth" value={depth} onChange={event => setDepth(event.target.value)}><option value="LIGHT">浅一点 —— 轻松就好</option><option value="MEDIUM">中等 —— 真诚但没有压力</option><option value="DEEP">深一点 —— 愿意认真聊聊</option></select></div><div className="form-row"><label htmlFor="note">补充说明（可选）</label><textarea id="note" value={note} onChange={event => setNote(event.target.value)} placeholder="比如：最近在适应新城市，希望收到一点关于生活的分享。" /></div>{error && <div className="error">{error}。<Link href="/auth">去登录 / 注册</Link></div>}<button className="button primary" onClick={save}>保存这次偏好</button></div></main></>;
}
