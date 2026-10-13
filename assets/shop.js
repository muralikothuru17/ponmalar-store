// Customer storefront: browse, bag, checkout, track orders.
import { CATS, STATUS_PILL, DEFAULT_SETTINGS, $, esc, inr, num, rid, ls, toast, copy, pic, createStore, demoBar } from "./common.js";

const S = {
  view: "shop", cat: "All", q: "", sort: "new",
  products: [], loaded: false, settings: { ...DEFAULT_SETTINGS },
  cart: ls.get("pm-cart", []), myIds: ls.get("pm-my-orders", []), myOrders: [], lastOrder: null, store: null
};
const app = $("#app"), layer = $("#layer");
const prod = id => S.products.find(p => p.id === id);
const saveCart = () => ls.set("pm-cart", S.cart);
const lines = () => S.cart.map(l => ({ ...l, p: prod(l.id) })).filter(l => l.p && l.p.active !== false);
function totals() {
  const ls_ = lines(); const sub = ls_.reduce((a, l) => a + l.p.price * l.qty, 0); const st = S.settings;
  const ship = sub === 0 ? 0 : (+st.freeAbove && sub >= +st.freeAbove ? 0 : (+st.shipFee || 0));
  return { lines: ls_, sub, ship, total: sub + ship, count: ls_.reduce((a, l) => a + l.qty, 0) };
}
const priceHtml = (p, big) => { const off = p.mrp > p.price ? Math.round(100 * (p.mrp - p.price) / p.mrp) : 0;
  return `<span class="price num"><b${big ? ' style="font-size:1.5rem"' : ""}>${inr(p.price)}</b>${off ? `<s>${inr(p.mrp)}</s><span class="off">${off}% off</span>` : ""}</span>`; };

function chrome() {
  document.querySelectorAll(".nav [data-go]").forEach(b => b.toggleAttribute("aria-current", b.dataset.go === S.view));
  document.querySelectorAll(".nav [aria-current]").forEach(b => b.setAttribute("aria-current", "page"));
  $("#cartCount").textContent = totals().count;
  const name = S.settings.name || "Ponmalar";
  $("#shopName").textContent = name; $("#footName").textContent = name + " 1 Gram Gold";
  document.title = name + " 1 Gram Gold";
}
function render() { chrome(); app.innerHTML = ({ shop: vShop, checkout: vCheckout, done: vDone, orders: vOrders }[S.view] || vShop)(); }
function renderData() { const busy = ["checkout", "done"].includes(S.view) || document.activeElement?.id === "q"; busy ? chrome() : render(); }
function go(v) { S.view = v; layer.innerHTML = ""; history.replaceState(null, "", v === "shop" ? location.pathname : "#" + v); render(); scrollTo(0, 0); if (v === "orders") loadMyOrders(); }

