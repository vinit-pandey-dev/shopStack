import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Loader2, Send, Sparkles, X } from 'lucide-react';
import { Api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const WELCOME = {
  role: 'assistant',
  content: "Hi! I'm the ShopStack assistant. Ask me about our products, shipping, payments or your orders.",
};

const SUGGESTIONS = [
  'Which headphones do you have?',
  'Can I pay cash on delivery?',
  'How long does shipping take?',
];

function Sources({ sources, onNavigate }) {
  const seen = new Set();
  const unique = (sources || []).filter((s) => {
    const key = `${s.type}:${s.productId ?? s.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (unique.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {unique.map((s) =>
        s.type === 'PRODUCT' ? (
          <Link key={`p${s.productId}`} to={`/products/${s.productId}`} onClick={onNavigate}
            className="rounded-full border border-pine/30 bg-pine/5 px-2.5 py-1 text-[11px] font-medium text-pine transition hover:bg-pine hover:text-white">
            {s.title} →
          </Link>
        ) : (
          <span key={`d${s.title}`}
            className="inline-flex items-center gap-1 rounded-full bg-paper-dim px-2.5 py-1 text-[11px] text-ink-soft">
            <FileText size={11} /> {s.title}
          </span>
        )
      )}
    </div>
  );
}

export default function ChatWidget() {
  const { isLoggedIn } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy, open]);

  // start fresh after logging out
  useEffect(() => {
    if (!isLoggedIn) setMessages([WELCOME]);
  }, [isLoggedIn]);

  if (pathname === '/login' || pathname === '/register') return null;

  const send = async (text) => {
    const question = text.trim();
    if (!question || busy) return;

    const history = messages
      .filter((m) => m !== WELCOME && !m.error)
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setBusy(true);
    try {
      const res = await Api.chat(question, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.answer, sources: res.sources }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: e.message, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const onlyWelcome = messages.length === 1;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 left-3 right-3 z-40 flex h-[min(34rem,calc(100vh-8rem))] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl sm:left-auto sm:right-6 sm:w-[390px]">
          <header className="flex items-center justify-between bg-pine px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-brass-light"><Sparkles size={16} /></span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">ShopStack Assistant</p>
                <p className="text-[11px] text-white/70">Answers from our catalog &amp; policies</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-white/80 transition hover:bg-white/10" aria-label="Close chat">
              <X size={18} />
            </button>
          </header>

          {!isLoggedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <Sparkles size={32} className="text-brass" />
              <div>
                <p className="font-semibold">Log in to chat</p>
                <p className="mt-1 text-sm text-ink-soft">Sign in to ask the assistant about products, shipping and your orders.</p>
              </div>
              <Link to="/login" state={{ from: pathname }} onClick={() => setOpen(false)} className="btn-brass">Log in</Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-pine text-white'
                        : m.error
                          ? 'rounded-bl-md border border-danger/30 bg-red-50 text-danger'
                          : 'rounded-bl-md border border-line bg-white text-ink'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.role === 'assistant' && <Sources sources={m.sources} onNavigate={() => setOpen(false)} />}
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink-soft">
                      <Loader2 size={14} className="animate-spin" /> Thinking…
                    </div>
                  </div>
                )}

                {onlyWelcome && !busy && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)}
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink-soft transition hover:border-pine hover:text-pine">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line bg-white p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="Ask about products, shipping, orders…"
                  className="input !py-2.5"
                  aria-label="Your question"
                />
                <button type="submit" disabled={busy || !input.trim()} className="btn-brass !px-3.5 !py-2.5" aria-label="Send">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-pine px-5 py-3.5 text-sm font-medium text-white shadow-card transition hover:bg-pine-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 sm:right-6"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X size={18} /> : <Sparkles size={18} className="text-brass-light" />}
        {open ? 'Close' : 'Ask AI'}
      </button>
    </>
  );
}
