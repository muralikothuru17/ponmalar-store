// Shared helpers, jewellery illustrations and the data layer used by both pages.
import { FIREBASE_CONFIG } from "./firebase-config.js";

export const CATS = ["Necklaces", "Harams", "Bangles", "Earrings", "Chains", "Rings", "Anklets", "Bridal sets"];
export const STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"];
export const STATUS_PILL = { placed: "warn", confirmed: "n", shipped: "n", delivered: "ok", cancelled: "bad" };
export const DEFAULT_SETTINGS = {
  name: "Ponmalar", tagline: "Temple, antique & everyday 1 gram gold jewellery",
  whatsapp: "", upi: "", shipFee: 60, freeAbove: 999
};

export const $ = (s, r = document) => r.querySelector(s);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const inr = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(n || 0));
export const num = v => { const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, "")); return isNaN(n) ? null : n; };
export const rid = (n = 6) => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const b = crypto.getRandomValues(new Uint8Array(n)); return [...b].map(x => a[x % a.length]).join(""); };
export const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
};

let toastT;
export function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600);
}
export async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Copied"); }
  catch { toast("Couldn't copy automatically. Select the text and copy it."); }
}

/* Jewellery line art, shown when a piece has no photo yet */
export function art(kind) {
  const id = "g" + String(kind).replace(/\W/g, "");
  const g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6D98A"/><stop offset=".5" stop-color="#D5A443"/><stop offset="1" stop-color="#9C6B1C"/></linearGradient></defs>`;
  const G = `url(#${id})`, red = "#B3263A", grn = "#1F7A55";
  const beads = (cx, cy, rx, ry, n, r, a0 = .15, a1 = .85) => { let s = ""; for (let i = 0; i <= n; i++) { const t = Math.PI * (a0 + (a1 - a0) * i / n); s += `<circle cx="${(cx - rx * Math.cos(t)).toFixed(1)}" cy="${(cy + ry * Math.sin(t)).toFixed(1)}" r="${r}" fill="${G}"/>`; } return s; };
  let body = "";
  switch (kind) {
    case "Harams": body = beads(100, 40, 62, 118, 22, 3.2) + beads(100, 40, 48, 92, 18, 2.6) + `<path d="M88 150 Q100 140 112 150 L106 182 Q100 190 94 182Z" fill="${G}"/><circle cx="100" cy="160" r="5" fill="${red}"/>`; break;
    case "Bangles": body = `<ellipse cx="100" cy="112" rx="58" ry="22" fill="none" stroke="${G}" stroke-width="9"/><ellipse cx="100" cy="94" rx="58" ry="22" fill="none" stroke="${G}" stroke-width="9"/>` + Array.from({ length: 9 }, (_, i) => `<circle cx="${(100 - 50 * Math.cos(Math.PI * i / 8)).toFixed(1)}" cy="${(116 + 18 * Math.sin(Math.PI * i / 8)).toFixed(1)}" r="2.6" fill="${i % 2 ? red : grn}"/>`).join(""); break;
    case "Earrings": body = [70, 130].map(x => `<circle cx="${x}" cy="58" r="10" fill="${G}"/><circle cx="${x}" cy="58" r="4" fill="${red}"/><path d="M${x - 22} 108 Q${x} 64 ${x + 22} 108 Z" fill="${G}"/>${[...Array(7)].map((_, i) => `<circle cx="${x - 18 + i * 6}" cy="114" r="2.6" fill="${G}"/>`).join("")}<line x1="${x}" y1="68" x2="${x}" y2="80" stroke="${G}" stroke-width="2"/>`).join(""); break;
    case "Chains": body = Array.from({ length: 26 }, (_, i) => { const t = Math.PI * (.12 + .76 * i / 25); const x = (100 - 66 * Math.cos(t)).toFixed(1), y = (36 + 120 * Math.sin(t)).toFixed(1); return `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.6" fill="none" stroke="${G}" stroke-width="1.8" transform="rotate(${(i * 35) % 180} ${x} ${y})"/>`; }).join(""); break;
    case "Rings": body = `<ellipse cx="100" cy="122" rx="40" ry="34" fill="none" stroke="${G}" stroke-width="8"/><path d="M80 86 L100 66 L120 86 L100 98Z" fill="${G}"/><circle cx="100" cy="82" r="8" fill="${red}"/>`; break;
    case "Anklets": body = beads(100, 70, 64, 60, 30, 2.4, .05, .95) + Array.from({ length: 8 }, (_, i) => { const t = Math.PI * (.12 + .76 * i / 7); const x = (100 - 64 * Math.cos(t)).toFixed(1), y = 70 + 60 * Math.sin(t); return `<line x1="${x}" y1="${y.toFixed(1)}" x2="${x}" y2="${(y + 10).toFixed(1)}" stroke="${G}" stroke-width="1.4"/><circle cx="${x}" cy="${(y + 13).toFixed(1)}" r="3.4" fill="${G}"/>`; }).join(""); break;
    case "Bridal sets": body = beads(100, 30, 64, 90, 20, 3) + `<path d="M76 116 Q100 96 124 116 L114 150 Q100 162 86 150Z" fill="${G}"/><circle cx="100" cy="128" r="7" fill="${red}"/><circle cx="88" cy="140" r="3" fill="${grn}"/><circle cx="112" cy="140" r="3" fill="${grn}"/>` + [46, 154].map(x => `<path d="M${x - 12} 196 Q${x} 172 ${x + 12} 196Z" fill="${G}"/><circle cx="${x}" cy="168" r="5" fill="${G}"/>`).join(""); break;
    default: body = beads(100, 36, 58, 92, 20, 3) + `<path d="M90 124 Q100 116 110 124 L104 152 Q100 158 96 152Z" fill="${G}"/><circle cx="100" cy="132" r="4.5" fill="${grn}"/>`;
  }
  return `<svg viewBox="0 0 200 250" role="img" aria-label="${esc(kind)} illustration">${g}<g transform="translate(0 12)">${body}</g></svg>`;
}
export const pic = (p, i = 0) => p.images && p.images[i] ? `<img src="${esc(p.images[i])}" alt="${esc(p.name)}" loading="lazy">` : art(p.category);

