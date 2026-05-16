// ChatRoomScreen — interactive chat room
function ChatRoomScreen({ chat, onBack }) {
  const T = window.KNOCK_THEME;
  const I = window.KnockIcons;
  const initialThread = window.MESSAGES[chat.id] || window.DEFAULT_THREAD(chat);

  const [messages, setMessages] = React.useState(initialThread);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const [menu, setMenu] = React.useState(null); // { x, y, message }
  // ── [추가] n8n Webhook 전송 상태 ───────────────────────────────────────
  const [webhookStatus, setWebhookStatus] = React.useState(null); // null | 'sending' | 'sent' | 'error'
  // ── [추가 끝] ─────────────────────────────────────────────────────────
  const scrollRef = React.useRef(null);

  const openMenu = (e, m) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, message: m });
  };
  const closeMenu = () => setMenu(null);

  // auto-scroll to bottom on mount + on new message
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, typing]);

  // ── [추가] n8n Webhook 전송 함수 ────────────────────────────
  // 기존 채팅 UI 로직과 완전히 분리된 독립 함수
  // 실패해도 채팅 전송은 정상 동작 (non-blocking 설계)
  const sendToKnoxWebhook = async (messageText, channelId) => {
    const cfg = window.KNOCK_CONFIG;
    if (!cfg) {
      console.warn('[Knox→n8n] KNOCK_CONFIG가 없어 전송을 건너뜁니다.');
      return { success: false };
    }

    const url = cfg.useTestWebhook ? cfg.webhookUrl.test : cfg.webhookUrl.production;
    const payload = {
      question:    messageText,
      sender_id:   cfg.sender.id,
      sender_name: cfg.sender.name,
      sender_dept: cfg.sender.dept,
      channel_id:  channelId || 'unknown',
    };

    try {
      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('[Knox→n8n] 응답 이상:', response.status, response.statusText);
        return { success: false, status: response.status };
      }

      const data = await response.json().catch(() => ({}));
      console.log('[Knox→n8n] 전송 완료:', data);
      return { success: true, data };
    } catch (error) {
      console.error('[Knox→n8n] 전송 실패:', error?.message || error);
      return { success: false, error: error?.message || String(error) };
    }
  };
  // ────────────────────────────────────────────────────────────

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages(prev => [...prev, { id: 'm' + Date.now(), from: 'me', text, time, read: 0 }]);
    setInput('');

    // ── [추가] n8n Webhook 비동기 전송 ─────────────────────────────────────
    setWebhookStatus('sending');
    const typingTimer = setTimeout(() => setTyping(true), 600);
    sendToKnoxWebhook(text, chat?.id)
      .then(result => {
        clearTimeout(typingTimer);
        setTyping(false);

        const replyText = result.success
          ? window.KnockN8nResponse?.extractKnoxReplyText(result.data)
          : null;

        if (replyText) {
          setMessages(prev => [...prev, createN8nReply(replyText)]);
          setWebhookStatus('answered');
        } else if (result.success) {
          setMessages(prev => [...prev, createN8nReply(
            'AI Agent 접수는 완료됐지만 즉시 답변 본문이 포함되지 않았습니다. 검수 콘솔에서 결과를 확인해 주세요.',
          )]);
          setWebhookStatus('sent');
        } else {
          setMessages(prev => [...prev, createN8nReply(
            'AI Agent 연결에 실패했습니다. 잠시 후 다시 시도하거나 검수 콘솔 상태를 확인해 주세요.',
          )]);
          setWebhookStatus('error');
        }

        setTimeout(() => setWebhookStatus(null), 3000);
      })
      .catch(() => {
        clearTimeout(typingTimer);
        setTyping(false);
        setMessages(prev => [...prev, createN8nReply(
          'AI Agent 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        )]);
        setWebhookStatus('error');
        setTimeout(() => setWebhookStatus(null), 3000);
      });
    // ── [추가 끝] ────────────────────────────────────────────────────────
  };

  const subtitle = chat.type === 'group'
    ? `${chat.members}명 · 보안 채팅`
    : chat.person?.dept || '보안 채팅';

  return (
    <div style={{
      flex: 1, background: T.bg, color: T.textPrimary,
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Pretendard", "Noto Sans KR", -apple-system, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px 10px', borderBottom: `1px solid ${T.divider}`,
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <I.Back />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 16, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{chat.title}</span>
            {chat.secure && <I.Shield s={13} c={T.secure} />}
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <I.Search />
          <I.Menu />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', padding: '14px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.map((m, i) => {
          if (m.kind === 'system') {
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 8px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(46,204,113,0.10)', border: `1px solid rgba(46,204,113,0.25)`,
                  color: T.secure, fontSize: 11, padding: '6px 10px', borderRadius: 12,
                }}>
                  <I.Shield s={11} c={T.secure} />
                  {m.text}
                </div>
              </div>
            );
          }

          const mine = m.from === 'me';
          const prev = messages[i - 1];
          const showAuthor = !mine && (!prev || prev.from === 'system' || prev.from?.id !== m.from?.id || (prev.from === 'me'));
          return (
            <Bubble key={m.id} m={m} mine={mine} showAuthor={showAuthor} onContextMenu={openMenu} />
          );
        })}
        {typing && <TypingDots chat={chat} />}
      </div>

      {/* Composer */}
      {/* ── [추가] Webhook 상태 인디케이터 ─────────────────────────────── */}
      <WebhookStatusBar status={webhookStatus} />
      {/* ── [추가 끝] ────────────────────────────────────────────────── */}
      <Composer value={input} onChange={setInput} onSend={send} />

      {/* Right-click context menu */}
      {menu && <MessageContextMenu menu={menu} onClose={closeMenu} chat={chat} />}
    </div>
  );
}

