'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../api';

const categories = ['日常片段', '认真问题', '兴趣分享', '想认识你'];

export default function PublishClient() {
  const [category, setCategory] = useState(categories[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save(event.currentTarget, false);
  }

  async function save(formElement: HTMLFormElement, saveAsDraft: boolean) {
    const form = new FormData(formElement);
    setBusy(true); setError('');
    try {
      await apiRequest('/hooks', { method: 'POST', body: JSON.stringify({ title: form.get('title'), content: form.get('content'), category, preferredResponses: ['TEXT'], depthLevel: form.get('depthLevel'), saveAsDraft }) });
      window.location.href = saveAsDraft ? '/me?drafts=1' : '/me';
    } catch (e) { setError(e instanceof Error ? e.message : '保存失败'); } finally { setBusy(false); }
  }

  return <><header className="nav"><Link className="logo" href="/me">h<span>oo</span>k</Link><Link className="back" href="/me">← 返回收件区</Link></header><main className="container"><div className="panel"><div className="eyebrow">发布 / 草稿</div><h2>写下一个 Hook</h2><p className="lede">一次只能发布一个进行中的 Hook，但你可以把更多想法保存在草稿箱。</p><form onSubmit={submit}><div className="form-row"><label htmlFor="title">标题</label><input id="title" name="title" required maxLength={100} /></div><div className="form-row"><label>它属于</label><div className="chips">{categories.map(item => <button type="button" key={item} className={`chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div></div><div className="form-row"><label htmlFor="content">内容</label><textarea id="content" name="content" required /></div><div className="form-row"><label htmlFor="depthLevel">希望回应的深度</label><select id="depthLevel" name="depthLevel" defaultValue="MEDIUM"><option value="LIGHT">轻松聊聊</option><option value="MEDIUM">认真回应</option><option value="DEEP">深入一点</option></select></div>{error && <div className="error">{error}</div>}<div className="actions"><button className="button primary" disabled={busy}>发布这个 Hook</button><button type="button" className="button secondary" disabled={busy} onClick={event => save(event.currentTarget.form!, true)}>保存到草稿箱</button></div></form></div></main></>;
}
