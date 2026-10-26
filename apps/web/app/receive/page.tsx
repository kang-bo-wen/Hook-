'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../api';

const topics = ['日常片段', '认真问题', '兴趣分享', '想认识你'];
export default function ReceivePage() {
  const [selected, setSelected] = useState<string[]>(['认真问题']); const [saved, setSaved] = useState(false); const [error, setError] = useState('');
  useEffect(() => { apiRequest<{ topicTypes: string[] } | null>('/receiver-preferences/me').then(data => data?.topicTypes?.length && setSelected(data.topicTypes)).catch(() => undefined); }, []);
  const toggle = (topic: string) => setSelected(current => current.includes(topic) ? current.filter(item => item !== topic) : [...current, topic]);
  async function save() { setError(''); try { await apiRequest('/receiver-preferences/me', { method: 'PATCH', body: JSON.stringify({ topicTypes: selected, responseModes: ['TEXT'], excludedTypes: [], depthLevel: 'MEDIUM', naturalLanguage: (document.getElementById('note') as HTMLTextAreaElement).value }) }); setSaved(true); } catch (err) { setError(err instanceof Error ? err.message : '请先登录后保存'); } }
  return <><header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><Link className="back" href="/">← 返回首页</Link></header><main className="container"><div className="panel"><div className="eyebrow">接收区</div><h2>你想收到什么？</h2><p className="lede">告诉我们下一次你愿意接住怎样的话。偏好只对下一次 Hook 生效，你可以随时改变主意。</p>{saved && <div className="notice">偏好已保存。我们会为你寻找一个合适的 Hook。</div>}<div className="form-row"><label>我想聊聊</label><div className="chips">{topics.map(topic => <span key={topic} className={`chip ${selected.includes(topic) ? 'active' : ''}`} onClick={() => toggle(topic)}>{topic}</span>)}</div></div><div className="form-row"><label htmlFor="mode">我希望对方</label><select id="mode"><option>认真回应我的内容</option><option>轻松地聊几句</option><option>问我一个问题</option></select></div><div className="form-row"><label htmlFor="depth">这次想要的深度</label><select id="depth"><option>中等 —— 有一点真诚，也不必有压力</option><option>浅一点 —— 轻松就好</option><option>深一点 —— 我愿意认真聊聊</option></select></div><div className="form-row"><label htmlFor="note">还有什么想说的？（可选）</label><textarea id="note" placeholder="比如：最近在适应新城市，希望收到一点关于生活的分享。" /></div>{error && <div className="error">{error}。<Link href="/auth">去登录 / 注册</Link></div>}<button className="button primary" onClick={save}>保存这次偏好</button></div></main></>;
}