// ── [추가] Webhook 전송 상태 텍스트 ───────────────────────────────────────
function WebhookStatusBar({ status }) {
  const T = window.KNOCK_THEME;
  if (!status) return null;
  const map = {
    sending: { text: '⏳ AI Agent에 전달 중...', color: T.textSecondary },
    sent:    { text: '✅ AI Agent 접수 완료',    color: T.secure },
    answered:{ text: '✅ AI Agent 답변 수신',    color: T.secure },
    error:   { text: '⚠️ 전송 실패 (콘솔 확인)',  color: '#E74C3C' },
  };
  const s = map[status];
  return (
    <div style={{
      fontSize: 11,
      textAlign: 'right',
      padding: '2px 12px 4px',
      color: s.color,
      transition: 'opacity 0.2s',
      fontFamily: 'inherit',
      flexShrink: 0,
    }}>
      {s.text}
    </div>
  );
}
// ── [추가 끝] ────────────────────────────────────────────────────────────

function MessageContextMenu({ menu, onClose, chat }) {
  const T = window.KNOCK_THEME;
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ left: menu.x, top: menu.y, ready: false });

  // Clamp menu inside the device-screen so it never overflows the bezel.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const screen = el.closest('.device-screen');
    const screenRect = screen ? screen.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pad = 8;
    let left = menu.x;
    let top = menu.y;
    if (left + w > screenRect.right - pad) left = screenRect.right - w - pad;
    if (top + h > screenRect.bottom - pad) top = menu.y - h;
    if (left < screenRect.left + pad) left = screenRect.left + pad;
    if (top < screenRect.top + pad) top = screenRect.top + pad;
    setPos({ left, top, ready: true });
  }, [menu.x, menu.y]);

  // Dismiss on outside click / Escape / scroll.
  React.useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('contextmenu', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('contextmenu', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const addToWiki = () => {
    const m = menu.message;
    const author = m.from?.name || m.authorName || (m.from === 'me' ? '나' : '');
    const params = new URLSearchParams({
      chat: chat.title || '',
      author,
      time: m.time || '',
      text: m.text || '',
      id: m.id || '',
    });
    window.location.href = `https://knock-knox-console.vercel.app/wiki/add?${params.toString()}`;
  };

  return (
    <div
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed', left: pos.left, top: pos.top,
        zIndex: 50, minWidth: 188,
        background: T.surface,
        border: `1px solid ${T.divider}`,
        borderRadius: 12,
        boxShadow: '0 12px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)',
        padding: 4,
        opacity: pos.ready ? 1 : 0,
        transform: pos.ready ? 'scale(1)' : 'scale(0.96)',
        transformOrigin: 'top left',
        transition: 'opacity 0.12s ease-out, transform 0.12s ease-out',
        fontFamily: 'inherit',
      }}>
      <button
        onClick={addToWiki}
        onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceHi; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.textPrimary, fontSize: 13, fontWeight: 500,
          fontFamily: 'inherit', textAlign: 'left',
        }}>
        <WikiPlusGlyph c={T.secure} />
        <span>위키에 추가하기</span>
      </button>
    </div>
  );
}

