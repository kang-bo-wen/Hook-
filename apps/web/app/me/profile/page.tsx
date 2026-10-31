'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest, getToken } from '../../api';

type Profile = {
  nickname: string | null; school: string | null; faculty: string | null; major: string | null;
  grade: string | null; birthYear: number | null; campus: string | null; heightCm: number | null; bodyType: string | null;
  mbti: string | null; futurePlan: string | null; bio: string | null; interests: string[];
  relationshipGoal: string | null; personalityTags: string[]; languages: string[]; availableTimes: string[];
  communicationStyle: string | null; relationshipPace: string | null; conflictStyle: string | null;
};
type User = { email: string; profile: Profile | null };

const empty = { nickname: '', school: '上海交通大学', faculty: '', major: '', grade: '', campus: '', heightCm: '', bodyType: '', mbti: '', futurePlan: '', bio: '', interests: '', relationshipGoal: '', personalityTags: '', languages: '', availableTimes: [] as string[], communicationStyle: '', relationshipPace: '', conflictStyle: '' };

export default function ProfilePage() {
  const [form, setForm] = useState({ nickname: '', school: '上海交通大学', faculty: '', major: '', grade: '', birthYear: '', campus: '', heightCm: '', bodyType: '', mbti: '', futurePlan: '', bio: '', interests: '', relationshipGoal: '', personalityTags: '', languages: '', availableTimes: [] as string[], communicationStyle: '', relationshipPace: '', conflictStyle: '' });
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.replace('/auth'); return; }
    apiRequest<User>('/auth/me').then(user => {
      setEmail(user.email);
      if (!user.profile) return;
      const p = user.profile;
      setForm({ nickname: p.nickname || '', school: p.school || '上海交通大学', faculty: p.faculty || '', major: p.major || '', grade: p.grade || '', birthYear: p.birthYear?.toString() || '', campus: p.campus || '', heightCm: p.heightCm?.toString() || '', bodyType: p.bodyType || '', mbti: p.mbti || '', futurePlan: p.futurePlan || '', bio: p.bio || '', interests: p.interests.join('、'), relationshipGoal: p.relationshipGoal || '', personalityTags: p.personalityTags.join('、'), languages: p.languages.join('、'), availableTimes: p.availableTimes, communicationStyle: p.communicationStyle || '', relationshipPace: p.relationshipPace || '', conflictStyle: p.conflictStyle || '' });
    }).catch(e => setError(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const patch = (key: string, value: string | string[]) => setForm(current => ({ ...current, [key]: value }));
  const list = (value: string) => value.split(/[、,，]/).map(item => item.trim()).filter(Boolean);

  async function save() {
    setBusy(true); setError('');
    try {
      await apiRequest('/users/me/profile', { method: 'PATCH', body: JSON.stringify({ ...form, birthYear: form.birthYear ? Number(form.birthYear) : undefined, heightCm: form.heightCm ? Number(form.heightCm) : undefined, interests: list(form.interests), personalityTags: list(form.personalityTags), languages: list(form.languages) }) });
      window.location.href = '/me';
    } catch (e) { setError(e instanceof Error ? e.message : '保存失败'); } finally { setBusy(false); }
  }

  return <main className="editor-shell">
    <header className="editor-nav"><Link className="logo" href="/me">h<span>oo</span>k</Link><Link className="back" href="/me">返回工作台</Link></header>
    <section className="editor-card wide-editor">
      <div className="editor-intro"><div className="eyebrow">你的静态档案</div><h1>让匹配了解真实的你</h1><p>{email}</p></div>
      {error && <div className="error">{error}</div>}
      <div className="editor-section"><h3>学籍与基础</h3><div className="form-grid three">
        <Field label="昵称" value={form.nickname} onChange={v => patch('nickname', v)} /><Field label="学院" value={form.faculty} onChange={v => patch('faculty', v)} /><Field label="专业" value={form.major} onChange={v => patch('major', v)} /><Field label="当前学段 / 年级" value={form.grade} onChange={v => patch('grade', v)} /><Field label="出生年份" type="number" value={form.birthYear} onChange={v => patch('birthYear', v)} /><Select label="常驻校区" value={form.campus} onChange={v => patch('campus', v)} options={[["MINHANG","闵行校区"],["XUHUI","徐汇校区"],["OTHER","其他"]]} /><Select label="未来规划" value={form.futurePlan} onChange={v => patch('futurePlan', v)} options={[["POSTGRAD","保研 / 深造"],["ABROAD","出国"],["WORK","直接工作"],["PUBLIC_SECTOR","体制内"],["UNSURE","还在探索"]]} />
      </div></div>
      <div className="editor-section"><h3>外在与性格</h3><div className="form-grid three">
        <Field label="身高（cm）" type="number" value={form.heightCm} onChange={v => patch('heightCm', v)} /><Select label="体型" value={form.bodyType} onChange={v => patch('bodyType', v)} options={[["SLIM","偏瘦"],["AVERAGE","匀称"],["ATHLETIC","运动型"],["CURVY","丰满"],["OTHER","不定义"]]} /><Field label="MBTI" value={form.mbti} onChange={v => patch('mbti', v.toUpperCase())} /><Select label="交流风格" value={form.communicationStyle} onChange={v => patch('communicationStyle', v)} options={[["LISTENER","更喜欢倾听"],["BALANCED","平衡表达"],["EXPRESSIVE","主动表达"]]} /><Select label="关系节奏" value={form.relationshipPace} onChange={v => patch('relationshipPace', v)} options={[["SLOW","慢热渐进"],["BALANCED","自然推进"],["DIRECT","直接坦率"]]} /><Select label="冲突处理" value={form.conflictStyle} onChange={v => patch('conflictStyle', v)} options={[["COOL_DOWN","先冷静再沟通"],["TALK_NOW","当场说清楚"],["WRITE_FIRST","先写下来整理"]]} />
      </div></div>
      <div className="editor-section"><h3>灵魂标签</h3><div className="form-row"><label>个人简介</label><textarea value={form.bio} onChange={e => patch('bio', e.target.value)} placeholder="写下真正影响你生活方式的部分。" /></div><div className="form-grid"><Field label="长期兴趣（用顿号分隔）" value={form.interests} onChange={v => patch('interests', v)} /><Field label="性格标签" value={form.personalityTags} onChange={v => patch('personalityTags', v)} /></div><div className="form-grid"><Field label="希望认识怎样的人" value={form.relationshipGoal} onChange={v => patch('relationshipGoal', v)} /><Field label="常用语言" value={form.languages} onChange={v => patch('languages', v)} /></div></div>
      <div className="editor-footer"><span>资料仅用于匹配，不会完整展示给其他用户。</span><button className="button primary" onClick={save} disabled={busy}>{busy ? '保存中…' : '保存档案'}</button></div>
    </section>
  </main>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="form-row"><label>{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} /></div>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div className="form-row"><label>{label}</label><select value={value} onChange={e => onChange(e.target.value)}><option value="">请选择</option>{options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>; }
