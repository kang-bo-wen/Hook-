'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiRequest, getToken } from '../api';

type Profile = { nickname: string | null; school: string | null; city: string | null; bio: string | null; interests: string[]; relationshipGoal: string | null; personalityTags: string[]; languages: string[]; communicationStyle: string | null; profileCompletedAt: string | null };
type User = { email: string; profile: Profile | null };
type Reply = { id: string; content: string; wantsPrivateChat: boolean; authorResponse: 'ACCEPT' | 'DECLINE' | 'ACK' | null };
type Hook = { id: string; title: string; content: string; category: string; status: string; createdAt: string; assignment?: { reply?: Reply | null } | null };
type Received = { id: string; status: string; expiresAt: string; hook: { id: string; title: string; content: string; category: string }; reply: Reply | null };
type ReceiveState = 'WAITING_NEW' | 'WAITING_AUTHOR' | 'NEW_HOOK' | 'AUTHOR_REPLY';
type PublishState = 'IDLE' | 'WAITING_REPLY' | 'NEW_REPLY';

const receiveCopy: Record<ReceiveState, { label: string; title: string; tone: string }> = {
  WAITING_NEW: { label: '等待新 Hook', title: '留一块空白，等一句话抵达。', tone: 'gray-1' },
  WAITING_AUTHOR: { label: '等待贴主回应', title: '你的回应已送达。', tone: 'gray-3' },
  NEW_HOOK: { label: '收到新 Hook', title: '有人把一句话交给了你。', tone: 'green-1' },
  AUTHOR_REPLY: { label: '收到贴主回复', title: '贴主回应了你的私聊期待。', tone: 'green-3' },
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [received, setReceived] = useState<Received[]>([]);
  const [panel, setPanel] = useState<'profile' | 'history' | 'drafts' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [wantsPrivateChat, setWantsPrivateChat] = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.replace('/auth'); return; }
    if (new URLSearchParams(window.location.search).get('drafts') === '1') setPanel('drafts');
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const [nextUser, nextHooks, nextReceived] = await Promise.all([apiRequest<User>('/auth/me'), apiRequest<Hook[]>('/hooks/mine'), apiRequest<Received[]>('/received')]);
      setUser(nextUser); setHooks(nextHooks); setReceived(nextReceived); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : '加载失败'); } finally { setLoading(false); }
  }

  const channels = useMemo(() => {
    const newHook = received.find(item => ['ASSIGNED', 'VIEWED'].includes(item.status));
    const waitingAuthor = received.find(item => item.status !== 'CLOSED' && item.reply?.wantsPrivateChat && !item.reply.authorResponse);
    const authorReply = received.find(item => item.status !== 'CLOSED' && item.reply?.authorResponse);
    const waitingReply = hooks.find(item => ['WAITING_MATCH', 'ASSIGNED'].includes(item.status));
    const newReply = hooks.find(item => item.status === 'ANSWERED' && item.assignment?.reply);
    const receive = newHook ? { state: 'NEW_HOOK' as ReceiveState, received: newHook }
      : waitingAuthor ? { state: 'WAITING_AUTHOR' as ReceiveState, received: waitingAuthor }
      : authorReply ? { state: 'AUTHOR_REPLY' as ReceiveState, received: authorReply }
      : { state: 'WAITING_NEW' as ReceiveState };
    const publish = newReply ? { state: 'NEW_REPLY' as PublishState, hook: newReply }
      : waitingReply ? { state: 'WAITING_REPLY' as PublishState, hook: waitingReply }
      : { state: 'IDLE' as PublishState };
    return { receive, publish };
  }, [hooks, received]);

  const drafts = hooks.filter(item => item.status === 'DRAFT');
  const history = hooks.filter(item => item.status !== 'DRAFT');
  const receive = channels.receive;
  const publish = channels.publish;
  const copy = receiveCopy[receive.state];

  async function act(action: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await action(); setReplyContent(''); setWantsPrivateChat(false); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : '操作失败'); } finally { setBusy(false); }
  }

  async function acknowledgeAuthor(assignmentId: string) {
    setBusy(true); setError('');
    try {
      await apiRequest(`/received/${assignmentId}/acknowledge-author`, { method: 'POST' });
      setReceived(current => current.map(item => item.id === assignmentId ? { ...item, status: 'CLOSED' } : item));
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : '确认失败'); } finally { setBusy(false); }
  }

  function logout() { localStorage.removeItem('hook_token'); window.location.replace('/'); }
  async function deleteAccount() {
    if (!window.confirm('注销后将无法再次登录，确定继续吗？')) return;
    await act(() => apiRequest('/users/me', { method: 'DELETE' }));
    localStorage.removeItem('hook_token'); window.location.replace('/');
  }

  if (loading) return <main className="container"><p className="lede">正在打开你的 Hook 收件区…</p></main>;

  return <main className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Link className="logo" href="/me">h<span>oo</span>k</Link>
      <div className="sidebar-user"><div className="avatar">{user?.profile?.nickname?.slice(0, 1) || user?.email.slice(0, 1).toUpperCase()}</div><div><strong>{user?.profile?.nickname || '还没有昵称'}</strong><small>{user?.email}</small></div></div>
      <nav className="sidebar-nav">
        <button className={!panel ? 'active' : ''} onClick={() => setPanel(null)}>Hook 收件区</button>
        <button className={panel === 'drafts' ? 'active' : ''} onClick={() => setPanel('drafts')}>草稿箱 <span>{drafts.length}</span></button>
        <button className={panel === 'history' ? 'active' : ''} onClick={() => setPanel('history')}>我的发布历史</button>
        <button className={panel === 'profile' ? 'active' : ''} onClick={() => setPanel('profile')}>个人资料</button>
        <Link href="/receive">接收偏好</Link>
      </nav>
      <div className="sidebar-bottom"><button onClick={logout}>退出登录</button><button className="danger-link" onClick={deleteAccount}>注销账号</button></div>
    </aside>

    <section className="dashboard-main">
      {error && <div className="error dashboard-message">{error}</div>}
      {!user?.profile?.profileCompletedAt && <div className="notice dashboard-message">请先完善个人资料，才能发布或参与匹配。</div>}

      {panel === 'profile' && <section className="dashboard-panel"><div className="eyebrow">个人资料</div><h2>{user?.profile?.nickname || '还没有昵称'}</h2><p className="lede">{user?.profile?.bio || '还没有个人简介。'}</p><div className="profile-facts"><span>{user?.profile?.school || '学校未填写'}</span><span>{user?.profile?.city || '城市未填写'}</span><span>{user?.profile?.interests?.join('、') || '兴趣未填写'}</span></div><div className="actions"><Link className="button primary" href="/me/profile">编辑个人资料</Link><Link className="button secondary" href="/receive">调整接收偏好</Link></div></section>}

      {panel === 'drafts' && <section className="dashboard-panel"><div className="section-heading"><div><div className="eyebrow">草稿箱</div><h2>候选发布</h2></div><Link className="button primary" href="/publish?mode=draft">新建草稿</Link></div>{drafts.length ? <div className="hook-preview-grid">{drafts.map(hook => <article className="hook-preview" key={hook.id}><small>{hook.category}</small><h3>{hook.title}</h3><p>{hook.content}</p><div className="actions compact"><Link className="button secondary" href={`/me/hooks/${hook.id}`}>编辑</Link><button className="button primary" disabled={busy} onClick={() => act(() => apiRequest(`/hooks/${hook.id}/publish`, { method: 'POST' }))}>发布</button><button className="button ghost-danger" disabled={busy} onClick={() => window.confirm('确定彻底删除这个草稿吗？') && act(() => apiRequest(`/hooks/${hook.id}`, { method: 'DELETE' }))}>删除</button></div></article>)}</div> : <div className="empty-card">草稿箱还是空的。你可以保存多个候选想法，再选择一个发布。</div>}</section>}

      {panel === 'history' && <section className="dashboard-panel"><div className="eyebrow">发布历史</div><h2>我写出的 Hook</h2>{history.length ? <div className="hook-preview-grid">{history.map(hook => <Link className="hook-preview" href={`/me/hooks/${hook.id}`} key={hook.id}><small>{hook.category}</small><h3>{hook.title}</h3><p>{hook.content}</p><span>{new Date(hook.createdAt).toLocaleDateString('zh-CN')} · {hook.status}</span></Link>)}</div> : <div className="empty-card">你还没有发布过 Hook。</div>}</section>}

      {!panel && <section className="inbox-stage">
        <div className="inbox-heading"><div><div className="eyebrow">独立收发通道</div><h1>我的 Hook 工作台</h1></div></div>
        <div className="channel-grid">
          <article className="channel-panel publish-channel">
            <div className="section-heading"><div><div className="eyebrow">Hook 发布区</div><h2>{publish.state === 'NEW_REPLY' ? '收到对方回复' : publish.state === 'WAITING_REPLY' ? '等待对方回复' : '发布一个 Hook'}</h2></div>{publish.state === 'IDLE' && user?.profile?.profileCompletedAt && <Link href={drafts.length ? '/me?drafts=1' : '/publish'} className="publish-plus" title="发布 Hook">+</Link>}</div>
            {publish.state === 'IDLE' && <><p>这里处理你的发布、草稿以及收到的回复。发布状态不会暂停你的接收资格。</p>{drafts.length > 0 && <button className="text-action" onClick={() => setPanel('drafts')}>从 {drafts.length} 个草稿中选择发布 →</button>}</>}
            {publish.state === 'WAITING_REPLY' && publish.hook && <><small>{publish.hook.category}</small><h3>{publish.hook.title}</h3><p>{publish.hook.content}</p><span className="board-foot">正在匹配或等待对方回应</span>{publish.hook.status === 'WAITING_MATCH' && <button className="button secondary" disabled={busy} onClick={() => act(() => apiRequest(`/hooks/${publish.hook!.id}/cancel-to-draft`, { method: 'POST' }))}>撤销并放回草稿箱</button>}</>}
            {publish.state === 'NEW_REPLY' && publish.hook?.assignment?.reply && <><small>对方的回应</small><p className="reply-highlight">{publish.hook.assignment.reply.content}</p>{publish.hook.assignment.reply.wantsPrivateChat ? <div className="actions"><button className="button primary" disabled={busy} onClick={() => act(() => apiRequest(`/received/hook/${publish.hook!.id}/respond`, { method: 'POST', body: JSON.stringify({ decision: 'ACCEPT' }) }))}>愿意建立私聊</button><button className="button secondary" disabled={busy} onClick={() => act(() => apiRequest(`/received/hook/${publish.hook!.id}/respond`, { method: 'POST', body: JSON.stringify({ decision: 'DECLINE' }) }))}>只停留在这次回应</button></div> : <><p className="muted">对方选择只进行这一次回应。</p><button className="button secondary" disabled={busy} onClick={() => act(() => apiRequest(`/received/hook/${publish.hook!.id}/respond`, { method: 'POST', body: JSON.stringify({ decision: 'ACK' }) }))}>完成这次连接</button></>}</>}
          </article>

          <article className={`channel-panel receive-channel ${copy.tone}`}>
            <div className="board-status"><span className="status-dot" />{copy.label}</div><h2>{copy.title}</h2>
            {receive.state === 'WAITING_NEW' && <p>这里仅处理接收、回复与贴主决定。即使你正在发布 Hook，也仍然可以接收新的 Hook。</p>}
            {receive.state === 'NEW_HOOK' && receive.received && <><small>{receive.received.hook.category}</small><h3>{receive.received.hook.title}</h3><p>{receive.received.hook.content}</p><div className="form-row"><label>写下你的回应</label><textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="真实地回应这句话……" /></div><label className="check-row"><input type="checkbox" checked={wantsPrivateChat} onChange={e => setWantsPrivateChat(e.target.checked)} /><span>期待建立私聊</span></label><div className="actions"><button className="button primary" disabled={busy} onClick={() => act(() => apiRequest(`/received/${receive.received!.id}/reply`, { method: 'POST', body: JSON.stringify({ content: replyContent, wantsPrivateChat }) }))}>发送回应</button><button className="button secondary" disabled={busy} onClick={() => act(() => apiRequest(`/received/${receive.received!.id}/decline`, { method: 'POST' }))}>这次不合适</button></div></>}
            {receive.state === 'WAITING_AUTHOR' && receive.received?.reply && <><small>你发出的回应</small><p className="reply-highlight">{receive.received.reply.content}</p><span className="board-foot">正在等待贴主决定是否建立私聊。</span></>}
            {receive.state === 'AUTHOR_REPLY' && receive.received?.reply && <><small>贴主的决定</small><h3>{receive.received.reply.authorResponse === 'ACCEPT' ? '对方愿意继续建立私聊。' : '对方感谢你的回应，但暂不继续私聊。'}</h3><button className="button primary" disabled={busy} onClick={() => acknowledgeAuthor(receive.received!.id)}>{busy ? '处理中…' : '知道了，回到接收区'}</button></>}
          </article>
        </div>
      </section>}
    </section>
  </main>;
}
