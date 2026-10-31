'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest, getToken } from './api';

export default function HomeClient() {
  const [checking, setChecking] = useState(true);
  useEffect(() => { if (!getToken()) { setChecking(false); return; } apiRequest('/auth/me').then(() => window.location.replace('/me')).catch(() => setChecking(false)); }, []);
  if (checking) return <main className="landing-loading"><Link className="logo" href="/">h<span>oo</span>k</Link></main>;
  return <main className="landing"><header className="landing-nav"><Link className="logo" href="/">h<span>oo</span>k</Link><Link className="button secondary" href="/auth">登录</Link></header><section className="landing-hero"><div className="landing-image" role="img" aria-label="夜色校园里亮起的窗户"/><div className="landing-copy"><span className="eyebrow">A NOTE, TO ONE PERSON</span><h1>写下一句话，<br/>让它抵达一个人。</h1><p>不刷卡，不围观。从一段真实表达开始，遇见愿意认真回应的人。</p><Link className="button primary" href="/auth">开始使用 <span>↗</span></Link></div></section><footer className="landing-footer"><span>HOOK / PRIVATE CONNECTIONS</span><span>慢一点认识，认真地回应。</span></footer></main>;
}
