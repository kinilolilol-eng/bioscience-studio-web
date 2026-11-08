import { useEffect, useState } from 'react';
import { request, resetSessionScope, useMutation } from './api.js';
import useWorkspace from './hooks/useWorkspace.js';
import Auth from './components/Auth.jsx';
import { Brand, Empty, Icon, Loading, Notice, Select } from './components/ui.jsx';
import LibraryDrawer from './components/LibraryDrawer.jsx';
import WorkspaceDrawer, { CreateWorkspace } from './components/WorkspaceDrawer.jsx';
import ConsultationDrawer from './components/ConsultationDrawer.jsx';
import Today from './views/Today.jsx';
import Compare from './views/Compare.jsx';
import Progress from './views/Progress.jsx';
import Models from './views/Models.jsx';
import PublicStack from './views/PublicStack.jsx';

function Companion({ user, initialWorkspace, prefilledConsult, onClearPrefill, onSignedOut, onPublic }) {
  const data = useWorkspace(initialWorkspace);
  const [view, setView] = useState('today');
  const [panel, setPanel] = useState(() => (prefilledConsult ? 'consult' : null));
  const [reloadError, setReloadError] = useState('');
  const logout = useMutation();
  const owner = user.role === 'owner';
  useEffect(() => {
    if (prefilledConsult) setPanel('consult');
  }, [prefilledConsult]);
  async function signOut() {
    try { const result = await logout.run('/logout'); if (result) onSignedOut(); } catch { /* Do not falsely claim server logout. */ }
  }
  async function retryLoading() {
    setReloadError('');
    try { await Promise.all([data.refreshLibrary(), data.refreshList(), ...(data.selectedId ? [data.refresh()] : [])]); }
    catch (cause) { setReloadError(cause.message); }
  }
  // A successful write stays successful even if its follow-up read is interrupted.
  async function librarySaved() { try { await data.refreshLibrary(); if (data.selectedId) await data.refresh(); } catch (cause) { setReloadError(`Saved, but refreshing failed. ${cause.message}`); } }
  async function workspaceSaved() { try { await Promise.all([data.refresh(), data.refreshList()]); } catch (cause) { setReloadError(`Saved, but refreshing failed. ${cause.message}`); } }
  async function created(workspace) { data.select(workspace.id); try { await data.refreshList(); } catch (cause) { setReloadError(`Workspace created, but refreshing the list failed. ${cause.message}`); } }
  const workspace = data.workspace?.id === data.selectedId ? data.workspace : null;
  const titles = owner ? { today: 'Today', compare: 'Compare', progress: 'Progress', models: 'Models' } : { today: 'Today', compare: 'Compare', progress: 'Progress' };
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><div className="header-inner"><Brand /><nav className="primary-nav" aria-label="Main navigation">{Object.entries(titles).map(([key, label]) => <button key={key} type="button" aria-current={view === key ? 'page' : undefined} onClick={() => setView(key)}>{label}</button>)}</nav><div className="header-actions"><button className="utility-button" onClick={onPublic}>Stack check</button>{owner && <button className="utility-button" onClick={() => setPanel('consult')}>Consult intake</button>}{owner && <button className="utility-button" onClick={() => setPanel('library')}>Library</button>}{owner && workspace && <button className="utility-button" onClick={() => setPanel('setup')}><Icon name="settings" />Setup</button>}<button className="utility-button sign-out" onClick={signOut} disabled={logout.pending}>{logout.pending ? 'Signing out…' : 'Sign out'}</button></div></div></header>
    <main id="main" className="main-content"><div className="workspace-toolbar"><div className="workspace-select">{data.workspaces.length > 0 && <Select label="Workspace" value={data.selectedId} onChange={(event) => { data.select(event.target.value); setPanel(null); }}>{data.workspaces.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</Select>}{owner && <button className="text-button new-workspace" onClick={() => setPanel('create')}><Icon name="plus" />New workspace</button>}</div><span className="signed-in-email">{user.email}</span></div>
      <Notice>{logout.error}</Notice>{(data.error || reloadError) && <Notice>{data.error || reloadError}<button type="button" className="text-button" onClick={retryLoading}>Retry loading</button></Notice>}
      {workspace && <><div className="view-heading"><div><h1>{titles[view]}</h1>{workspace.goal && <p>{workspace.goal}</p>}</div>{data.loading && <span className="refresh-label" role="status">Refreshing…</span>}</div><div key={workspace.id} className="view-content">{view === 'today' && <Today workspace={workspace} library={data.library} owner={owner} onRefresh={data.refresh} onManage={() => setPanel('setup')} onOpenConsult={() => setPanel('consult')} />}{view === 'compare' && <Compare workspace={workspace} library={data.library} owner={owner} onRefresh={data.refresh} />}{view === 'progress' && <Progress workspace={workspace} />}{view === 'models' && <Models owner={owner} workspace={workspace} onRefresh={data.refresh} />}</div></>}
      {!workspace && data.loading && <Loading>Loading your workspace…</Loading>}
      {!workspace && !data.loading && !data.error && <Empty title={owner ? 'Create your first workspace' : 'No workspace assigned'} action={owner ? <div className="empty-actions"><button className="button primary" onClick={() => setPanel('create')}>Create workspace</button><button className="button secondary" onClick={() => setPanel('library')}>Open shared library</button></div> : undefined}>{owner ? 'Start with an empty private workspace, then assign a protocol from the shared library or a reviewed import.' : 'Sign in using your invitation, or ask your owner to assign a private workspace.'}</Empty>}
    </main><footer className="site-footer"><span>BioScience</span><span>Planned protocol · actual records · supported models</span></footer>
    {owner && panel === 'library' && <LibraryDrawer library={data.library} onSaved={librarySaved} onClose={() => setPanel(null)} />}
    {owner && panel === 'create' && <CreateWorkspace onCreated={created} onClose={() => setPanel(null)} />}
    {owner && panel === 'setup' && workspace && <WorkspaceDrawer workspace={workspace} library={data.library} onSaved={workspaceSaved} onClose={() => setPanel(null)} />}
    {owner && panel === 'consult' && <ConsultationDrawer workspace={workspace} prefilled={prefilledConsult} onSaved={workspaceSaved} onClose={() => { if (onClearPrefill) onClearPrefill(); setPanel(null); }} />}
  </div>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [initialWorkspace, setInitialWorkspace] = useState('');
  const [prefilledConsult, setPrefilledConsult] = useState(null);
  const [invite, setInvite] = useState(() => new URLSearchParams(window.location.search).get('invite'));
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get('view') === 'private' ? 'private' : 'public');
  function navigate(next) {
    const url = new URL(window.location.href);
    if (next === 'private') url.searchParams.set('view', 'private'); else url.searchParams.delete('view');
    url.hash = ''; window.history.pushState({}, '', url.pathname + url.search); setMode(next);
  }
  useEffect(() => {
    const controller = new AbortController(); setError('');
    request('/session', { signal: controller.signal }).then((result) => { if (!controller.signal.aborted) setSession(result); }).catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const expired = () => { resetSessionScope(); setSession((current) => ({ setup_required: false, ...current, user: null })); setInitialWorkspace(''); };
    window.addEventListener('companion:unauthorized', expired);
    return () => window.removeEventListener('companion:unauthorized', expired);
  }, []);
  useEffect(() => {
    const pop = () => { const params = new URLSearchParams(window.location.search); setMode(params.get('view') === 'private' ? 'private' : 'public'); setInvite(params.get('invite')); };
    window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop);
  }, []);
  function authenticated(result) {
    resetSessionScope();
    setInitialWorkspace(result.workspace_id || ''); setSession({ setup_required: false, user: result.user });
    const url = new URL(window.location.href); url.searchParams.delete('invite'); url.searchParams.set('view', 'private');
    setInvite(null); setMode('private'); window.history.replaceState({}, '', url.pathname + url.search);
  }
  function handlePrefillConsult(payload) {
    setPrefilledConsult(payload);
    navigate('private');
  }
  if (mode === 'public' && !invite) return <PublicStack onPrivate={() => navigate('private')} onPrefillConsult={handlePrefillConsult} signedIn={Boolean(session?.user)} />;
  if (!session) return <main className="initial-load"><Brand large />{error ? <><Notice>{error}</Notice><button className="button secondary" onClick={() => setAttempt((value) => value + 1)}>Retry connection</button></> : <Loading>Opening your companion…</Loading>}</main>;
  const cancelInvite = () => { setInvite(null); setMode('public'); window.history.replaceState({}, '', window.location.pathname); };
  if (!session.user || invite) return <Auth setupRequired={session.setup_required} invite={invite} initialEmail={session.user?.email || ''} onAuthenticated={authenticated} onCancelInvite={cancelInvite} onBack={() => navigate('public')} />;
  return <Companion key={`${session.user.id}:${initialWorkspace}`} user={session.user} initialWorkspace={initialWorkspace} prefilledConsult={prefilledConsult} onClearPrefill={() => setPrefilledConsult(null)} onPublic={() => navigate('public')} onSignedOut={() => { resetSessionScope(); setInitialWorkspace(''); setSession({ setup_required: false, user: null }); navigate('public'); }} />;
}
