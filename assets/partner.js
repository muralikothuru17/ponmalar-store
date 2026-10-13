// Partner dashboard: sign in, add items with photos and stock, manage orders and shop settings.
import { CATS, STATUSES, STATUS_PILL, DEFAULT_SETTINGS, SAMPLE_PRODUCTS, $, esc, inr, num, rid, toast, pic, compress, createStore, demoBar } from "./common.js";

const S = {
  store: null, user: undefined, products: [], orders: [], settings: { ...DEFAULT_SETTINGS },
  tab: "items", editing: null, confirm: null, denied: false, imgs: [], unsub: []
};
const app = $("#app");
const prod = id => S.products.find(p => p.id === id);

function render() {
  $("#shopName").textContent = S.settings.name || "Ponmalar";
  $("#signout").hidden = !S.user || S.store?.mode === "demo";
  if (S.user === undefined) return (app.innerHTML = `<section class="wrap page"><div class="empty">Loading…</div></section>`);
  if (!S.user) return (app.innerHTML = vLogin());
  app.innerHTML = vDash();
  if (S.tab === "add") drawImgs();
}
function renderData() { if (S.user && (S.tab === "add" || S.tab === "settings")) { kpis(); return; } render(); }
function kpis() { const k = $("#kpis"); if (k) k.outerHTML = vKpis(); }

function vLogin() {
  return `<section class="wrap"><form id="login" class="panel login" novalidate>
    <span style="font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)">Partner</span><h1 style="font-size:1.9rem">Sign in to your shop</h1>
    <label class="f">Email<input id="l-email" type="email" autocomplete="username" required></label>
    <label class="f">Password<input id="l-pass" type="password" autocomplete="current-password" required></label>
    <p class="err" id="l-err" role="alert"></p>
    <button class="btn block" type="submit" id="l-btn">Sign in</button>
    <button class="btn ghost block" type="button" data-act="reset">Forgot password</button>
    <p class="note">Partner accounts are created in your Firebase console. See the README for the two-minute setup.</p></form></section>`;
}

