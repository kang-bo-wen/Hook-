'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import PublishClient, { EditableHook } from '../../../../publish/publish-client';
import { apiRequest, getToken } from '../../../../api';

export default function EditHookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hook, setHook] = useState<EditableHook | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { window.location.replace('/auth'); return; }
    apiRequest<EditableHook & { status: string }>(`/hooks/${id}`)
      .then(data => {
        if (data.status !== 'DRAFT') throw new Error('只有草稿可以进入编辑器');
        setHook(data);
      })
      .catch(error => setError(error instanceof Error ? error.message : '加载草稿失败'));
  }, [id]);

  if (error) return <main className="editor-shell"><header className="editor-nav"><Link className="logo" href="/me">h<span>oo</span>k</Link><Link className="back" href="/me?drafts=1">返回草稿箱</Link></header><div className="compose-card error">{error}</div></main>;
  if (!hook) return <main className="landing-loading"><Link className="logo" href="/me">h<span>oo</span>k</Link></main>;
  return <PublishClient initialHook={hook} />;
}
