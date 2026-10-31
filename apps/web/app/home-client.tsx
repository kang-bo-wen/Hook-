'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest, getToken } from './api';

export default function HomeClient() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) { setChecking(false); return; }
    apiRequest('/auth/me').then(() => { window.location.replace('/me'); }).catch(() => setChecking(false));
  }, []);

  if (checking) return <main className="container"><p className="lede">正在回到你的 Hook 收件区…</p></main>;

  return <>
    <header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><nav className="navlinks"><Link href="/auth">登录 / 注册</Link><Link href="#about">关于 Hook</Link></nav></header>
    <main className="container">
      <section className="hero"><div><div className="eyebrow">真实的人 · 一对一的连接</div><h1>写下一句话，<br />让它抵达一个人。</h1><p className="lede">Hook 不用滑卡，也没有喧闹的广场。你写下此刻想分享的内容，我们把它交给一个真正适合听见的人。</p><div className="actions"><Link className="button primary" href="/auth">开始使用 Hook</Link></div></div><div className="art"><div className="orbit" /><article className="card"><small>今日的一封 Hook</small><p>“你最近一次感到被理解，是什么时候？”</p><footer>只会抵达一个人 · 等待回应</footer></article></div></section>
      <section id="about" className="features"><div className="feature"><b>不是公开广场</b><p>每个 Hook 只匹配一个接收者，不被围观，也不被反复分配。</p></div><div className="feature"><b>慢一点认识</b><p>先从内容和回应开始，在安全的边界里逐步建立信任。</p></div><div className="feature"><b>由你决定节奏</b><p>同一时间只处理一段连接，让等待、回应和选择都更清晰。</p></div></section>
    </main>
  </>;
}
