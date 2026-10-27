import Link from 'next/link';

export default function Home() {
  return (
    <>
      <header className="nav"><Link className="logo" href="/">h<span>oo</span>k</Link><nav className="navlinks"><Link href="/publish">发布</Link><Link href="/receive">接收</Link><Link href="/auth">登录 / 注册</Link><Link href="/me">我的主页</Link><Link href="#about">关于 Hook</Link></nav></header>
      <main className="container">
        <section className="hero"><div><div className="eyebrow">真实的人 · 一对一的连接</div><h1>写下一句话，<br />让它抵达一个人。</h1><p className="lede">Hook 不用滑卡，也没有喧闹的广场。你写下此刻想分享的内容，我们把它交给一个真正适合听见的人。</p><div className="actions"><Link className="button primary" href="/me">进入我的主页</Link><Link className="button secondary" href="/auth">登录 / 注册</Link></div></div><div className="art"><div className="orbit" /><article className="card"><small>今日的一封 Hook</small><p>“你最近一次感到被理解，是什么时候？”</p><footer>只会抵达一个人 · 等待回应</footer></article></div></section>
        <section id="about" className="features"><div className="feature"><b>不是公开广场</b><p>每个 Hook 只匹配一个接收者，不被围观，也不被反复分配。</p></div><div className="feature"><b>慢一点认识</b><p>先从内容和回应开始，在安全的边界里逐步建立信任。</p></div><div className="feature"><b>由你决定节奏</b><p>你可以随时更新下一次想收到的主题、深度和回应方式。</p></div></section>
      </main>
    </>
  );
}
