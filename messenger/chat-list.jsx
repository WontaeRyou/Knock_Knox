// ChatListScreen — main screen showing 대화 list
function ChatListScreen({ onOpenChat }) {
  const T = window.KNOCK_THEME;
  const I = window.KnockIcons;
  const [tab, setTab] = React.useState('all'); // all | unread | favorite

  const allChats = window.CHATS;
  const filtered = React.useMemo(() => {
    if (tab === 'unread') return allChats.filter(c => c.unread > 0);
    if (tab === 'favorite') return allChats.slice(0, 3);
    return allChats;
  }, [tab, allChats]);

  const feedChats = allChats.filter(c => c.feed).slice(0, 3);

  return (
    <div style={{
      flex: 1, background: T.bg, color: T.textPrimary,
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Pretendard", "Noto Sans KR", -apple-system, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px 10px', flexShrink: 0,
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>대화</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <I.Search />
          <I.AddPerson />
          <I.Bookmark />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 22, padding: '6px 20px 10px', borderBottom: `1px solid ${T.divider}`,
        flexShrink: 0,
      }}>
        <Tab label="전체" active={tab === 'all'} onClick={() => setTab('all')} />
        <Tab label="읽지 않음" active={tab === 'unread'} onClick={() => setTab('unread')} dot />
        <Tab label="즐겨찾기" active={tab === 'favorite'} onClick={() => setTab('favorite')} />
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflow: 'auto', overscrollBehavior: 'contain' }}>
        {/* MY 피드 */}
        <div style={{ padding: '14px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.textSecondary, letterSpacing: '0.04em' }}>MY 피드</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textSecondary }}>
            전체 보기 <I.ChevronRight s={14} c={T.textSecondary} />
          </div>
        </div>
        <div style={{ padding: '0 20px 4px', fontSize: 12, color: T.textTertiary }}>대화방</div>

        <div>
          {filtered.map(chat => (
            <ChatRow key={chat.id} chat={chat} onClick={() => onOpenChat(chat)} />
          ))}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {/* Bottom Nav */}
      <BottomNav active="chat" />
    </div>
  );
}

function Tab({ label, active, onClick, dot }) {
  const T = window.KNOCK_THEME;
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '8px 0', position: 'relative',
        fontSize: 14, fontWeight: active ? 600 : 500,
        color: active ? T.textPrimary : T.textSecondary,
        fontFamily: 'inherit',
      }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.badge, display: 'inline-block' }} />}
      </span>
      {active && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: -10, height: 2,
          background: T.textPrimary, borderRadius: 1,
        }} />
      )}
    </button>
  );
}

function ChatRow({ chat, onClick }) {
  const T = window.KNOCK_THEME;
  const I = window.KnockIcons;
  const isGroup = chat.type === 'group';

  return (
    <div
      onClick={onClick}
      onMouseDown={e => e.currentTarget.style.background = T.surfaceHi}
      onMouseUp={e => e.currentTarget.style.background = 'transparent'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px', cursor: 'pointer',
        transition: 'background 0.15s',
      }}>
      {/* Avatar */}
      <div style={{ flexShrink: 0, width: 44, height: 44, position: 'relative' }}>
        {isGroup ? (
          chat.secure ? <I.GroupAvatarSecure s={44} /> : <I.GroupAvatar s={44} />
        ) : (
          <PersonAvatar person={chat.person} />
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {chat.isAnnouncement && <I.Megaphone s={14} c={T.textSecondary} />}
          <span style={{
            fontSize: 15, fontWeight: 500, color: T.textPrimary,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: '0 1 auto', maxWidth: '100%',
          }}>{chat.title}</span>
        </div>
        <div style={{
          fontSize: 13, color: T.textSecondary, marginTop: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {chat.lastMessage}
        </div>
      </div>

      {/* Right column: time + unread */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        gap: 6, flexShrink: 0, minWidth: 44,
      }}>
        <div style={{ fontSize: 11, color: T.textTertiary }}>{chat.time}</div>
        {chat.unread > 0 ? (
          <div style={{
            background: T.badge, color: '#FFF',
            fontSize: 11, fontWeight: 600,
            minWidth: 18, height: 18, padding: '0 6px',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{chat.unread}</div>
        ) : <div style={{ height: 18 }} />}
      </div>
    </div>
  );
}

function PersonAvatar({ person, size = 44 }) {
  // Initials bubble — no real photos, original artwork
  const hueMap = { 한: '#5C6FE3', 서: '#3F8DDB', 오: '#D67E3F', 윤: '#7A55C9', 강: '#2E9D6E', 백: '#D04F8E', 임: '#C49B2A', 김: '#3F8DDB', 정: '#2E9D6E', 최: '#D67E3F', 박: '#7A55C9', 이: '#C49B2A' };
  // Per-person tint override so same-initial people don't collide
  const personHue = { boan: '#3F8DDB', samsung: '#5C6FE3', monimo: '#2E9D6E', rookie: '#D04F8E', data: '#D67E3F', giheok: '#7A55C9', gaebal: '#D04F8E', geum: '#C49B2A' };
  const bg = personHue[person.id] || hueMap[person.initial] || '#4F8AFE';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}, ${shade(bg, -20)})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FFF', fontWeight: 600, fontSize: size * 0.42,
      letterSpacing: '-0.01em',
    }}>{person.initial}</div>
  );
}

function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return '#' + ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
}

function BottomNav({ active, onChange }) {
  const T = window.KNOCK_THEME;
  const I = window.KnockIcons;
  const items = [
    { id: 'contacts', label: '연락처', Icon: I.Contacts },
    { id: 'chat',     label: '대화',   Icon: I.Chat, badge: 11 },
    { id: 'more',     label: '더보기', Icon: I.Grid },
  ];
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      borderTop: `1px solid ${T.divider}`, background: T.bg,
      padding: '8px 0 6px',
    }}>
      {items.map(it => {
        const isActive = active === it.id;
        const c = isActive ? T.textPrimary : T.textTertiary;
        return (
          <div key={it.id}
            onClick={() => onChange && onChange(it.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              cursor: 'pointer', padding: '4px 22px', position: 'relative',
            }}>
            <div style={{ position: 'relative' }}>
              <it.Icon c={c} active={isActive} />
              {it.badge && (
                <div style={{
                  position: 'absolute', top: -4, right: -8,
                  background: T.badge, color: '#FFF',
                  fontSize: 10, fontWeight: 600, minWidth: 16, height: 16,
                  padding: '0 4px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{it.badge}</div>
              )}
            </div>
            <div style={{ fontSize: 11, color: c, fontWeight: isActive ? 600 : 400 }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { ChatListScreen, BottomNav, PersonAvatar });
