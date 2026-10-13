# Ponmalar 1 Gram Gold — online store

A complete online shop for 1 gram gold jewellery with two parts:

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Customers | Browse by category, search, view photos, add to bag, checkout (Cash on delivery / UPI), track orders |
| `partner.html` | Business partner | Sign in, add items with up to 3 photos, set price, MRP and quantity, change stock, see orders, confirm/ship/deliver, shop settings |

No build step and no server code. It is plain HTML, CSS and JavaScript, so it runs on **GitHub Pages** for free. Data (items, stock, orders) and partner login use **Firebase** on the free Spark plan.

Until you add your Firebase keys, the site runs in **demo mode**: it works fully, but data is saved only in the browser you're using. Use this to try it out.

---

## 1. Put it on GitHub Pages

1. Create a new repository on GitHub, for example `ponmalar-store` (Public).
2. Upload everything in this folder (keep the `assets` folder and the `.nojekyll` file):
   - On github.com: **Add file → Upload files**, drag the files in, **Commit changes**.
   - Or from a terminal:
     ```bash
     cd ponmalar-store
     git init
     git add .
     git commit -m "Ponmalar store"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/ponmalar-store.git
     git push -u origin main
     ```
3. In the repository: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. After about a minute your shop is live at
   `https://YOUR-USERNAME.github.io/ponmalar-store/`
   and the partner dashboard at `.../ponmalar-store/partner.html`.

## 2. Connect Firebase (makes it a real shared shop)

1. Go to <https://console.firebase.google.com> → **Add project** (Google Analytics is optional).
2. **Build → Firestore Database → Create database** → choose region `asia-south1 (Mumbai)` → start in **production mode**.
3. **Build → Authentication → Get started → Email/Password → Enable**.
   Then open the **Users** tab → **Add user** → enter the partner's email and a password.
   Add one user for each business partner.
4. **Project settings (gear icon) → General → Your apps → Web (`</>`)** → register the app → copy the `firebaseConfig` values into `assets/firebase-config.js`.
5. **Firestore Database → Rules** → paste the contents of `firestore.rules`, replace `partner@example.com` with your partner email(s) (lowercase, comma separated, in quotes) → **Publish**.
6. **Authentication → Settings → Authorized domains → Add domain** → `YOUR-USERNAME.github.io`.
7. Commit the updated `firebase-config.js` to GitHub. The demo banner disappears.

The Firebase web keys are meant to be public; it's safe to commit them. Your data is protected by the rules from step 5: anyone can read items and place an order, but only signed-in partner emails can add items, change stock or see all orders.

## 3. First things to do as the partner

1. Open `partner.html` and sign in.
2. **Shop settings**: shop name, headline, WhatsApp number, UPI ID, shipping fee and the free-shipping amount.
3. **Add item**: photos, name, category, price, MRP, quantity. It shows in the shop straight away.
   (On a new shop you can tap **Load 6 sample items** to preview the look, then **Remove samples**.)
4. When an order comes in, set its status to **confirmed**. The pieces are taken off stock automatically. Setting it back to **placed** or **cancelled** puts them back.

## How the pieces fit

```
index.html          customer storefront
partner.html        partner dashboard
assets/styles.css   all styling (light and dark theme)
assets/common.js    shared helpers, jewellery illustrations, data layer (Firebase or demo)
assets/shop.js      storefront logic
assets/partner.js   dashboard logic
assets/firebase-config.js   your Firebase keys
firestore.rules     database security rules to paste into Firebase
```

Firestore collections: `products/{id}`, `store/settings`, `orders/{orderNumber}`.
Photos are resized in the browser (max 900px, about 75 KB each) and stored with the item, so you don't need Firebase Storage or a paid plan.

## Good to know

- **Payments**: checkout supports Cash on delivery and UPI (customer pays your UPI ID and quotes the order number; the "Open UPI app" button works on phones). For automatic card/UPI payment confirmation, add a payment gateway such as Razorpay later. That needs a small server function (Firebase Cloud Functions, Blaze plan) to verify payments.
- **Customer "My orders"** remembers orders placed on that device. Customers can also look up any order by its order number.
- **Your own domain**: in GitHub **Settings → Pages → Custom domain**, then add that domain to Firebase Authorized domains too.
- **Free plan limits** (Firestore Spark): 50,000 reads and 20,000 writes per day, which is plenty for a small shop.
