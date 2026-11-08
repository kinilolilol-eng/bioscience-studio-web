import { useState } from 'react';
import { useMutation } from '../api.js';
import { Brand, Input, Notice } from './ui.jsx';

export default function Auth({ setupRequired, invite, onAuthenticated, initialEmail = '', onCancelInvite, onBack }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [existingAccount, setExistingAccount] = useState(Boolean(initialEmail));
  const { run, pending, error } = useMutation();
  const accepting = Boolean(invite) && !setupRequired;
  const title = setupRequired ? 'Create your owner account' : accepting ? 'Join your protocol workspace' : 'Welcome back';
  async function submit(event) {
    event.preventDefault();
    try {
      const result = await run(setupRequired ? '/setup' : accepting ? '/invites/accept' : '/login', { email, password, ...(accepting ? { token: invite } : {}) });
      if (result) { setPassword(''); onAuthenticated(result); }
    } catch { /* Keep credentials in the form for a deliberate retry. */ }
  }
  return <main className="auth-page"><div className="auth-brand"><Brand large /></div><section className="auth-panel"><div className="auth-heading"><h1>{title}</h1><p>{setupRequired ? 'This account manages the shared library and private workspaces.' : accepting ? existingAccount ? 'Sign in to accept this workspace invitation.' : 'Create your sign-in to access your assigned protocol.' : 'Sign in to your private protocol and records.'}</p></div>
    <form onSubmit={submit}><Input label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength="200" /><Input label="Password" type="password" autoComplete={setupRequired || (accepting && !existingAccount) ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength="12" maxLength="200" hint={accepting && existingAccount ? 'Use your existing account password.' : setupRequired || accepting ? 'At least 12 characters.' : undefined} /><Notice>{error}</Notice><button className="button primary full-width" disabled={pending}>{pending ? 'Signing in…' : setupRequired ? 'Create owner account' : accepting ? existingAccount ? 'Sign in and accept invitation' : 'Accept invitation' : 'Sign in'}</button></form>
    {accepting && <><p className="auth-foot">{existingAccount ? 'Need a new account?' : 'Already have an account?'} <button type="button" className="text-button" onClick={() => { setExistingAccount(!existingAccount); setPassword(''); }}>{existingAccount ? 'Create one' : 'Use existing sign-in'}</button></p>{onCancelInvite && <p className="auth-foot"><button type="button" className="text-button" onClick={onCancelInvite}>Cancel invitation</button></p>}</>}
  </section>{!accepting && onBack && <p className="auth-foot"><button type="button" className="text-button" onClick={onBack}>Back to stack check</button></p>}<p className="auth-note">Your plan, your actual records, one connected view.</p></main>;
}