// Inline glyph — keeps icon set untouched
function WikiPlusGlyph({ c = '#2ECC71', s = 16 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5 4h10l4 4v12H5V4z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M15 4v4h4" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M12 12v6M9 15h6" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function Bubble({ m, mine, showAuthor, onContextMenu }) {
  const T = window.KNOCK_THEME;
  const author = m.from?.name || m.authorName;
  const initial = m.from?.initial;
  const ctx = onContextMenu ? (e) => onContextMenu(e, m) : undefined;

  if (mine) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          {m.read > 0 && (
            <div style={{ fontSize: 10, color: T.textSecondary }}>읽음 {m.read}</div>
          )}
          <div style={{ fontSize: 10, color: T.textTertiary }}>{m.time}</div>
        </div>
        <div
          onContextMenu={ctx}
          style={{
            background: T.bubbleMe, color: T.textPrimary,
            padding: '9px 13px', borderRadius: '16px 16px 4px 16px',
            maxWidth: 240, fontSize: 14, lineHeight: 1.45,
            wordBreak: 'break-word',
          }}>{m.text}</div>
      </div>
    );
  }

  // other
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ width: 32, flexShrink: 0 }}>
        {showAuthor && m.from?.initial && (
          <PersonAvatar person={m.from} size={32} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 240 }}>
        {showAuthor && author && (
          <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 3, marginLeft: 4 }}>{author}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <div
            onContextMenu={ctx}
            style={{
              background: T.bubbleOther, color: T.textPrimary,
              padding: '9px 13px', borderRadius: '4px 16px 16px 16px',
              fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word',
            }}>{m.text}</div>
          <div style={{ fontSize: 10, color: T.textTertiary, paddingBottom: 2 }}>{m.time}</div>
        </div>
      </div>
    </div>
  );
}

function TypingDots({ chat }) {
  const T = window.KNOCK_THEME;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ width: 32 }} />
      <div style={{
        background: T.bubbleOther,
        padding: '11px 14px', borderRadius: '4px 16px 16px 16px',
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        <Dot delay={0} />
        <Dot delay={0.18} />
        <Dot delay={0.36} />
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%', background: '#7A8993',
      animation: `knock-dot 1.1s ${delay}s infinite ease-in-out`,
      display: 'inline-block',
    }} />
  );
}

function Composer({ value, onChange, onSend }) {
  const T = window.KNOCK_THEME;
  const I = window.KnockIcons;
  const hasText = value.trim().length > 0;

  return (
    <div style={{
      flexShrink: 0,
      borderTop: `1px solid ${T.divider}`, background: T.bg,
      padding: '10px 12px',
      display: 'flex', alignItems: 'flex-end', gap: 8,
    }}>
      <button style={iconBtnStyle(T)}>
        <I.Plus c={T.textSecondary} />
      </button>
      <div style={{
        flex: 1, background: T.surface, borderRadius: 20,
        display: 'flex', alignItems: 'center', padding: '4px 10px 4px 14px',
        minHeight: 40,
      }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSend(); }}
          placeholder="메시지 입력"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: T.textPrimary, fontSize: 14, padding: '8px 0',
            fontFamily: 'inherit',
          }}
        />
        <button style={{ ...iconBtnStyle(T), padding: 4 }}>
          <I.Smile c={T.textSecondary} />
        </button>
      </div>
      <button
        onClick={onSend}
        disabled={!hasText}
        style={{
          width: 40, height: 40, borderRadius: 20,
          background: hasText ? T.accent : T.surface,
          border: 'none', cursor: hasText ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.18s',
        }}>
        <I.Send c={hasText ? '#FFF' : T.textTertiary} s={20} />
      </button>
    </div>
  );
}

function iconBtnStyle(T) {
  return {
    width: 40, height: 40, borderRadius: 20,
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
}

function createN8nReply(text) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const from = {
    id: 'knox_ai_agent',
    name: 'Knox AI Agent',
    initial: 'K',
    dept: 'AI Agent',
  };

  return { id: 'm' + Date.now() + 'n8n', from, text, time };
}

// Generate a contextual auto-reply
function autoReply(chat, lastInput) {
  const replies = [
    '네 확인했습니다 👍',
    '좋아요, 진행해 주세요',
    '오 그렇군요! 감사해요',
    'ㅇㅋㅇㅋ',
    '저도 동의합니다',
    '잠시만요, 회의 끝나고 답변드릴게요',
    '캡쳐 남겨 주실 수 있나요?',
  ];
  const text = replies[Math.floor(Math.random() * replies.length)];
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let from;
  if (chat.type === 'dm') {
    from = chat.person;
  } else {
    const fallback = [
      window.PEOPLE.samsung, window.PEOPLE.boan,
      window.PEOPLE.moni, window.PEOPLE.ryu, window.PEOPLE.rookie,
    ].filter(Boolean);
    from = fallback[Math.floor(Math.random() * fallback.length)];
  }
  return { id: 'm' + Date.now() + 'r', from, text, time };
}

window.ChatRoomScreen = ChatRoomScreen;
