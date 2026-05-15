// Icon set — minimal stroke icons for Knock prototype
const KnockIcons = {
  Search: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Bell: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 17h14l-1.5-2V11a5.5 5.5 0 1 0-11 0v4L5 17z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M10 20a2 2 0 0 0 4 0" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  AddPerson: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="8" r="3.5" stroke={c} strokeWidth="1.7"/>
      <path d="M3.5 19c.8-3 3.5-4.5 6.5-4.5s5.7 1.5 6.5 4.5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M19 4v6M16 7h6" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  Bookmark: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v17l-6-4-6 4V4z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  ),
  Back: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M14.5 5l-7 7 7 7" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  More: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.6" fill={c}/>
      <circle cx="12" cy="12" r="1.6" fill={c}/>
      <circle cx="19" cy="12" r="1.6" fill={c}/>
    </svg>
  ),
  Menu: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  GroupAvatar: ({ s = 44 }) => (
    <svg width={s} height={s} viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="22" fill="#2A3B5C"/>
      <g fill="#7FA9F4">
        <circle cx="16" cy="19" r="4.5"/>
        <circle cx="28" cy="19" r="4.5"/>
        <path d="M9 32c.8-3.2 3.6-5 7-5s5.4 1.5 6.5 3.7C23.6 28.5 26.5 27 30 27s5.7 1.6 6.6 4.5c.2.5-.2 1-.7 1H9.7c-.5 0-.9-.5-.7-1z"/>
      </g>
    </svg>
  ),
  GroupAvatarSecure: ({ s = 44 }) => (
    <svg width={s} height={s} viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="22" fill="#2A3B5C"/>
      <g fill="#7FA9F4">
        <circle cx="16" cy="19" r="4.5"/>
        <circle cx="28" cy="19" r="4.5"/>
        <path d="M9 32c.8-3.2 3.6-5 7-5s5.4 1.5 6.5 3.7C23.6 28.5 26.5 27 30 27s5.7 1.6 6.6 4.5c.2.5-.2 1-.7 1H9.7c-.5 0-.9-.5-.7-1z"/>
      </g>
      <g transform="translate(28 26)">
        <circle r="9" fill="#121418"/>
        <path d="M0 -5.5l-4.5 2v3c0 3 2 5 4.5 6 2.5-1 4.5-3 4.5-6v-3L0 -5.5z" fill="#2ECC71"/>
        <path d="M-1.8 0.2L-0.6 1.5 1.9 -1.2" stroke="#121418" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  ),
  Megaphone: ({ s = 18, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 10v4h3l8 4V6L6 10H3z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M17 9c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  ChevronRight: ({ s = 16, c = '#89BEC6' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 5l7 7-7 7" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Contacts: ({ s = 26, c, active }) => (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
      <rect x="5" y="4" width="18" height="20" rx="3" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity={active ? 0.12 : 1}/>
      <circle cx="14" cy="12" r="3" stroke={c} strokeWidth="1.8"/>
      <path d="M9 20c1-2.2 2.8-3.2 5-3.2s4 1 5 3.2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Chat: ({ s = 26, c, active }) => (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
      <path d="M4 7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-7l-5 4v-4H7a3 3 0 0 1-3-3V7z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill={active ? c : 'none'} fillOpacity={active ? 0.18 : 1}/>
    </svg>
  ),
  Grid: ({ s = 26, c, active }) => (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
      <rect x="5" y="5" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity={active ? 0.15 : 1}/>
      <rect x="16" y="5" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity={active ? 0.15 : 1}/>
      <rect x="5" y="16" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity={active ? 0.15 : 1}/>
      <rect x="16" y="16" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity={active ? 0.15 : 1}/>
    </svg>
  ),
  Plus: ({ s = 22, c = '#89BEC6' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="1.9" strokeLinecap="round"/>
    </svg>
  ),
  Send: ({ s = 22, c = '#FFF' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 12l16-8-5 16-3-7-8-1z" fill={c}/>
    </svg>
  ),
  Smile: ({ s = 22, c = '#89BEC6' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth="1.7"/>
      <circle cx="9" cy="10.5" r="1" fill={c}/>
      <circle cx="15" cy="10.5" r="1" fill={c}/>
      <path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Hash: ({ s = 22, c = '#89BEC6' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 4l-1 16M16 4l-1 16M4 9h16M3 15h16" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  Shield: ({ s = 14, c = '#2ECC71' }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L2 4v4.5C2 11.8 4.5 13.7 8 14.5c3.5-.8 6-2.7 6-6V4L8 1.5z" fill={c}/>
      <path d="M5.5 8l1.7 1.8L10.7 6" stroke="#121418" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
};

window.KnockIcons = KnockIcons;
