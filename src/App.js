import { useState, useEffect } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://dvplrskqcctragvxzezy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cGxyc2txY2N0cmFndnh6ZXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODcwMjksImV4cCI6MjA5ODE2MzAyOX0.DhndlUcUV_-1C0aH2y5M2BbUMZICWbgJDvScvJSU9Bg";
const HEADERS = { "Content-Type":"application/json", "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}` };
const ADMIN_USER = "Krisssan";
const ADMIN_PASS = "Buatsandi123?";

const DEFAULT_SETTINGS = { wa:"6281233422670", name:"Admin CIBIN", email:"cibin@email.com", photo:"", instagram:"", tiktok:"" };
let _settings = { ...DEFAULT_SETTINGS };
const getSettings = () => _settings;
const saveSettings = (s) => { _settings = { ...s }; };

const TYPES = [
  { key:"kosan",     label:"Kosan",      emoji:"🏠" },
  { key:"kontrakan", label:"Kontrakan",  emoji:"🏘️" },
  { key:"rumah",     label:"Rumah Sewa", emoji:"🏡" },
  { key:"ruko",      label:"Ruko",       emoji:"🏪" },
];

const SERVICES = ["Pengingat pembayaran penyewa","Rekap pembayaran bulanan","Mengelola pertanyaan dan komplain penyewa","Mempromosikan properti kosong melalui CIBIN"];

const formatRp   = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const typeInfo   = (key) => TYPES.find(t => t.key === key) || { label:key, emoji:"🏠" };
const typeBadge  = (type) => ({ kosan:"bg-green-600 text-white", kontrakan:"bg-emerald-700 text-white", rumah:"bg-blue-600 text-white", ruko:"bg-orange-500 text-white" }[type] || "bg-gray-600 text-white");

// ─── UPLOAD FOTO ─────────────────────────────────────────────────────────────
const uploadPhoto = async (file) => {
  try {
    const ext  = file.name.split(".").pop();
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${name}`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type },
      body: file,
    });
    if (!r.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/photos/${name}`;
  } catch { return null; }
};
const db = {
  async getListings() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?order=premium.desc,created_at.desc`, { headers: HEADERS });
      return r.ok ? r.json() : [];
    } catch { return []; }
  },
  async getUsers() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?order=joined.desc`, { headers: HEADERS });
      return r.ok ? r.json() : [];
    } catch { return []; }
  },
  async insertListing(data) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/listings`, { method:"POST", headers:{...HEADERS,"Prefer":"return=representation"}, body:JSON.stringify(data) });
      return r.ok;
    } catch { return false; }
  },
  async updateListing(id, data) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`, { method:"PATCH", headers:{...HEADERS,"Prefer":"return=representation"}, body:JSON.stringify(data) });
      return r.ok;
    } catch { return false; }
  },
  async deleteListing(id, photoUrl) {
    try {
      // Hapus foto dari storage kalau ada
      if (photoUrl && photoUrl.includes("supabase")) {
        const path = photoUrl.split("/photos/")[1];
        if (path) await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, { method:"DELETE", headers: HEADERS });
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`, { method:"DELETE", headers: HEADERS });
      return r.ok;
    } catch { return false; }
  },
  async deleteExpiredListings() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?premium=eq.false&created_at=lt.${oneWeekAgo}&select=id,photo`, { headers: HEADERS });
      if (!r.ok) return 0;
      const expired = await r.json();
      for (const item of expired) {
        if (item.photo && item.photo.includes("supabase")) {
          const path = item.photo.split("/photos/")[1];
          if (path) await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, { method:"DELETE", headers: HEADERS });
        }
        await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${item.id}`, { method:"DELETE", headers: HEADERS });
      }
      return expired.length;
    } catch { return 0; }
  },
  async updateUser(id, data) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, { method:"PATCH", headers:{...HEADERS,"Prefer":"return=representation"}, body:JSON.stringify(data) });
      return r.ok;
    } catch { return false; }
  },
  async deleteUser(id) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, { method:"DELETE", headers: HEADERS });
      return r.ok;
    } catch { return false; }
  },
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
const CibinLogo = ({ size=36 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M50 5C25.1 5 5 25.1 5 50C5 74.9 25.1 95 50 95C62.5 95 73.8 89.9 81.9 81.6L70.5 70.2C65.1 75.8 57.5 79.2 50 79.2C33.9 79.2 20.8 66.1 20.8 50C20.8 33.9 33.9 20.8 50 20.8C57.5 20.8 65.1 24.2 70.5 29.8L81.9 18.4C73.8 10.1 62.5 5 50 5Z" fill="#3DC044"/>
    <ellipse cx="55" cy="50" rx="22" ry="17" fill="white"/>
    <polygon points="38,58 32,68 48,60" fill="white"/>
    <circle cx="47" cy="50" r="3.2" fill="#3DC044"/>
    <circle cx="55" cy="50" r="3.2" fill="#3DC044"/>
    <circle cx="63" cy="50" r="3.2" fill="#3DC044"/>
  </svg>
);

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconWA     = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.851L.057 23.7a.5.5 0 0 0 .613.613l5.849-1.475A11.949 11.949 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.52-5.16-1.426l-.37-.22-3.47.875.891-3.41-.24-.385A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>;
const IconLoc    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconStar   = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconMenu   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconX      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>;
const IconRight  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const IconShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconTrash  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconBan    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IconRefresh= () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Loading = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"/>
    <p className="text-gray-400 text-sm">Memuat data...</p>
  </div>
);

function PromoBanner({ wa }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4">
        <div className="text-center sm:text-left">
          <p className="font-black text-gray-800 text-base">⭐ Tampil paling atas + 5 foto + tidak expired!</p>
          <p className="text-gray-500 text-sm mt-0.5">
            <span className="font-bold text-yellow-700">Rp 50.000/minggu</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="font-bold text-yellow-700">Rp 150.000/bulan</span>
            <span className="ml-2 text-green-600 font-semibold text-xs">(hemat 25%)</span>
          </p>
        </div>
        <a href={`https://wa.me/${wa}?text=Halo, saya ingin upgrade listing ke UNGGULAN di CIBIN`}
          target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow whitespace-nowrap">
          <IconWA/> Upgrade Sekarang
        </a>
      </div>
    </div>
  );
}