function vShop() {
  const st = S.settings;
  let list = S.products.filter(p => p.active !== false);
  if (S.cat !== "All") list = list.filter(p => p.category === S.cat);
  if (S.q) { const q = S.q.toLowerCase(); list = list.filter(p => [p.name, p.category, p.finish, p.sku, p.desc].join(" ").toLowerCase().includes(q)); }
  list.sort({ new: (a, b) => (b.createdAt || 0) - (a.createdAt || 0), lo: (a, b) => a.price - b.price, hi: (a, b) => b.price - a.price }[S.sort]);
  const cats = ["All", ...CATS.filter(c => S.products.some(p => p.category === c && p.active !== false))];
  const cards = list.map(p => { const out = (p.stock | 0) <= 0;
    return `<button class="card" data-act="view" data-id="${esc(p.id)}">
      <div class="well">${pic(p)}${p.sample ? `<span class="tag">Sample</span>` : ""}${out ? `<span class="tag r sold">Sold out</span>` : ""}</div>
      <div class="meta"><span class="cat">${esc(p.category)}${p.weight ? ` · ${esc(p.weight)} g` : ""}</span><span class="nm">${esc(p.name)}</span>${priceHtml(p)}
      ${!out && p.stock <= 3 ? `<span class="low">Only ${p.stock} left</span>` : ""}</div></button>`; }).join("");
  const empty = !S.loaded ? `<div class="empty" style="grid-column:1/-1">Loading the collection…</div>`
    : !S.products.length ? `<div class="empty" style="grid-column:1/-1"><h3>The showcase is being arranged</h3><span>New pieces will appear here as soon as the shop adds them.</span></div>`
    : `<div class="empty" style="grid-column:1/-1">No pieces match that search. <button class="btn ghost sm" data-act="clear">Show everything</button></div>`;
  return `<section class="wrap hero"><h1>${esc(st.tagline || DEFAULT_SETTINGS.tagline)}</h1>
      <p>Micro gold-plated pieces that look like the real thing at a fraction of the price — for weddings, functions and every day.</p>
      <div class="marks"><span>1 gram micro plating</span><span>${+st.freeAbove ? `Free shipping above ${inr(st.freeAbove)}` : "Shipping across India"}</span><span>Cash on delivery &amp; UPI</span></div></section>
    <section class="wrap"><div class="tools">
      <div class="chips" role="group" aria-label="Category">${cats.map(c => `<button class="chip" data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat === c}">${esc(c)}</button>`).join("")}</div>
      <div class="search"><input id="q" type="search" placeholder="Search haram, jhumka, kemp…" value="${esc(S.q)}" aria-label="Search">
      <select id="sort" aria-label="Sort"><option value="new"${S.sort === "new" ? " selected" : ""}>Newest</option><option value="lo"${S.sort === "lo" ? " selected" : ""}>Price: low to high</option><option value="hi"${S.sort === "hi" ? " selected" : ""}>Price: high to low</option></select></div>
    </div><div class="grid">${cards || empty}</div></section>`;
}

function modal(id, idx = 0) {
  const p = prod(id); if (!p) return;
  const inCart = S.cart.find(l => l.id === id)?.qty || 0, max = Math.max(0, (p.stock | 0) - inCart);
  layer.innerHTML = `<div class="modal-scrim" role="dialog" aria-modal="true" aria-label="${esc(p.name)}"><div class="modal">
    <div class="gal"><div class="well">${pic(p, idx)}${p.sample ? `<span class="tag">Sample</span>` : ""}</div>
      ${(p.images || []).length > 1 ? `<div class="thumbs">${p.images.map((s, i) => `<button data-act="img" data-id="${esc(p.id)}" data-i="${i}" aria-pressed="${i === idx}" aria-label="Photo ${i + 1}"><img src="${esc(s)}" alt=""></button>`).join("")}</div>` : ""}</div>
    <div class="info">
      <div style="display:flex;justify-content:space-between;gap:10px"><span style="font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">${esc(p.category)}</span><button class="x" data-act="close" aria-label="Close">×</button></div>
      <h2>${esc(p.name)}</h2>${priceHtml(p, true)}
      ${p.desc ? `<p style="margin:0;color:var(--muted)">${esc(p.desc)}</p>` : ""}
      <dl class="spec">${p.finish ? `<dt>Finish</dt><dd>${esc(p.finish)}</dd>` : ""}${p.weight ? `<dt>Weight</dt><dd class="num">${esc(p.weight)} g</dd>` : ""}${p.sku ? `<dt>Item code</dt><dd>${esc(p.sku)}</dd>` : ""}
        <dt>Plating</dt><dd>1 gram micro gold plating</dd>
        <dt>Availability</dt><dd>${(p.stock | 0) > 0 ? `<span class="pill ${p.stock <= 3 ? "warn" : "ok"}">${p.stock} in stock</span>` : `<span class="pill bad">Sold out</span>`}</dd></dl>
      ${max > 0 ? `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="qty"><button data-act="mq" data-d="-1" aria-label="Fewer">−</button><span id="mq" class="num" data-max="${max}">1</span><button data-act="mq" data-d="1" aria-label="More">+</button></div>
        <button class="btn" style="flex:1" data-act="add" data-id="${esc(p.id)}">Add to bag</button></div>`
      : `<p class="note">${(p.stock | 0) > 0 ? "You already have all available pieces in your bag." : "This piece is sold out. Check back soon."}</p>`}
      <p class="note">Care: keep away from water, perfume and sweat. Store in the pouch after use so the plating stays bright.</p>
    </div></div></div>`;
}

function cart() {
  const t = totals();
  layer.innerHTML = `<div class="scrim"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Your bag">
    <header><h2 style="font-size:1.4rem">Your bag</h2><button class="x" data-act="close" aria-label="Close">×</button></header>
    <div class="body">${t.lines.length ? t.lines.map(l => `<div class="line"><div class="th">${pic(l.p)}</div>
      <div style="min-width:0"><div class="nm">${esc(l.p.name)}</div><div class="num" style="color:var(--gold);font-weight:600">${inr(l.p.price)}</div>
      <div class="qty" style="margin-top:6px"><button data-act="cq" data-id="${esc(l.id)}" data-d="-1" aria-label="Fewer">−</button><span class="num">${l.qty}</span><button data-act="cq" data-id="${esc(l.id)}" data-d="1" aria-label="More" ${l.qty >= l.p.stock ? "disabled" : ""}>+</button></div></div>
      <button class="btn ghost sm" data-act="rm" data-id="${esc(l.id)}">Remove</button></div>`).join("")
      : `<div class="empty">Your bag is empty.<button class="btn ghost sm" data-act="close">Browse the collection</button></div>`}</div>
    ${t.lines.length ? `<footer><div class="tot num"><span>Subtotal</span><span>${inr(t.sub)}</span><span>Shipping</span><span>${t.ship ? inr(t.ship) : "Free"}</span><span class="g">Total</span><span class="g">${inr(t.total)}</span></div>
      ${t.ship && +S.settings.freeAbove ? `<span class="note">Add ${inr(S.settings.freeAbove - t.sub)} more for free shipping.</span>` : ""}
      <button class="btn block" data-act="checkout">Checkout</button></footer>` : ""}</aside></div>`;
}

function vCheckout() {
  const t = totals(), d = ls.get("pm-addr", {}), st = S.settings;
  if (!t.lines.length) return `<section class="wrap page"><div class="empty"><h3>Your bag is empty</h3><button class="btn" data-go="shop">Back to shop</button></div></section>`;
  return `<section class="wrap page"><h1>Checkout</h1><form id="co" class="two" novalidate>
    <div class="panel"><h3>Delivery address</h3>
      <div class="row"><label class="f">Full name<input id="c-name" required autocomplete="name" value="${esc(d.name)}"></label>
      <label class="f">Mobile number<input id="c-phone" inputmode="numeric" maxlength="10" required autocomplete="tel-national" placeholder="10-digit mobile" value="${esc(d.phone)}"></label></div>
      <label class="f">House no., street, area<textarea id="c-addr" required autocomplete="street-address">${esc(d.addr)}</textarea></label>
      <div class="row"><label class="f">City<input id="c-city" required autocomplete="address-level2" value="${esc(d.city)}"></label>
      <label class="f">State<input id="c-state" required autocomplete="address-level1" value="${esc(d.state || "Tamil Nadu")}"></label>
      <label class="f">PIN code<input id="c-pin" inputmode="numeric" maxlength="6" required autocomplete="postal-code" value="${esc(d.pin)}"></label></div>
      <h3 style="margin-top:6px">Payment</h3><div class="pay">
        <label><input type="radio" name="pay" value="COD" checked><span><b>Cash on delivery</b><small>Pay the courier when your parcel arrives.</small></span></label>
        <label><input type="radio" name="pay" value="UPI" ${st.upi ? "" : "disabled"}><span><b>UPI</b><small>${st.upi ? `Pay ${inr(t.total)} to the shop's UPI ID after placing the order.` : "Not set up by the shop yet."}</small></span></label></div>
      <p class="err" id="co-err" role="alert"></p></div>
    <div class="panel" style="position:sticky;top:84px"><h3>Order summary</h3>
      ${t.lines.map(l => `<div class="line" style="grid-template-columns:48px 1fr auto"><div class="th" style="width:48px">${pic(l.p)}</div><div class="nm" style="font-size:.92rem">${esc(l.p.name)} <span style="color:var(--muted)">× ${l.qty}</span></div><span class="num">${inr(l.p.price * l.qty)}</span></div>`).join("")}
      <div class="tot num"><span>Subtotal</span><span>${inr(t.sub)}</span><span>Shipping</span><span>${t.ship ? inr(t.ship) : "Free"}</span><span class="g">Total</span><span class="g">${inr(t.total)}</span></div>
      <button class="btn block" type="submit" id="co-btn">Place order · ${inr(t.total)}</button>
      <button class="btn ghost block" type="button" data-go="shop">Continue shopping</button></div></form></section>`;
}

const waLink = (n, text) => `https://wa.me/${String(n).replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(text)}`;
function orderText(o) {
  return `New order ${o.id} — ${S.settings.name}\n` + o.items.map(i => `• ${i.name}${i.sku ? ` (${i.sku})` : ""} × ${i.qty} = ${inr(i.price * i.qty)}`).join("\n")
    + `\nShipping: ${o.ship ? inr(o.ship) : "Free"}\nTotal: ${inr(o.total)}\nPayment: ${o.pay}\n\n${o.customer.name}, ${o.customer.phone}\n${o.customer.addr}, ${o.customer.city}, ${o.customer.state} – ${o.customer.pin}`;
}
function vDone() {
  const o = S.lastOrder; if (!o) return vShop(); const st = S.settings;
  return `<section class="wrap page" style="max-width:720px">
    <div class="panel" style="text-align:center;justify-items:center">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="27" fill="var(--velvet)"/><path d="M17 29 l7 7 15-16" fill="none" stroke="var(--gold-hi)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h1>Order placed</h1>
      <p style="margin:0;color:var(--muted)">Order number <b class="num" style="color:var(--ink);user-select:all">${esc(o.id)}</b> · ${inr(o.total)} · ${o.pay === "COD" ? "Cash on delivery" : "UPI"}</p>
      <p style="margin:0">The shop will confirm it shortly. Save the order number to track it under <b>My orders</b>.</p></div>
    ${o.pay === "UPI" && st.upi ? `<div class="panel"><h3>Pay by UPI</h3><p style="margin:0">Pay <b>${inr(o.total)}</b> to this UPI ID from GPay, PhonePe or Paytm, and write <b>${esc(o.id)}</b> in the note.</p>
      <div class="copybox"><code>${esc(st.upi)}</code><button class="btn ghost sm" data-act="copy" data-text="${esc(st.upi)}">Copy UPI ID</button>
      <a class="btn sm" href="upi://pay?pa=${encodeURIComponent(st.upi)}&pn=${encodeURIComponent(st.name)}&am=${o.total}&cu=INR&tn=${encodeURIComponent(o.id)}">Open UPI app</a></div></div>` : ""}
    ${st.whatsapp ? `<div class="panel"><h3>Message the shop (optional)</h3><p style="margin:0">WhatsApp <b class="num" style="user-select:all">${esc(st.whatsapp)}</b> to ask about your order.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="${waLink(st.whatsapp, orderText(o))}" target="_blank" rel="noopener">Send on WhatsApp</a><button class="btn ghost" data-act="copy" data-text="${esc(orderText(o))}">Copy order details</button></div></div>` : ""}
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn ghost" data-go="shop">Continue shopping</button><button class="btn" data-go="orders">View my orders</button></div></section>`;
}

