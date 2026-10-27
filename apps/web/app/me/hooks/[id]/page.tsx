'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest, getToken } from '../../../api';

type Hook = { id: string; title: string; content: string; category: string; status: string; createdAt: string; assignment?: { id: string; status: string; assignedAt: string; respondedAt: string | null } | null; replies?: { content: string; createdAt: string }[] };
const statusLabel: Record<string, string> = { WAITING_MATCH: '等待匹配', ASSIGNED: '已送达', ANSWERED: '已收到回应', CLOSED: '已关闭', DRAFT: '草稿' };
export default function HookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [hook, setHook] = useState<Hook | null>(null); const [error, setError] = useState('');
  useEffect(() => { if (!getToken()) { window.location.href = '/auth'; return; } params.then(({ id }) => apiRequest<Hook>(`/hooks/${id}`).then(setHook).catch(e => setError(e instanceof Error ? e.message : '加载失败'))); }, [params]);
  if (error) return <main className="container"><div className="error">{error}</div><Link className="button secondary" href="/me">返回我的主页</Link></main>;
  if (!hook) return <main className="container"><p className="lede">正在打开 Hook…</p></main>;
  return <><header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><Link className="back" href="/me">← 返回我的主页</Link></header><main className="container"><article className="panel detail-panel"><div className="eyebrow">我的 Hook · {statusLabel[hook.status] || hook.status}</div><h2>{hook.title}</h2><p className="detail-content">{hook.content}</p><div className="detail-meta"><span>{hook.category}</span><span>发布于 {new Date(hook.createdAt).toLocaleString('zh-CN')}</span></div>{hook.assignment && <div className="notice">这个 Hook 已经被送达给一位接收者。等待回应。</div>}{hook.replies?.map(reply => <div className="reply-card" key={reply.createdAt}><small>收到回应 · {new Date(reply.createdAt).toLocaleString('zh-CN')}</small><p>{reply.content}</p></div>)}</article></main></>;
}