function ListingCard({ item, onDetail, wa }) {
  const { label, emoji } = typeInfo(item.type);
  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col relative ${item.premium?"border-yellow-400 ring-1 ring-yellow-300":"border-gray-100"}`}>
      {item.premium  && <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full shadow"><IconStar/> UNGGULAN</div>}
      {item.verified && <div className={`absolute ${item.premium?"top-10":"top-3"} right-3 z-10 bg-blue-500 text-white text-xs font-black px-2 py-1 rounded-full shadow`}>✓ VERIFIED</div>}
      <div className="relative overflow-hidden h-48">
        <img src={item.photo||"https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80"} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge(item.type)}`}>{emoji} {label}</span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1">{item.name}</h3>
        <p className="text-green-700 font-bold text-lg mb-2">{formatRp(item.price)}/bulan</p>
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3"><IconLoc/><span>{item.location}</span></div>
        <div className="mt-auto flex gap-2 pt-3 border-t border-gray-50">
          <button onClick={() => onDetail(item)} className="flex-1 py-2 px-3 border border-green-600 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors">Lihat Detail</button>
          <a href={`https://wa.me/${item.wa}?text=Halo, saya tertarik dengan ${item.name}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
            <IconWA/> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ page, setPage }) {
  const [open, setOpen] = useState(false);
  const nav = [{ label:"Beranda", key:"home" }, { label:"Cari Properti", key:"listing" }, { label:"Pasang Iklan", key:"form" }];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => setPage("home")} className="flex items-center gap-2"><CibinLogo size={36}/><span className="font-black text-xl text-green-700 tracking-tight">CIBIN</span></button>
        <div className="hidden md:flex items-center gap-6">
          {nav.map(n => <button key={n.key} onClick={() => setPage(n.key)} className={`text-sm font-medium transition-colors ${page===n.key?"text-green-700 font-semibold":"text-gray-600 hover:text-green-700"}`}>{n.label}</button>)}
          <button onClick={() => setPage("admin-login")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"><IconShield/> Admin</button>
          <button onClick={() => setPage("form")} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700">Pasang Gratis</button>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-gray-600 p-1">{open?<IconX/>:<IconMenu/>}</button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
          {nav.map(n => <button key={n.key} onClick={() => { setPage(n.key); setOpen(false); }} className={`text-left py-2.5 px-3 rounded-lg text-sm font-medium ${page===n.key?"bg-green-50 text-green-700":"text-gray-700"}`}>{n.label}</button>)}
          <button onClick={() => { setPage("admin-login"); setOpen(false); }} className="text-left py-2.5 px-3 rounded-lg text-sm font-medium text-gray-500">🔐 Admin</button>
        </div>
      )}
    </nav>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 pt-16">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6"><CibinLogo size={48}/><h1 className="text-xl font-black text-gray-800 mt-3">Admin Panel</h1><p className="text-gray-400 text-sm">Masuk untuk mengelola CIBIN</p></div>
        <div className="space-y-4">
          <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Username</label><input value={u} onChange={e=>setU(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"/></div>
          <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label><input type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(u===ADMIN_USER&&p===ADMIN_PASS?onLogin():setErr("Username atau password salah!"))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"/></div>
          {err && <p className="text-red-500 text-sm text-center">{err}</p>}
          <button onClick={() => u===ADMIN_USER&&p===ADMIN_PASS?onLogin():setErr("Username atau password salah!")} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">Masuk</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [tab, setTab]             = useState("listing");
  const [listings, setListings]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [confirm, setConfirm]     = useState(null);
  const [toast, setToast]         = useState("");
  const [settingsForm, setSettingsForm] = useState(getSettings());
  const [savingSet, setSavingSet] = useState(false);

  const [cleaning, setCleaning] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = async () => {
    setLoading(true);
    const [l, u] = await Promise.all([db.getListings(), db.getUsers()]);
    setListings(l||[]); setUsers(u||[]); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Auto bersihkan listing expired saat admin login
  useEffect(() => {
    db.deleteExpiredListings().then(n => { if (n > 0) showToast(`🗑️ ${n} listing gratis expired otomatis dihapus`); });
  }, []);

  const cleanExpired = async () => {
    setCleaning(true);
    const n = await db.deleteExpiredListings();
    await load();
    setCleaning(false);
    showToast(n > 0 ? `🗑️ ${n} listing expired dihapus!` : "✅ Tidak ada listing yang expired");
  };

  const pending = listings.filter(l => !l.verified && !l.blocked);

  const doListing = async (id, action) => {
    if (action==="delete") { await db.deleteListing(id, listings.find(x=>x.id===id)?.photo); setListings(p=>p.filter(l=>l.id!==id)); showToast("Dihapus 🗑️"); setConfirm(null); return; }
    const l = listings.find(x=>x.id===id);
    const data = action==="verify"?{verified:true}:action==="block"?{blocked:true}:action==="unblock"?{blocked:false}:{premium:!l.premium};
    await db.updateListing(id, data);
    setListings(p=>p.map(l=>l.id===id?{...l,...data}:l));
    showToast(action==="verify"?"✅ Verified":action==="block"?"🚫 Diblokir":action==="unblock"?"✅ Buka blokir":"⭐ Status unggulan diubah");
    setConfirm(null);
  };

  const doUser = async (id, action) => {
    if (action==="delete") { await db.deleteUser(id); setUsers(p=>p.filter(u=>u.id!==id)); showToast("User dihapus 🗑️"); setConfirm(null); return; }
    const data = { blocked: action==="block" };
    await db.updateUser(id, data);
    setUsers(p=>p.map(u=>u.id===id?{...u,...data}:u));
    showToast(action==="block"?"🚫 User diblokir":"✅ Blokir dibuka");
    setConfirm(null);
  };

  const stats = [
    { label:"Total Listing", val:listings.length,                       color:"bg-green-100 text-green-700" },
    { label:"Pending",        val:pending.length,                        color:"bg-yellow-100 text-yellow-700" },
    { label:"Unggulan",       val:listings.filter(l=>l.premium).length, color:"bg-purple-100 text-purple-700" },
    { label:"User Diblokir",  val:users.filter(u=>u.blocked).length,    color:"bg-red-100 text-red-700" },
  ];

  const tabs = [
    { key:"listing",  label:"Listing",     count:listings.length },
    { key:"pending",  label:"Pending",     count:pending.length },
    { key:"users",    label:"User",        count:users.length },
    { key:"settings", label:"⚙️ Setting",  count:null },
  ];

  const flisting = listings.filter(l=>l.name?.toLowerCase().includes(search.toLowerCase())||l.location?.toLowerCase().includes(search.toLowerCase()));
  const fusers   = users.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-pulse">{toast}</div>}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-3xl mb-3 text-center">{confirm.action==="delete"?"🗑️":confirm.action==="block"?"🚫":"✅"}</div>
            <h3 className="font-black text-gray-800 text-center mb-2">{confirm.action==="delete"?"Hapus?":confirm.action==="block"?"Blokir?":confirm.action==="unblock"?"Buka Blokir?":confirm.action==="verify"?"Verifikasi?":"Ubah Unggulan?"}</h3>
            <p className="text-gray-500 text-sm text-center mb-5">Tindakan ini langsung diterapkan ke database.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Batal</button>
              <button onClick={()=>confirm.type==="listing"?doListing(confirm.id,confirm.action):doUser(confirm.id,confirm.action)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white ${confirm.action==="delete"?"bg-red-500":confirm.action==="block"?"bg-orange-500":"bg-green-600"}`}>Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-black text-gray-800">Admin Panel</h1><p className="text-gray-500 text-sm">CIBIN · Supabase connected</p></div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={cleanExpired} disabled={cleaning}
              className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50">
              {cleaning?<div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"/>:"🗑️"} Bersihkan Expired
            </button>
            <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50"><IconRefresh/> Refresh</button>
            <button onClick={onLogout} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50">Keluar</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map(s=><div key={s.label} className={`${s.color} rounded-2xl p-4`}><div className="text-2xl font-black">{s.val}</div><div className="text-xs font-semibold mt-1 opacity-80">{s.label}</div></div>)}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map(t=>(
            <button key={t.key} type="button" onClick={()=>{setTab(t.key);setSearch("");}}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${tab===t.key?"bg-green-600 text-white shadow":"bg-white text-gray-600 border border-gray-200 hover:bg-green-50"}`}>
              {t.label}
              {t.count!==null&&<span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab===t.key?"bg-white/30 text-white":"bg-gray-100 text-gray-500"}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {tab!=="settings" && (
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-gray-200 mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400" placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        )}

        {loading && tab!=="settings" ? <Loading/> : (
          <>
            {/* LISTING TAB */}
            {(tab==="listing"||tab==="pending") && (
              <div className="space-y-3">
                {(tab==="pending"?pending:flisting).length===0&&<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📭</div><p>Tidak ada listing</p></div>}
                {(tab==="pending"?pending:flisting).map(item=>{
                  const {label,emoji}=typeInfo(item.type);
                  return (
                    <div key={item.id} className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row gap-4 ${item.blocked?"border-red-200 bg-red-50":item.verified?"border-blue-100":"border-yellow-200 bg-yellow-50"}`}>
                      <img src={item.photo||"https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200&q=60"} alt={item.name} className="w-full sm:w-28 h-24 sm:h-20 object-cover rounded-xl flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge(item.type)}`}>{emoji} {label}</span>
                          {item.premium&&<span className="text-xs font-black bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full flex items-center gap-1"><IconStar/> Unggulan</span>}
                          {item.verified&&<span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Verified</span>}
                          {item.blocked&&<span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🚫 Diblokir</span>}
                          {!item.verified&&!item.blocked&&<span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ Pending</span>}
                        </div>
                        <p className="font-bold text-gray-800 truncate">{item.name}</p>
                        <p className="text-green-700 font-semibold text-sm">{formatRp(item.price)}/bulan</p>
                        <p className="text-gray-400 text-xs mt-0.5">{item.location} · {item.address}</p>
                        {!item.premium && item.created_at && (() => {
                          const daysLeft = 7 - Math.floor((Date.now() - new Date(item.created_at)) / 86400000);
                          return daysLeft <= 3
                            ? <p className={`text-xs font-semibold mt-1 ${daysLeft <= 1?"text-red-500":"text-orange-500"}`}>
                                ⏰ {daysLeft <= 0 ? "Expired! Akan segera dihapus" : `Sisa ${daysLeft} hari (gratis)`}
                              </p>
                            : <p className="text-gray-400 text-xs mt-1">⏳ Sisa {daysLeft} hari (gratis)</p>;
                        })()}
                      </div>
                      <div className="flex sm:flex-col gap-2 flex-wrap">
                        {!item.verified&&!item.blocked&&<button onClick={()=>setConfirm({type:"listing",id:item.id,action:"verify"})} className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600"><IconCheck/> Verifikasi</button>}
                        <button onClick={()=>setConfirm({type:"listing",id:item.id,action:"premium"})} className="flex items-center gap-1.5 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-500"><IconStar/> {item.premium?"Hapus Unggulan":"Unggulan"}</button>
                        {item.blocked
                          ?<button onClick={()=>setConfirm({type:"listing",id:item.id,action:"unblock"})} className="flex items-center gap-1.5 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold"><IconCheck/> Buka Blokir</button>
                          :<button onClick={()=>setConfirm({type:"listing",id:item.id,action:"block"})} className="flex items-center gap-1.5 bg-orange-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-500"><IconBan/> Blokir</button>}
                        <button onClick={()=>setConfirm({type:"listing",id:item.id,action:"delete"})} className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600"><IconTrash/> Hapus</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* USER TAB */}
            {tab==="users" && (
              <div className="space-y-3">
                {fusers.length===0&&<div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">👤</div><p>Tidak ada user</p></div>}
                {fusers.map(u=>(
                  <div key={u.id} className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${u.blocked?"border-red-200 bg-red-50":"border-gray-100"}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${u.blocked?"bg-red-100":"bg-green-100"}`}>{u.blocked?"🚫":"👤"}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-gray-800">{u.name}</p>{u.blocked&&<span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Diblokir</span>}</div>
                      <p className="text-gray-500 text-sm">WA: {u.wa}</p>
                      <p className="text-gray-400 text-xs">{u.listings} listing · {u.joined}</p>
                    </div>
                    <div className="flex gap-2">
                      {u.blocked
                        ?<button onClick={()=>setConfirm({type:"user",id:u.id,action:"unblock"})} className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><IconCheck/> Buka Blokir</button>
                        :<button onClick={()=>setConfirm({type:"user",id:u.id,action:"block"})} className="flex items-center gap-1.5 bg-orange-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><IconBan/> Blokir</button>}
                      <button onClick={()=>setConfirm({type:"user",id:u.id,action:"delete"})} className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><IconTrash/> Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS TAB */}
            {tab==="settings" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 max-w-lg">
                <h2 className="font-black text-gray-800 text-lg">⚙️ Pengaturan Kontak</h2>
                <div className="flex items-center gap-4 bg-green-50 border border-green-100 rounded-2xl p-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-green-200 flex items-center justify-center flex-shrink-0">
                    {settingsForm.photo?<img src={settingsForm.photo} alt="foto" className="w-full h-full object-cover"/>:<span className="text-2xl">👤</span>}
                  </div>
                  <div>
                    <p className="font-black text-gray-800">{settingsForm.name||"Nama Admin"}</p>
                    <p className="text-green-700 text-sm font-semibold">+{settingsForm.wa}</p>
                    <p className="text-gray-400 text-xs">{settingsForm.email}</p>
                  </div>
                </div>
                {[
                  {key:"name",      label:"Nama Tampilan",       ph:"Admin CIBIN"},
                  {key:"wa",        label:"Nomor WhatsApp",      ph:"6289673419645"},
                  {key:"email",     label:"Email",               ph:"cibin@email.com"},
                  {key:"photo",     label:"Link Foto (URL)",     ph:"https://..."},
                  {key:"instagram", label:"Instagram (opsional)",ph:"@cibin.id"},
                  {key:"tiktok",    label:"TikTok (opsional)",   ph:"@cibin.id"},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input value={settingsForm[f.key]} placeholder={f.ph} onChange={e=>setSettingsForm({...settingsForm,[f.key]:e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"/>
                  </div>
                ))}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm">⚠️ Pastikan nomor WA benar! Semua tombol hubungi di website pakai nomor ini.</div>
                <button onClick={()=>{setSavingSet(true);saveSettings(settingsForm);setTimeout(()=>{setSavingSet(false);showToast("✅ Pengaturan disimpan!");},600);}} disabled={savingSet}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingSet?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Menyimpan...</>:"💾 Simpan Pengaturan"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ setPage, setFilter, setTypeFilter, setDetail }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const wa = getSettings().wa;

  useEffect(() => {
    db.getListings().then(data => {
      setListings((data||[]).filter(l=>l.verified&&!l.blocked));
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 overflow-hidden pt-16">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none"/>
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">🏡 Portal Properti Cikande & Kibin</span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-5">Cari Properti Sewa<br/><span className="text-green-300">di Cikande – Kibin</span></h1>
          <p className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">Kosan, Kontrakan, Rumah Sewa, hingga Ruko — semua ada di CIBIN. Pasang listing <strong className="text-white">gratis</strong>.</p>
          <div className="max-w-xl mx-auto mb-8">
            <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-xl">
              <div className="flex items-center gap-2 flex-1 px-3 text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input className="flex-1 text-gray-700 text-sm outline-none placeholder:text-gray-400 bg-transparent" placeholder="Cari kosan, ruko, rumah sewa..." onKeyDown={e=>e.key==="Enter"&&setPage("listing")}/>
              </div>
              <button onClick={()=>setPage("listing")} className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">Cari</button>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {TYPES.map(f=><button key={f.key} onClick={()=>{setTypeFilter(f.key);setFilter("Semua");setPage("listing");}} className="bg-white/15 text-white border border-white/30 font-semibold px-5 py-2.5 rounded-xl hover:bg-white/25 transition-all text-sm">{f.emoji} {f.label}</button>)}
            <button onClick={()=>setPage("form")} className="bg-emerald-400 text-emerald-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-300 shadow-lg text-sm">✨ Pasang Gratis</button>
          </div>
          {/* Stats real time */}
          <div className="flex justify-center gap-8 md:gap-16">
            {[{val:loading?"...":listings.length, label:"Listing Aktif"},{val:"2",label:"Wilayah"},{val:"Gratis",label:"Pasang Iklan"}].map(s=>(
              <div key={s.label} className="text-center"><div className="text-3xl font-black text-white">{s.val}</div><div className="text-green-300 text-xs font-medium mt-1">{s.label}</div></div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0"><svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none"><path d="M0 60V30C240 0 480 60 720 30C960 0 1200 60 1440 30V60H0Z" fill="white"/></svg></div>
      </section>

      {/* LISTING */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-green-600 text-sm font-semibold uppercase tracking-wider mb-1">Pilihan Terbaru</p><h2 className="text-2xl md:text-3xl font-black text-gray-800">Listing Unggulan & Terbaru</h2></div>
          <button onClick={()=>setPage("listing")} className="flex items-center gap-2 text-green-700 font-semibold text-sm hover:gap-3 transition-all">Lihat Semua <IconRight/></button>
        </div>
        <PromoBanner wa={wa}/>
        {loading ? <Loading/> : listings.length===0
          ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">🏚️</div><p className="font-semibold text-gray-600">Belum ada listing tersedia</p><p className="text-sm mt-1">Jadilah yang pertama pasang listing!</p></div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{listings.slice(0,6).map(item=><ListingCard key={item.id} item={item} onDetail={i=>{setDetail(i);setPage("detail");}} wa={wa}/>)}</div>}
      </section>

      {/* LAYANAN */}
      <section className="bg-gradient-to-br from-gray-50 to-green-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-green-600 text-sm font-semibold uppercase tracking-wider">Layanan Premium</span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 mt-2 mb-4">Punya Banyak Properti?<br/><span className="text-green-700">Kami Siap Membantu.</span></h2>
              <ul className="space-y-3 mb-8">{SERVICES.map(s=><li key={s} className="flex items-start gap-3"><span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white"><IconCheck/></span><span className="text-gray-700 text-sm">{s}</span></li>)}</ul>
              <a href={`https://wa.me/${wa}?text=Halo, saya ingin tahu layanan CIBIN`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 shadow-lg"><IconWA/> Hubungi via WhatsApp</a>
            </div>
            <div className="hidden md:block"><div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100"><div className="text-3xl mb-4">🏢</div><h3 className="font-bold text-gray-800 text-lg mb-4">Kelola Properti Lebih Mudah</h3><div className="space-y-2">{["Notifikasi bayar otomatis","Laporan keuangan","Promosi unit kosong"].map(t=><div key={t} className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t}</div>)}</div></div></div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── LISTING PAGE ─────────────────────────────────────────────────────────────
function ListingPage({ filter, setFilter, typeFilter, setTypeFilter, setDetail, setPage }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const wa = getSettings().wa;

  useEffect(() => {
    db.getListings().then(data=>{setListings((data||[]).filter(l=>l.verified&&!l.blocked));setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const filtered = listings.filter(l=>{
    const locOk  = filter==="Semua"||l.location===filter;
    const typeOk = typeFilter==="Semua"||l.type===typeFilter;
    const srch   = search===""||l.name?.toLowerCase().includes(search.toLowerCase())||l.location?.toLowerCase().includes(search.toLowerCase());
    return locOk&&typeOk&&srch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-6"><h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-1">Cari Properti</h1><p className="text-gray-500">{filtered.length} listing ditemukan</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-400" placeholder="Cari nama atau lokasi..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setTypeFilter("Semua")} className={`px-4 py-2 rounded-xl text-sm font-semibold ${typeFilter==="Semua"?"bg-green-600 text-white":"bg-gray-100 text-gray-600 hover:bg-green-50"}`}>Semua Tipe</button>
          {TYPES.map(t=><button key={t.key} onClick={()=>setTypeFilter(t.key)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${typeFilter===t.key?"bg-green-600 text-white":"bg-gray-100 text-gray-600 hover:bg-green-50"}`}>{t.emoji} {t.label}</button>)}
        </div>
        <div className="flex gap-2">
          {["Semua","Cikande","Kibin"].map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${filter===f?"bg-emerald-600 text-white":"bg-gray-100 text-gray-600 hover:bg-emerald-50"}`}>📍 {f}</button>)}
        </div>
      </div>
      <PromoBanner wa={wa}/>
      {loading?<Loading/>:filtered.length===0
        ?<div className="text-center py-20"><div className="text-5xl mb-4">🏚️</div><p className="text-lg font-semibold text-gray-600">Listing tidak ditemukan</p></div>
        :<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map(item=><ListingCard key={item.id} item={item} onDetail={i=>{setDetail(i);setPage("detail");}} wa={wa}/>)}</div>}
    </div>
  );
}

// ─── DETAIL PAGE ──────────────────────────────────────────────────────────────
function DetailPage({ item, setPage }) {
  if (!item) { setPage("listing"); return null; }
  const {label,emoji} = typeInfo(item.type);
  const facs = Array.isArray(item.facilities)?item.facilities:[];
  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <button onClick={()=>setPage("listing")} className="flex items-center gap-2 text-green-700 text-sm font-medium mb-6 hover:gap-3 transition-all">← Kembali</button>
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={item.photo||"https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"} alt={item.name} className="w-full h-full object-cover"/>
          <span className={`absolute top-4 left-4 text-sm font-semibold px-3 py-1.5 rounded-full ${typeBadge(item.type)}`}>{emoji} {label}</span>
          {item.premium&&<span className="absolute top-4 right-4 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-black px-2.5 py-1.5 rounded-full"><IconStar/> UNGGULAN</span>}
          {item.verified&&<span className={`absolute ${item.premium?"top-12":"top-4"} right-4 bg-blue-500 text-white text-xs font-black px-2.5 py-1.5 rounded-full`}>✓ VERIFIED</span>}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div><h1 className="text-2xl font-black text-gray-800 mb-1">{item.name}</h1><div className="flex items-center gap-1 text-gray-500 text-sm"><IconLoc/><span>{item.address}</span></div></div>
            <div className="text-right"><div className="text-3xl font-black text-green-700">{formatRp(item.price)}/bulan</div>{item.rooms&&<div className="text-gray-500 text-sm">{item.rooms} kamar</div>}</div>
          </div>
          <div className="mb-6"><h2 className="font-bold text-gray-700 mb-2">Deskripsi</h2><p className="text-gray-600 leading-relaxed">{item.description}</p></div>
          {facs.length>0&&<div className="mb-8"><h2 className="font-bold text-gray-700 mb-3">Fasilitas</h2><div className="flex flex-wrap gap-2">{facs.map(f=><span key={f} className="bg-green-50 text-green-800 text-sm px-3 py-1.5 rounded-full border border-green-100 font-medium">✓ {f}</span>)}</div></div>}
          <a href={`https://wa.me/${item.wa}?text=Halo, saya tertarik dengan ${item.name}`} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 shadow-lg">
            <IconWA/> Hubungi via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function FormPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [form, setForm]           = useState({type:"kosan",name:"",price:"",location:"Cikande",address:"",wa:"",desc:"",facilities:""});
  const [errors, setErrors]       = useState({});
  const [photos, setPhotos]       = useState([]); // max 1 gratis, 5 premium
  const [uploading, setUploading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const wa = getSettings().wa;
  const maxPhotos = isPremium ? 5 : 1;

  const validate = () => {
    const e={};
    if(!form.name.trim())e.name="Wajib diisi";
    if(!form.price)e.price="Wajib diisi";
    if(!form.address.trim())e.address="Wajib diisi";
    if(!form.wa.trim())e.wa="Wajib diisi";
    if(!form.desc.trim())e.desc="Wajib diisi";
    return e;
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, maxPhotos);
    setPhotos(files);
  };

  const removePhoto = (i) => setPhotos(p => p.filter((_,idx) => idx !== i));

  const handleSubmit = async () => {
    const e=validate(); if(Object.keys(e).length>0){setErrors(e);return;}
    setLoading(true);

    // Upload foto
    let photoUrls = [];
    if (photos.length > 0) {
      setUploading(true);
      for (const file of photos) {
        const url = await uploadPhoto(file);
        if (url) photoUrls.push(url);
      }
      setUploading(false);
    }

    const facs = form.facilities?form.facilities.split(",").map(f=>f.trim()).filter(Boolean):[];
    const ok = await db.insertListing({
      type:form.type, name:form.name, price:parseInt(form.price),
      location:form.location, address:form.address, wa:form.wa,
      description:form.desc, facilities:facs,
      premium:false, verified:false, blocked:false,
      photo: photoUrls[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80",
    });
    setLoading(false);
    if(ok) setSubmitted(true);
  };

  const field=(key,label,type="text",ph="")=>(
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input type={type} placeholder={ph} value={form[key]} onChange={e=>{setForm({...form,[key]:e.target.value});setErrors({...errors,[key]:""});}}
        className={`w-full border ${errors[key]?"border-red-400":"border-gray-200"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition`}/>
      {errors[key]&&<p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  if(submitted) return (
    <div className="max-w-lg mx-auto px-4 pt-32 pb-16 text-center">
      <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-8">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-black text-gray-800 mb-3">Listing Berhasil Dikirim!</h2>
        <p className="text-gray-600">Listing Anda sedang menunggu verifikasi admin sebelum ditampilkan.</p>
        <div className="mt-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-left">
          <p className="text-yellow-800 text-sm font-semibold mb-1">⭐ Ingin tampil lebih menonjol?</p>
          <p className="text-yellow-700 text-xs mb-3">Upgrade ke UNGGULAN — posisi teratas + 5 foto + tidak expired!<br/><strong>Rp 50.000/minggu</strong> atau <strong>Rp 150.000/bulan</strong> (hemat 25%).</p>
          <a href={`https://wa.me/${wa}?text=Halo, saya ingin upgrade listing ke UNGGULAN`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 font-bold py-2 rounded-xl text-sm hover:bg-yellow-500"><IconWA/> Tanya Harga Upgrade</a>
        </div>
        <button onClick={()=>{setSubmitted(false);setForm({type:"kosan",name:"",price:"",location:"Cikande",address:"",wa:"",desc:"",facilities:""});setPhotos([]);}}
          className="mt-4 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">Pasang Lagi</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">Pasang Listing Gratis</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-800 text-sm">ℹ️ Hanya menerima listing di wilayah <strong>Cikande dan Kibin</strong>. Listing akan diverifikasi admin terlebih dahulu.</div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-5">
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Tipe Properti</label><div className="grid grid-cols-2 gap-2">{TYPES.map(t=><button key={t.key} onClick={()=>setForm({...form,type:t.key})} className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.type===t.key?"border-green-600 bg-green-50 text-green-700":"border-gray-200 text-gray-600"}`}>{t.emoji} {t.label}</button>)}</div></div>
        {field("name","Nama Listing","text","Contoh: Kos Melati Putih")}
        {field("price","Harga per Bulan (Rp)","number","Contoh: 500000")}
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Lokasi</label><div className="flex gap-3">{["Cikande","Kibin"].map(l=><button key={l} onClick={()=>setForm({...form,location:l})} className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold ${form.location===l?"border-green-600 bg-green-50 text-green-700":"border-gray-200 text-gray-600"}`}>📍 {l}</button>)}</div></div>
        {field("address","Alamat Lengkap","text","Contoh: Jl. Raya Cikande No. 12")}
        {field("wa","Nomor WhatsApp","tel","Contoh: 08123456789")}
        {field("facilities","Fasilitas (pisahkan koma)","text","Contoh: WiFi, AC, Kamar Mandi Dalam")}
        <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label><textarea rows={4} placeholder="Ceritakan fasilitas dan keunggulan properti Anda..." value={form.desc} onChange={e=>{setForm({...form,desc:e.target.value});setErrors({...errors,desc:""}); }} className={`w-full border ${errors.desc?"border-red-400":"border-gray-200"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none`}/>{errors.desc&&<p className="text-red-500 text-xs mt-1">{errors.desc}</p>}</div>

        {/* UPLOAD FOTO */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">Foto Properti</label>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPremium?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-500"}`}>
              {isPremium?"⭐ Unggulan: maks 5 foto":"Gratis: 1 foto · expired 1 minggu"}
            </span>
          </div>

          {/* Toggle premium */}
          <div className="flex items-center gap-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <input type="checkbox" id="premium-toggle" checked={isPremium} onChange={e=>{setIsPremium(e.target.checked);setPhotos([]);}}
              className="w-4 h-4 accent-yellow-500"/>
            <label htmlFor="premium-toggle" className="text-sm text-yellow-800 font-semibold cursor-pointer">
              Saya sudah upgrade ke <strong>UNGGULAN</strong> (5 foto)
            </label>
          </div>

          {/* Preview foto */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map((f,i) => (
                <div key={i} className="relative rounded-xl overflow-hidden h-24 bg-gray-100">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover"/>
                  <button onClick={()=>removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold hover:bg-red-600">✕</button>
                </div>
              ))}
              {photos.length < maxPhotos && (
                <label className="h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
                  <span className="text-2xl">+</span>
                  <span className="text-xs text-gray-400">Tambah</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotos} multiple={isPremium}/>
                </label>
              )}
            </div>
          )}

          {photos.length === 0 && (
            <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer block">
              <div className="text-3xl mb-2">📷</div>
              <p className="text-gray-700 text-sm font-semibold">Klik untuk pilih foto</p>
              <p className="text-gray-400 text-xs mt-1">JPG, PNG maks 5MB · {isPremium?"Bisa pilih sampai 5 foto · tidak expired":"1 foto · listing otomatis hapus setelah 1 minggu"}</p>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotos} multiple={isPremium}/>
            </label>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading||uploading}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-green-700 transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
          {uploading?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Mengupload foto...</>
           :loading?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Menyimpan...</>
           :"Kirim Listing"}
        </button>
      </div>
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setPage }) {
  const s = getSettings();
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div><div className="flex items-center gap-2 mb-3"><CibinLogo size={32}/><span className="font-black text-xl text-white">CIBIN</span></div><p className="text-gray-400 text-sm">Portal properti sewa khusus wilayah Cikande dan Kibin.</p></div>
          <div><h4 className="font-bold text-white mb-3">Navigasi</h4><ul className="space-y-2 text-sm text-gray-400"><li><button onClick={()=>setPage("home")} className="hover:text-green-400">Beranda</button></li><li><button onClick={()=>setPage("listing")} className="hover:text-green-400">Cari Properti</button></li><li><button onClick={()=>setPage("form")} className="hover:text-green-400">Pasang Listing Gratis</button></li></ul></div>
          <div><h4 className="font-bold text-white mb-3">Hubungi Kami</h4><ul className="space-y-2 text-sm text-gray-400"><li><a href={`https://wa.me/${s.wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400"><IconWA/> WhatsApp</a></li><li>✉️ {s.email}</li>{s.instagram&&<li>📸 {s.instagram}</li>}<li className="text-xs text-gray-500 pt-1">Cikande & Kibin, Kab. Serang, Banten</li></ul></div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} CIBIN — Hak cipta dilindungi.</div>
      </div>
    </footer>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]             = useState("home");
  const [filter, setFilter]         = useState("Semua");
  const [typeFilter, setTypeFilter] = useState("Semua");
  const [detail, setDetail]         = useState(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  useEffect(() => { window.scrollTo({top:0,behavior:"smooth"}); }, [page]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');body{font-family:'Inter',sans-serif;}.line-clamp-1{overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;}`}</style>
      {page!=="admin-login"&&page!=="admin"&&<Navbar page={page} setPage={setPage}/>}
      <main className="flex-1">
        {page==="home"        && <HomePage setPage={setPage} setFilter={setFilter} setTypeFilter={setTypeFilter} setDetail={setDetail}/>}
        {page==="listing"     && <ListingPage filter={filter} setFilter={setFilter} typeFilter={typeFilter} setTypeFilter={setTypeFilter} setDetail={setDetail} setPage={setPage}/>}
        {page==="detail"      && <DetailPage item={detail} setPage={setPage}/>}
        {page==="form"        && <FormPage/>}
        {page==="admin-login" && <AdminLogin onLogin={()=>{setIsAdmin(true);setPage("admin");}}/>}
        {page==="admin"       && (isAdmin?<AdminPanel onLogout={()=>{setIsAdmin(false);setPage("home");}}/>:<AdminLogin onLogin={()=>{setIsAdmin(true);setPage("admin");}}/>)}
      </main>
      {page!=="admin-login"&&page!=="admin"&&<Footer setPage={setPage}/>}
    </div>
  );
}