function orderCard(o) {
  const date = new Date(o.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  return `<article class="order"><div class="hd"><b class="num">${esc(o.id)}</b><span class="pill ${STATUS_PILL[o.status] || "n"}">${esc(o.status)}</span><span class="muted">${date}</span><span class="num" style="margin-left:auto;font-weight:700">${inr(o.total)}</span></div>
    <ul>${o.items.map(i => `<li>${esc(i.name)} × ${i.qty} <span class="muted num">${inr(i.price * i.qty)}</span></li>`).join("")}</ul>
    <div class="muted">${esc(o.pay)} · Delivering to ${esc(o.customer.name)}, ${esc(o.customer.city)} ${esc(o.customer.pin)}</div></article>`;
}
function vOrders() {
  const list = S.myOrders.slice().sort((a, b) => b.createdAt - a.createdAt);
  return `<section class="wrap page" style="max-width:820px"><h1>My orders</h1>
    <form id="track" class="track"><input id="t-id" placeholder="Have an order number? e.g. PM261013-AB12CD" aria-label="Order number"><button class="btn" type="submit">Track order</button></form>
    <p class="err" id="t-err" role="alert"></p>
    ${list.length ? list.map(orderCard).join("") : `<div class="empty"><h3>No orders on this device yet</h3><span>Orders you place here are remembered on this phone or computer. Enter an order number above to look one up.</span><button class="btn" data-go="shop">Start shopping</button></div>`}</section>`;
}
async function loadMyOrders() {
  const found = [];
  for (const id of S.myIds) { try { const o = await S.store.getOrder(id); if (o) found.push(o); } catch { } }
  S.myOrders = found; if (S.view === "orders") render();
}

async function placeOrder(form) {
  const g = id => $("#" + id).value.trim(), err = $("#co-err");
  const c = { name: g("c-name"), phone: g("c-phone").replace(/\D/g, ""), addr: g("c-addr"), city: g("c-city"), state: g("c-state"), pin: g("c-pin").replace(/\D/g, "") };
  if (!c.name || !c.addr || !c.city || !c.state) return (err.textContent = "Fill in your name and full address.");
  if (!/^[6-9]\d{9}$/.test(c.phone)) return (err.textContent = "Enter a 10-digit Indian mobile number.");
  if (!/^\d{6}$/.test(c.pin)) return (err.textContent = "Enter a 6-digit PIN code.");
  const t = totals();
  for (const l of t.lines) if (l.qty > (l.p.stock | 0)) return (err.textContent = `Only ${l.p.stock} of ${l.p.name} left. Reduce the quantity in your bag.`);
  ls.set("pm-addr", c);
  const d = new Date(), pad = n => String(n).padStart(2, "0");
  const o = { id: `PM${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rid(6)}`,
    items: t.lines.map(l => ({ pid: l.id, name: l.p.name, sku: l.p.sku || "", price: l.p.price, qty: l.qty })),
    customer: c, pay: form.querySelector("[name=pay]:checked").value, sub: t.sub, ship: t.ship, total: t.total,
    status: "placed", stockApplied: false, createdAt: Date.now() };
  const btn = $("#co-btn"); btn.disabled = true; btn.textContent = "Placing order…";
  try { await S.store.createOrder(o); }
  catch (e) { console.error(e); btn.disabled = false; btn.textContent = `Place order · ${inr(t.total)}`; return (err.textContent = "Couldn't place the order. Check your internet connection and try again."); }
  S.myIds = [...S.myIds, o.id]; ls.set("pm-my-orders", S.myIds);
  S.lastOrder = o; S.cart = []; saveCart(); go("done");
}

/* events */
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g) return go(g.dataset.go);
  if (e.target.classList.contains("scrim") || e.target.classList.contains("modal-scrim")) return (layer.innerHTML = "");
  const a = e.target.closest("[data-act]"); if (!a) return; const id = a.dataset.id;
  switch (a.dataset.act) {
    case "close": layer.innerHTML = ""; break;
    case "open-cart": cart(); break;
    case "view": modal(id); break;
    case "img": modal(id, +a.dataset.i); break;
    case "cat": S.cat = a.dataset.cat; render(); break;
    case "clear": S.cat = "All"; S.q = ""; render(); break;
    case "mq": { const el = $("#mq"); el.textContent = Math.min(+el.dataset.max, Math.max(1, +el.textContent + +a.dataset.d)); break; }
    case "add": { const q = +$("#mq").textContent, l = S.cart.find(x => x.id === id); l ? (l.qty += q) : S.cart.push({ id, qty: q }); saveCart(); chrome(); cart(); toast("Added to bag"); break; }
    case "cq": { const l = S.cart.find(x => x.id === id), p = prod(id); if (!l || !p) break; l.qty = Math.min(p.stock | 0, l.qty + +a.dataset.d); if (l.qty <= 0) S.cart = S.cart.filter(x => x.id !== id); saveCart(); chrome(); cart(); break; }
    case "rm": S.cart = S.cart.filter(x => x.id !== id); saveCart(); chrome(); cart(); break;
    case "checkout": go("checkout"); break;
    case "copy": copy(a.dataset.text); break;
  }
});
document.addEventListener("change", e => { if (e.target.id === "sort") { S.sort = e.target.value; render(); } });
let qT;
document.addEventListener("input", e => {
  if (e.target.id !== "q") return; clearTimeout(qT);
  qT = setTimeout(() => { S.q = e.target.value.trim(); const pos = e.target.selectionStart; render(); const q = $("#q"); q.focus(); try { q.setSelectionRange(pos, pos); } catch { } }, 220);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") layer.innerHTML = ""; });
document.addEventListener("submit", async e => {
  e.preventDefault();
  if (e.target.id === "co") return placeOrder(e.target);
  if (e.target.id === "track") {
    const id = $("#t-id").value.trim().toUpperCase(); const err = $("#t-err");
    if (!id) return (err.textContent = "Enter your order number.");
    const o = await S.store.getOrder(id).catch(() => null);
    if (!o) return (err.textContent = "No order with that number. Check it matches the one on your confirmation.");
    if (!S.myIds.includes(id)) { S.myIds.push(id); ls.set("pm-my-orders", S.myIds); }
    await loadMyOrders();
  }
});

/* boot */
const h = location.hash.slice(1); if (["orders", "checkout"].includes(h)) S.view = h;
render();
S.store = await createStore(); demoBar(S.store);
S.store.watchProducts(list => { S.products = list; S.loaded = true; renderData(); }, err => { console.error(err); S.loaded = true; renderData(); });
S.store.watchSettings(st => { S.settings = { ...DEFAULT_SETTINGS, ...(st || {}) }; renderData(); });
if (S.view === "orders") loadMyOrders();