function vKpis() {
  const open = S.orders.filter(o => o.status === "placed").length;
  const low = S.products.filter(p => p.active !== false && (p.stock | 0) <= 3).length;
  const now = new Date();
  const month = S.orders.filter(o => o.status !== "cancelled" && new Date(o.createdAt).getMonth() === now.getMonth() && new Date(o.createdAt).getFullYear() === now.getFullYear());
  return `<div class="kpis num" id="kpis">
    <div class="kpi"><span>Items listed</span><b>${S.products.filter(p => p.active !== false).length}</b></div>
    <div class="kpi"><span>Pieces in stock</span><b>${S.products.reduce((a, p) => a + (p.stock | 0), 0)}</b></div>
    <div class="kpi"><span>Low or out of stock</span><b style="color:${low ? "var(--warn)" : "inherit"}">${low}</b></div>
    <div class="kpi"><span>New orders</span><b style="color:${open ? "var(--warn)" : "inherit"}">${open}</b></div>
    <div class="kpi"><span>Sales this month</span><b>${inr(month.reduce((a, o) => a + o.total, 0))}</b></div></div>`;
}
function vDash() {
  const open = S.orders.filter(o => o.status === "placed").length;
  const tabs = [["items", "Items & stock"], ["add", S.editing ? "Edit item" : "Add item"], ["orders", `Orders${open ? ` (${open})` : ""}`], ["settings", "Shop settings"]];
  if (S.denied) return `<section class="wrap page"><div class="empty"><h3>This account can't manage the shop</h3><span>${esc(S.user.email)} isn't listed as a partner in <b>firestore.rules</b>. Add the email there, publish the rules, then reload this page.</span></div></section>`;
  return `<section class="wrap page">
    <div style="display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap"><div><span style="font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)">Partner · ${esc(S.user.email)}</span><h1>Shop dashboard</h1></div>
      <a class="btn ghost sm" href="./" target="_blank" rel="noopener">View shop</a></div>
    ${vKpis()}
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-act="tab" data-tab="${k}" aria-selected="${S.tab === k}">${l}</button>`).join("")}</div>
    ${({ items: vItems, add: vForm, orders: vOrders, settings: vSettings })[S.tab]()}</section>`;
}

function vItems() {
  if (!S.products.length) return `<div class="empty"><h3>No items yet</h3><span>Add your first piece with photos, price and quantity. It appears in the shop straight away.</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn" data-act="tab" data-tab="add">Add item</button><button class="btn ghost" data-act="samples">Load 6 sample items</button></div></div>`;
  const samples = S.products.filter(p => p.sample).length;
  return `${samples ? `<div class="note" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${samples} sample items are showing so you can see how the shop looks. Remove them once you've added your own.
      ${S.confirm === "__samples" ? `<span class="confirm">Remove all ${samples}? <button class="btn danger sm" data-act="rm-samples">Remove</button><button class="btn ghost sm" data-act="cancel">Keep</button></span>` : `<button class="btn ghost sm" data-act="ask-samples">Remove samples</button>`}</div>` : ""}
  <div class="tbl-wrap"><table><thead><tr><th></th><th>Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Shown in shop</th><th></th></tr></thead><tbody>
  ${S.products.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(p => `<tr>
    <td><div class="th">${pic(p)}</div></td>
    <td><b style="font-weight:600">${esc(p.name)}</b>${p.sample ? ` <span class="pill n">Sample</span>` : ""}<div style="color:var(--muted);font-size:.82rem">${esc(p.sku || "")}</div></td>
    <td>${esc(p.category)}</td>
    <td class="num">${inr(p.price)}${p.mrp > p.price ? `<div style="color:var(--muted);font-size:.8rem"><s>${inr(p.mrp)}</s></div>` : ""}</td>
    <td><div class="stock num"><button data-act="stk" data-id="${esc(p.id)}" data-d="-1" aria-label="Decrease stock">−</button><input id="stk-${esc(p.id)}" data-act="stkset" data-id="${esc(p.id)}" inputmode="numeric" value="${p.stock | 0}" aria-label="Stock for ${esc(p.name)}"><button data-act="stk" data-id="${esc(p.id)}" data-d="1" aria-label="Increase stock">+</button></div>
      ${(p.stock | 0) <= 0 ? `<span class="pill bad">Out</span>` : (p.stock <= 3 ? `<span class="pill warn">Low</span>` : "")}</td>
    <td><label style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" data-act="active" data-id="${esc(p.id)}" ${p.active !== false ? "checked" : ""}> ${p.active !== false ? "Yes" : "Hidden"}</label></td>
    <td style="white-space:nowrap">${S.confirm === p.id ? `<span class="confirm">Delete? <button class="btn danger sm" data-act="del" data-id="${esc(p.id)}">Delete</button><button class="btn ghost sm" data-act="cancel">Keep</button></span>`
      : `<button class="btn ghost sm" data-act="edit" data-id="${esc(p.id)}">Edit</button> <button class="btn ghost sm" data-act="ask-del" data-id="${esc(p.id)}">Delete</button>`}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function vForm() {
  const p = S.editing ? prod(S.editing) || {} : {};
  return `<form id="pf" class="two" novalidate>
    <div class="panel"><h3>${S.editing ? "Edit item" : "New item"}</h3>
      <label class="f">Item name<input id="p-name" required maxlength="80" placeholder="e.g. Lakshmi coin long haram" value="${esc(p.name)}"></label>
      <div class="row"><label class="f">Category<select id="p-cat">${CATS.map(c => `<option${c === (p.category || "Necklaces") ? " selected" : ""}>${c}</option>`).join("")}</select></label>
        <label class="f">Finish<input id="p-finish" maxlength="60" placeholder="Antique, kemp, matte…" value="${esc(p.finish)}"></label>
        <label class="f">Item code<input id="p-sku" maxlength="24" placeholder="NK-104" value="${esc(p.sku)}"></label></div>
      <div class="row"><label class="f">Selling price (₹)<input id="p-price" inputmode="numeric" required value="${p.price ?? ""}"></label>
        <label class="f">MRP (₹, optional)<input id="p-mrp" inputmode="numeric" value="${p.mrp || ""}"></label>
        <label class="f">Quantity in stock<input id="p-stock" inputmode="numeric" required value="${p.stock ?? 1}"></label>
        <label class="f">Weight (g, optional)<input id="p-weight" inputmode="decimal" value="${esc(p.weight)}"></label></div>
      <label class="f">Description<textarea id="p-desc" maxlength="500" placeholder="Length, stone colour, what it pairs with…">${esc(p.desc)}</textarea></label>
      <p class="err" id="pf-err" role="alert"></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit" id="pf-btn">${S.editing ? "Save changes" : "Add to shop"}</button>${S.editing ? `<button class="btn ghost" type="button" data-act="cancel-edit">Cancel</button>` : ""}</div></div>
    <div class="panel"><h3>Photos</h3>
      <p style="margin:0;color:var(--muted);font-size:.9rem">Up to 3 photos; the first is the cover. They're resized automatically. A plain dark background shows gold best.</p>
      <div class="imgs" id="imgs"></div><input type="file" id="p-files" accept="image/*" multiple hidden></div></form>`;
}
function drawImgs() {
  const box = $("#imgs"); if (!box) return;
  box.innerHTML = S.imgs.map((s, i) => `<div class="im"><img src="${s}" alt="Photo ${i + 1}"><button type="button" data-act="rmimg" data-i="${i}" aria-label="Remove photo">×</button></div>`).join("")
    + (S.imgs.length < 3 ? `<label class="drop" for="p-files" id="drop">+ Add photo<br>or drop here</label>` : "");
}
async function addFiles(files) {
  const err = $("#pf-err");
  for (const f of [...files].slice(0, 3 - S.imgs.length)) {
    if (!f.type.startsWith("image/")) { err.textContent = `${f.name} isn't an image.`; continue; }
    try { S.imgs.push(await compress(f)); } catch (e) { err.textContent = e.message; }
  }
  drawImgs();
}

