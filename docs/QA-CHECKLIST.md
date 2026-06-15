# QA Checklist — The Grace

Run before every release. Desktop = Chrome, Firefox, Edge, Safari. Mobile = iOS Safari + Android Chrome.

## The Book (homepage hero)
- [ ] Page loads to a centered closed book: leather cover, gold "THE GRACE", glowing trophy emblem, floating particles, breathing motion, "Scroll to open" cue
- [ ] Scrolling opens the cover smoothly, **scrubbed to scroll** (scrolling back re-closes it)
- [ ] Camera dollies in as the book opens; pages show gutter shadow + paper texture
- [ ] Open spread: left = hero trophy + "Premium Trophies"; right = collage + "Standard Trophies"
- [ ] Hovering either page lifts it with gold glow + "View Collection →"; clicking navigates to /premium and /standard
- [ ] Continue scrolling: book scales/fades away, homepage sections take over, glass header slides in
- [ ] **60 fps check**: DevTools → Performance → record the open/close scrub — no long frames (>16ms) from layout/paint; only `transform`/`opacity` compositor work
- [ ] "Open the book" button (keyboard/AT users) jumps to the open state
- [ ] OS "reduce motion" ON → static elegant spread, no pin, no particles; header visible
- [ ] Mobile: lighter book still scroll-driven, no jank on a mid-range phone; no horizontal overflow; URL-bar collapse doesn't jump the stage (svh)

## Commerce
- [ ] Product page: size changes price; qty changes bulk tier highlight + live total; engraving text survives to cart, checkout and the WhatsApp message
- [ ] **WhatsApp ordering**: PDP button opens wa.me with product, SKU, size, qty, price, URL; cart button lists every line; floating Order Now expands to Call / Email / WhatsApp on every page
- [ ] Add to cart → toast; cart badge animates; cart persists after refresh; wishlist persists
- [ ] Checkout validation (phone 10-digit, pincode 6-digit); saved address reuse works; GSTIN accepted
- [ ] COD order → confirmation page with copyable order ID; appears in /admin/orders; /track-order shows timeline; admin status change reflects in tracking
- [ ] Razorpay (test keys): payment completes → status "paid"; dismissing the modal leaves a recoverable order
- [ ] Customization form: validation, logo upload (≤4MB), success ref + WhatsApp follow-up; appears in /admin/requests
- [ ] Admin: login/logout, password rejected when wrong; price/stock/hidden edits reflect on the storefront

## Quality bars
- [ ] Lighthouse (mobile, Fast 4G): Performance ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95; LCP < 2.5s (cover text/emblem is the LCP, not an image fetch)
- [ ] Keyboard-only pass: book → header → search (Ctrl+K) → PDP → cart → checkout submit; visible focus everywhere; search overlay & mobile menu trap focus, ESC closes
- [ ] Screen reader spot-check: product cards announce name+price; toasts announced (aria-live); FAB announces expanded state
- [ ] `/sitemap.xml` lists all products; `/robots.txt` blocks /admin + /api; PDP has Product JSON-LD (validate with Rich Results test); OG card renders (share preview)
- [ ] 404 page elegant; /category/mementos (empty) shows made-to-order panel, not a broken grid
- [ ] No console errors on any page; no 404s in the Network tab; images all WebP with blur-up
- [ ] iOS Safari: glass header blur renders; momentum scroll doesn't desync the book scrub; tel:/wa.me links open correctly