/* Resize a photo to max 900px JPEG (~75 KB) so it fits inside a Firestore document */
export function compress(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error("Couldn't read that file."));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error("That file isn't an image we can open. Try a JPG or PNG."));
      img.onload = () => {
        const s = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const x = c.getContext("2d"); x.fillStyle = "#14201B"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        let q = .8, out = c.toDataURL("image/jpeg", q);
        while (out.length > 75000 && q > .4) { q -= .1; out = c.toDataURL("image/jpeg", q); }
        res(out);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

export const SAMPLE_PRODUCTS = [
  { id: "sample-haram", name: "Lakshmi coin long haram", category: "Harams", finish: "Antique matte", sku: "HR-101", price: 1450, mrp: 2100, stock: 6, weight: "48", desc: "Sample item. 30-inch long haram with Lakshmi coins and a ruby-red pendant." },
  { id: "sample-necklace", name: "Emerald drop choker necklace", category: "Necklaces", finish: "Bright gold", sku: "NK-204", price: 890, mrp: 1250, stock: 2, weight: "26", desc: "Sample item. Short choker with a single green-stone drop." },
  { id: "sample-jhumka", name: "Kemp stone jhumkas", category: "Earrings", finish: "Kemp", sku: "ER-310", price: 420, mrp: 599, stock: 12, weight: "14", desc: "Sample item. Temple-style jhumkas with kemp stones and pearl drops." },
  { id: "sample-bangles", name: "Stone-studded bangles, set of 2", category: "Bangles", finish: "Bright gold", sku: "BG-2.6-07", price: 760, mrp: 0, stock: 8, weight: "32", desc: "Sample item. Size 2.6. Red and green stone work." },
  { id: "sample-chain", name: "Daily wear rope chain, 24 inch", category: "Chains", finish: "Bright gold", sku: "CH-024", price: 350, mrp: 499, stock: 0, weight: "10", desc: "Sample item. Lightweight chain for pendants or everyday wear." },
  { id: "sample-bridal", name: "Peacock bridal set with earrings", category: "Bridal sets", finish: "Antique with kemp", sku: "BR-501", price: 2890, mrp: 3999, stock: 3, weight: "95", desc: "Sample item. Necklace, long haram and matching earrings." }
].map((p, i) => ({ ...p, images: [], active: true, sample: true, createdAt: 1760350000000 - i }));

/* ───────────── data layer ───────────── */
const configured = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !/^PASTE/.test(FIREBASE_CONFIG.apiKey);
const STOCK_STATUSES = ["confirmed", "shipped", "delivered"];

export async function createStore() {
  if (configured) {
    try { return await firebaseStore(); }
    catch (e) { console.error("Firebase failed to load, using demo mode", e); }
  }
  return localStore();
}

async function firebaseStore() {
  const base = "https://www.gstatic.com/firebasejs/10.12.2/";
  const [{ initializeApp }, fs, au] = await Promise.all([
    import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-auth.js")
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const db = fs.getFirestore(app), auth = au.getAuth(app);
  const d = (...p) => fs.doc(db, ...p);
  return {
    mode: "firebase",
    watchProducts: (cb, err) => fs.onSnapshot(fs.collection(db, "products"), s => cb(s.docs.map(x => ({ id: x.id, ...x.data() }))), err),
    watchSettings: cb => fs.onSnapshot(d("store", "settings"), s => cb(s.exists() ? s.data() : null), () => cb(null)),
    saveProduct: (id, data) => fs.setDoc(d("products", id), data),
    updateProduct: (id, patch) => fs.updateDoc(d("products", id), patch),
    deleteProduct: id => fs.deleteDoc(d("products", id)),
    saveSettings: s => fs.setDoc(d("store", "settings"), s),
    createOrder: o => fs.setDoc(d("orders", o.id), o),
    getOrder: async id => { const s = await fs.getDoc(d("orders", id)); return s.exists() ? s.data() : null; },
    watchOrders: (cb, err) => fs.onSnapshot(fs.collection(db, "orders"), s => cb(s.docs.map(x => x.data())), err),
    // Changes status and moves stock in one transaction, so stock never drifts.
    setOrderStatus: (id, status) => fs.runTransaction(db, async tx => {
      const oref = d("orders", id); const os = await tx.get(oref); if (!os.exists()) throw new Error("Order not found");
      const o = os.data(); const want = STOCK_STATUSES.includes(status); const move = want !== !!o.stockApplied;
      const refs = move ? o.items.map(i => d("products", i.pid)) : [];
      const snaps = []; for (const r of refs) snaps.push(await tx.get(r));
      snaps.forEach((s, k) => { if (s.exists()) tx.update(refs[k], { stock: Math.max(0, (s.data().stock | 0) + (want ? -o.items[k].qty : o.items[k].qty)) }); });
      tx.update(oref, { status, stockApplied: move ? want : !!o.stockApplied, updatedAt: Date.now() });
    }),
    onAuth: cb => au.onAuthStateChanged(auth, u => cb(u ? { email: u.email } : null)),
    signIn: (e, p) => au.signInWithEmailAndPassword(auth, e, p),
    signOut: () => au.signOut(auth),
    resetPassword: e => au.sendPasswordResetEmail(auth, e)
  };
}

function localStore() {
  const KEY = "pm-demo-db";
  const load = () => {
    let s = ls.get(KEY, null);
    if (!s) { s = { products: Object.fromEntries(SAMPLE_PRODUCTS.map(p => [p.id, p])), settings: null, orders: {} }; ls.set(KEY, s); }
    return s;
  };
  const subs = new Set();
  const emit = () => subs.forEach(f => f());
  const save = s => { ls.set(KEY, s); emit(); };
  addEventListener("storage", e => { if (e.key === KEY) emit(); });
  const watch = fn => { const f = () => fn(load()); subs.add(f); setTimeout(f); return () => subs.delete(f); };
  const mut = fn => { const s = load(); fn(s); save(s); return Promise.resolve(); };
  return {
    mode: "demo",
    watchProducts: cb => watch(s => cb(Object.entries(s.products).map(([id, p]) => ({ ...p, id })))),
    watchSettings: cb => watch(s => cb(s.settings)),
    saveProduct: (id, data) => mut(s => { s.products[id] = { ...data, id }; }),
    updateProduct: (id, patch) => mut(s => { if (s.products[id]) Object.assign(s.products[id], patch); }),
    deleteProduct: id => mut(s => { delete s.products[id]; }),
    saveSettings: st => mut(s => { s.settings = st; }),
    createOrder: o => mut(s => { s.orders[o.id] = o; }),
    getOrder: async id => load().orders[id] || null,
    watchOrders: cb => watch(s => cb(Object.values(s.orders))),
    setOrderStatus: (id, status) => mut(s => {
      const o = s.orders[id]; if (!o) return; const want = STOCK_STATUSES.includes(status);
      if (want !== !!o.stockApplied) { o.items.forEach(i => { const p = s.products[i.pid]; if (p) p.stock = Math.max(0, (p.stock | 0) + (want ? -i.qty : i.qty)); }); o.stockApplied = want; }
      o.status = status;
    }),
    onAuth: cb => { setTimeout(() => cb({ email: "demo@local" })); return () => { }; },
    signIn: async () => { }, signOut: async () => { }, resetPassword: async () => { }
  };
}

export function demoBar(store) {
  if (store.mode !== "demo") return;
  const b = document.createElement("div"); b.className = "demo-bar";
  b.innerHTML = `Demo mode: data is saved only in this browser. Add your Firebase keys to go live (see README).`;
  document.body.prepend(b);
}
