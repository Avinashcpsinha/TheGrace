# The Grace — Owner's Guide (1 page)

*How to run your shop, no technical knowledge needed.*

## Logging in

Open **yoursite.com/admin** → enter the admin password (initially `grace-admin-2026`;
ask your developer to change it in the `.env.local` file).

## When an order arrives

You'll see it on the **Dashboard** and under **Orders** (newest first). If you configured email,
you also get a notification at info@thegrace.co.in. Each order shows the customer's name, phone,
items with engraving text, address and GSTIN.

1. Call or WhatsApp the customer to confirm details (their phone number is right there).
2. As work progresses, change the **status dropdown** on the order row:
   **New → Confirmed → In production → Shipped → Delivered.**
   The customer sees this live on the *Track Order* page using their order ID.
3. "Order via WhatsApp" orders are saved too — the customer's WhatsApp message references the
   same order ID.

## Changing prices, stock and visibility

**Admin → Products.** Click a price to edit it. Toggle **In stock**, **Featured** (shows on the
homepage), **Premium** (moves it between the Premium/Standard collections) or **Hidden** (removes
it from the shop). Changes appear on the site immediately — a gold dot marks anything you've
edited, with a *reset* button to undo.

## Adding new products (photos)

1. Copy the photos into the right folder inside `public/New products/` on the server
   (e.g. `public/New products/Trophies/`). The six folders there — Trophies, Merchandise,
   Gifting, Medals, Momentos, Sports — are exactly the categories in the shop menu.
   **Name the file what you want the product called** — `Golden-Lotus-Cup.jpeg` becomes
   "Golden Lotus Cup". Shoot on a plain white background: the site automatically cuts the
   background out and places the piece on black.
2. Ask your developer to run: `npm run ingest` then `npm run build` (or do it yourself —
   two commands in the project folder).
3. Set the price in **Admin → Products**.

## Customization requests

**Admin → Requests** lists every customization form submission (with uploaded logos saved in the
`data/uploads` folder). Use the **WhatsApp reply** button to respond instantly, then mark the
request *Quoted* or *Closed*.

## Customer enquiries

Contact-page messages are saved in `data/enquiries.json`. Orders, requests and your product edits
all live in the `data/` folder — **back up this folder regularly** (copy it anywhere safe).

## Payments

- Without Razorpay keys, customers order via **WhatsApp or Cash on Delivery** (you confirm by phone).
- To accept online payments (UPI/cards/netbanking): create an account at razorpay.com, copy the
  **Key ID** and **Key Secret** into `.env.local`
  (`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`), restart the site.
- To turn Cash on Delivery off: set `NEXT_PUBLIC_COD_ENABLED=false`.

*That's everything. If something looks wrong, restart the site first; if it persists, send your
developer the contents of the `data/` folder and a screenshot.*