function vOrders() {
  if (!S.orders.length) return `<div class="empty"><h3>No orders yet</h3><span>Orders customers place show up here live. Confirming an order takes its pieces off stock.</span></div>`;
  return S.orders.slice().sort((a, b) => b.createdAt - a.createdAt).map(o => {
    const date = new Date(o.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    const c = o.customer;
    return `<article class="order"><div class="hd"><b class="num">${esc(o.id)}</b><span class="pill ${STATUS_PILL[o.status] || "n"}">${esc(o.status)}</span><span class="muted">${date}</span><span class="num" style="margin-left:auto;font-weight:700">${inr(o.total)}</span></div>
      <ul>${o.items.map(i => `<li>${esc(i.name)}${i.sku ? ` (${esc(i.sku)})` : ""} × ${i.qty} <span class="muted num">${inr(i.price * i.qty)}</span></li>`).join("")}</ul>
      <div class="muted">${esc(o.pay)} · ${esc(c.name)}, <span style="user-select:all">${esc(c.phone)}</span> · ${esc(c.addr)}, ${esc(c.city)}, ${esc(c.state)} ${esc(c.pin)}</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><label class="f" style="display:flex;align-items:center;gap:8px">Status
        <select data-act="status" data-id="${esc(o.id)}" style="width:auto">${STATUSES.map(s => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select></label>
        <span class="muted">${o.stockApplied ? "Stock deducted" : "Stock is deducted when you confirm"}</span>
        <a class="btn ghost sm" href="https://wa.me/91${esc(c.phone)}" target="_blank" rel="noopener">WhatsApp customer</a></div></article>`;
  }).join("");
}

function vSettings() {
  const st = S.settings;
  return `<form id="sf" class="panel" style="max-width:720px" novalidate><h3>Shop settings</h3>
    <div class="row"><label class="f">Shop name<input id="s-name" maxlength="40" value="${esc(st.name)}"></label>
      <label class="f">WhatsApp number<input id="s-wa" inputmode="tel" placeholder="98xxxxxxxx" value="${esc(st.whatsapp)}"></label></div>
    <label class="f">Headline on the shop page<input id="s-tag" maxlength="90" value="${esc(st.tagline)}"></label>
    <div class="row"><label class="f">UPI ID<input id="s-upi" placeholder="shopname@okaxis" value="${esc(st.upi)}"></label>
      <label class="f">Shipping fee (₹)<input id="s-ship" inputmode="numeric" value="${st.shipFee}"></label>
      <label class="f">Free shipping above (₹, 0 = never)<input id="s-free" inputmode="numeric" value="${st.freeAbove}"></label></div>
    <p class="err" id="sf-err" role="alert"></p><div><button class="btn" type="submit">Save settings</button></div></form>`;
}

/* writes */
const fail = e => { console.error(e); if (e?.code === "permission-denied") { S.denied = true; render(); } else toast("Couldn't save. Check your connection and try again."); };
const timers = {};
function queueStock(id, val) {
  const p = prod(id); if (!p) return; p.stock = Math.max(0, val | 0); render();
  clearTimeout(timers[id]); timers[id] = setTimeout(() => S.store.updateProduct(id, { stock: p.stock }).catch(fail), 600);
}

document.addEventListener("click", async e => {
  const a = e.target.closest("[data-act]"); if (!a) return; const id = a.dataset.id;
  switch (a.dataset.act) {
    case "tab": S.tab = a.dataset.tab; S.confirm = null; if (S.tab === "add" && !S.editing) S.imgs = []; render(); break;
    case "edit": S.editing = id; S.imgs = [...(prod(id)?.images || [])]; S.tab = "add"; render(); scrollTo(0, 0); break;
    case "cancel-edit": S.editing = null; S.imgs = []; S.tab = "items"; render(); break;
    case "rmimg": S.imgs.splice(+a.dataset.i, 1); drawImgs(); break;
    case "stk": { const p = prod(id); if (p) queueStock(id, (p.stock | 0) + +a.dataset.d); break; }
    case "ask-del": S.confirm = id; render(); break;
    case "ask-samples": S.confirm = "__samples"; render(); break;
    case "cancel": S.confirm = null; render(); break;
    case "del": S.confirm = null; try { await S.store.deleteProduct(id); toast("Item deleted"); } catch (x) { fail(x); } break;
    case "rm-samples": S.confirm = null; for (const p of S.products.filter(p => p.sample)) { try { await S.store.deleteProduct(p.id); } catch (x) { fail(x); break; } } toast("Samples removed"); break;
    case "samples": for (const p of SAMPLE_PRODUCTS) { const { id: pid, ...data } = p; try { await S.store.saveProduct(pid, data); } catch (x) { fail(x); break; } } toast("Sample items added"); break;
    case "reset": { const em = $("#l-email").value.trim(); if (!em) { $("#l-err").textContent = "Type your email first, then tap Forgot password."; break; }
      try { await S.store.resetPassword(em); $("#l-err").textContent = ""; toast("Password reset email sent"); } catch { $("#l-err").textContent = "Couldn't send the reset email. Check the address."; } break; }
  }
});
document.addEventListener("change", e => {
  if (e.target.id === "p-files") { addFiles(e.target.files); e.target.value = ""; return; }
  const a = e.target.closest("[data-act]"); if (!a) return;
  if (a.dataset.act === "active") S.store.updateProduct(a.dataset.id, { active: a.checked }).catch(fail);
  if (a.dataset.act === "stkset") queueStock(a.dataset.id, num(a.value) ?? 0);
  if (a.dataset.act === "status") { a.disabled = true; S.store.setOrderStatus(a.dataset.id, a.value).then(() => toast(`Order ${a.dataset.id} marked ${a.value}`)).catch(x => { fail(x); render(); }); }
});
document.addEventListener("dragover", e => { const d = e.target.closest?.("#drop"); if (d) { e.preventDefault(); d.classList.add("on"); } });
document.addEventListener("dragleave", e => e.target.closest?.("#drop")?.classList.remove("on"));
document.addEventListener("drop", e => { const d = e.target.closest?.("#drop"); if (d) { e.preventDefault(); addFiles(e.dataTransfer.files); } });
$("#signout").addEventListener("click", () => S.store.signOut());

document.addEventListener("submit", async e => {
  e.preventDefault();
  if (e.target.id === "login") {
    const err = $("#l-err"), btn = $("#l-btn"); btn.disabled = true; btn.textContent = "Signing in…";
    try { await S.store.signIn($("#l-email").value.trim(), $("#l-pass").value); err.textContent = ""; }
    catch { err.textContent = "That email and password don't match a partner account."; }
    btn.disabled = false; btn.textContent = "Sign in";
  }
  if (e.target.id === "pf") {
    const err = $("#pf-err"); err.textContent = "";
    const name = $("#p-name").value.trim(), price = num($("#p-price").value), stock = num($("#p-stock").value), mrp = num($("#p-mrp").value);
    if (!name) return (err.textContent = "Give the item a name.");
    if (!price || price <= 0) return (err.textContent = "Enter a selling price in rupees.");
    if (stock === null || stock < 0) return (err.textContent = "Enter how many pieces you have (0 or more).");
    if (mrp && mrp < price) return (err.textContent = "MRP should be equal to or higher than the selling price.");
    const old = S.editing ? prod(S.editing) : null;
    const data = { name, category: $("#p-cat").value, finish: $("#p-finish").value.trim(), sku: $("#p-sku").value.trim(),
      price: Math.round(price), mrp: mrp ? Math.round(mrp) : 0, stock: Math.round(stock), weight: $("#p-weight").value.trim(), desc: $("#p-desc").value.trim(),
      images: [...S.imgs], active: old ? old.active !== false : true, sample: false, createdAt: old?.createdAt || Date.now() };
    const btn = $("#pf-btn"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      await S.store.saveProduct(S.editing || ("p" + Date.now().toString(36) + rid(3).toLowerCase()), data);
      toast(S.editing ? "Changes saved" : "Item added to the shop"); S.editing = null; S.imgs = []; S.tab = "items"; render();
    } catch (x) { btn.disabled = false; btn.textContent = "Try again"; if (x?.code === "permission-denied") return fail(x); err.textContent = "Couldn't save the item. Check your connection and try again."; }
  }
  if (e.target.id === "sf") {
    const st = { name: $("#s-name").value.trim() || "Ponmalar", tagline: $("#s-tag").value.trim(), whatsapp: $("#s-wa").value.trim(), upi: $("#s-upi").value.trim(),
      shipFee: num($("#s-ship").value) ?? 0, freeAbove: num($("#s-free").value) ?? 0 };
    try { await S.store.saveSettings(st); toast("Settings saved"); } catch (x) { if (x?.code === "permission-denied") return fail(x); $("#sf-err").textContent = "Couldn't save settings. Try again."; }
  }
});

/* boot */
render();
S.store = await createStore(); demoBar(S.store);
S.store.watchSettings(st => { S.settings = { ...DEFAULT_SETTINGS, ...(st || {}) }; renderData(); });
S.store.onAuth(u => {
  S.unsub.forEach(f => f()); S.unsub = []; S.user = u; S.denied = false;
  if (u) {
    S.unsub.push(S.store.watchProducts(l => { S.products = l; renderData(); }, fail));
    S.unsub.push(S.store.watchOrders(l => { S.orders = l; renderData(); }, fail));
  }
  render();
});
