'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiRequest, AuthResponse } from '../api';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function sendCode() {
    setError(''); setLoading(true);
    try { await apiRequest('/auth/send-email-code', { method: 'POST', body: JSON.stringify({ email }) }); setCodeSent(true); }
    catch (err) { setError(err instanceof Error ? err.message : '验证码发送失败'); }
    finally { setLoading(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await apiRequest<AuthResponse>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password, ...(mode === 'register' ? { nickname, verificationCode } : {}) }) });
      localStorage.setItem('hook_token', data.token);
      window.location.href = '/';
    } catch (err) { setError(err instanceof Error ? err.message : '操作失败'); } finally { setLoading(false); }
  }
  return <><header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><Link className="back" href="/">← 返回首页</Link></header><main className="container"><div className="panel auth-panel"><div className="eyebrow">加入 Hook 内测</div><h2>{mode === 'register' ? '先认识自己，再认识别人。' : '欢迎回来。'}</h2><p className="lede">这里没有公开的热闹，只有一次认真发生的连接。</p><div className="chips"><span className={`chip ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>注册</span><span className={`chip ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>登录</span></div><form onSubmit={submit}><div className="form-row"><label htmlFor="email">邮箱</label><input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>{mode === 'register' && <><div className="form-row"><label htmlFor="verificationCode">邮箱验证码</label><div className="code-row"><input id="verificationCode" required inputMode="numeric" maxLength={6} value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\\D/g, '').slice(0, 6))} placeholder="6 位验证码" /><button type="button" className="button secondary" onClick={sendCode} disabled={loading || !email}>{loading ? '请稍候…' : codeSent ? '重新发送' : '发送验证码'}</button></div></div><div className="form-row"><label htmlFor="nickname">怎么称呼你？（可选）</label><input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={40} placeholder="一个昵称就好" /></div></>}<div className="form-row"><label htmlFor="password">密码</label><input id="password" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="至少 8 位" /></div>{error && <div className="error">{error}</div>}<button className="button primary" disabled={loading}>{loading ? '处理中…' : mode === 'register' ? '创建我的账号' : '登录'}</button></form></div></main></>;
}
