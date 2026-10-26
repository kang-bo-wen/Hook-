'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../api';

const categories = ['日常片段', '认真问题', '兴趣分享', '想认识你'];
export default function PublishPage() {
  const [category, setCategory] = useState(categories[0]); const [sent, setSent] = useState(false); const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setError(''); const form = new FormData(e.currentTarget); try { await apiRequest('/hooks', { method: 'POST', body: JSON.stringify({ title: form.get('title'), content: form.get('content'), category, preferredResponses: ['TEXT'], depthLevel: form.get('depthLevel') }) }); setSent(true); } catch (err) { setError(err instanceof Error ? err.message : '请先登录后再发布'); } }
  return <><header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><Link className="back" href="/">← 返回首页</Link></header><main className="container"><div className="panel"><div className="eyebrow">发布区</div><h2>写下一个 Hook</h2><p className="lede">不需要表现得有趣。真实、具体、带一点好奇心，就足够开始一次连接。</p>{sent ? <><div className="notice">你的 Hook 已经进入等待匹配。它只会被交给一个人。</div><div className="actions"><Link className="button primary" href="/receive">去看看接收区</Link><button className="button secondary" onClick={() => setSent(false)}>再写一个</button></div></> : <form onSubmit={submit}><div className="form-row"><label htmlFor="title">标题</label><input id="title" name="title" required maxLength={100} placeholder="比如：最近有什么小事让你开心？" /></div><div className="form-row"><label>它属于</label><div className="chips">{categories.map(item => <span key={item} className={`chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</span>)}</div></div><div className="form-row"><label htmlFor="content">内容</label><textarea id="content" name="content" required placeholder="写下你想交给另一个人的话……" /></div><div className="form-row"><label htmlFor="depthLevel">希望回应的深度</label><select id="depthLevel" name="depthLevel" defaultValue="MEDIUM"><option value="LIGHT">轻松聊聊</option><option value="MEDIUM">认真回应</option><option value="DEEP">深入一点</option></select></div>{error && <div className="error">{error}。<Link href="/auth">去登录 / 注册</Link></div>}<button className="button primary" type="submit">发布这个 Hook</button></form>}</div></main></>;
}
