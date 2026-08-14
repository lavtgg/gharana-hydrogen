/* =========================================================================
   Gharana Theme JS — Cart AJAX, Steppers, Toast, Location.
   No frameworks. Vanilla + tiny helpers.
   ========================================================================= */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const routes = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  const state = { cart: null, pendingKeys: new Set(), listeners: new Set() };

  // -------- Money formatting (INR) --------
  function formatMoney(cents) {
    const v = (cents / 100).toFixed(0);
    return '₹' + v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // -------- Cart API --------
  async function fetchCart() {
    const res = await fetch(`${routes}cart.js`, { credentials: 'same-origin' });
    const cart = await res.json();
    state.cart = cart;
    notify();
    return cart;
  }
  async function addItem({ id, quantity = 1, properties = {} }) {
    const res = await fetch(`${routes}cart/add.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [{ id, quantity, properties }] })
    });
    if (!res.ok) throw new Error((await res.json()).description || 'Add failed');
    return fetchCart();
  }
  async function updateItemQty(key, quantity) {
    const res = await fetch(`${routes}cart/change.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity })
    });
    state.cart = await res.json();
    notify();
    return state.cart;
  }

  function notify() {
    state.listeners.forEach(fn => { try { fn(state.cart); } catch(e){ console.warn(e); } });
    window.gharana.cart = state.cart;
    updateFloatingCart();
    updateCartBadges();
    document.dispatchEvent(new CustomEvent('gharana:cart', { detail: state.cart }));
  }
  function onCart(fn) { state.listeners.add(fn); if (state.cart) fn(state.cart); }

  function findLine(variantId) {
    if (!state.cart) return null;
    return state.cart.items.find(i => String(i.variant_id) === String(variantId)) || null;
  }
  function itemCount() { return state.cart ? state.cart.item_count : 0; }

  // -------- Toast --------
  let toastEl = null;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<span class="icon"><svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>${text}</span>`;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('is-visible'), 1800);
  }

  // -------- Floating cart bar --------
  function updateFloatingCart() {
    const bar = document.getElementById('floating-cart');
    if (!bar) return;
    const count = itemCount();
    if (count > 0) {
      bar.classList.add('is-visible');
      const countEl = bar.querySelector('[data-cart-count]');
      const totalEl = bar.querySelector('[data-cart-total]');
      if (countEl) countEl.textContent = count + ' item' + (count === 1 ? '' : 's');
      if (totalEl) totalEl.textContent = formatMoney(state.cart.total_price);
    } else {
      bar.classList.remove('is-visible');
    }
  }
  function updateCartBadges() {
    const count = itemCount();
    $$('[data-cart-badge]').forEach(el => {
      if (count > 0) { el.textContent = count > 99 ? '99+' : count; el.style.display = ''; }
      else { el.style.display = 'none'; }
    });
  }

  // -------- Product card add / stepper --------
  function initProductCardActions(root = document) {
    $$('[data-add-to-cart]', root).forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        const variantId = this.getAttribute('data-variant-id');
        if (!variantId) return;
        const container = this.closest('[data-product-card]') || this.closest('[data-product-actions]');
        try {
          this.disabled = true;
          await addItem({ id: variantId });
          toast('Added to basket');
          renderCardActions(container, variantId);
        } catch (err) {
          toast(err.message || 'Could not add');
        } finally {
          this.disabled = false;
        }
      });
    });

    $$('[data-stepper]', root).forEach(step => {
      if (step._bound) return;
      step._bound = true;
      const variantId = step.getAttribute('data-variant-id');
      const dec = step.querySelector('[data-dec]');
      const inc = step.querySelector('[data-inc]');
      const bump = async (delta) => {
        const line = findLine(variantId);
        if (!line) { await addItem({ id: variantId }); return; }
        const newQty = Math.max(0, line.quantity + delta);
        await updateItemQty(line.key, newQty);
        renderCardActions(step.closest('[data-product-card]') || step.closest('[data-product-actions]'), variantId);
      };
      dec && dec.addEventListener('click', (e) => { e.preventDefault(); bump(-1); });
      inc && inc.addEventListener('click', (e) => { e.preventDefault(); bump(1); });
    });
  }

  function renderCardActions(container, variantId) {
    if (!container) return;
    const line = findLine(variantId);
    const qty = line ? line.quantity : 0;
    const addBtn = container.querySelector('[data-add-to-cart]');
    const stepper = container.querySelector('[data-stepper]');
    if (!addBtn || !stepper) return;
    if (qty > 0) {
      addBtn.style.display = 'none';
      stepper.style.display = 'flex';
      const q = stepper.querySelector('[data-qty]');
      if (q) q.textContent = qty;
    } else {
      addBtn.style.display = '';
      stepper.style.display = 'none';
    }
  }

  function refreshAllCardActions() {
    $$('[data-product-actions]').forEach(container => {
      const btn = container.querySelector('[data-add-to-cart]');
      if (!btn) return;
      const vId = btn.getAttribute('data-variant-id');
      renderCardActions(container, vId);
    });
  }

  // -------- Cart page live updates --------
  function initCartPage() {
    const grid = document.querySelector('[data-cart-lines]');
    if (!grid) return;
    grid.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-cart-line-key]');
      if (!target) return;
      const key = target.getAttribute('data-cart-line-key');
      const action = target.getAttribute('data-action');
      const line = state.cart && state.cart.items.find(i => i.key === key);
      const currentQty = line ? line.quantity : 0;
      let newQty = currentQty;
      if (action === 'inc') newQty = currentQty + 1;
      else if (action === 'dec') newQty = Math.max(0, currentQty - 1);
      else if (action === 'remove') newQty = 0;
      else return;
      e.preventDefault();
      target.disabled = true;
      await updateItemQty(key, newQty);
      // Re-render cart page
      window.location.reload();
    });
  }

  // -------- Mobile promo/rail scroll enhancement --------
  function initHorizontalScrolls() {
    $$('.promo-scroll, .product-rail').forEach(rail => {
      // Prevent accidental vertical drag
      let downX = 0, scroll = 0;
      rail.addEventListener('pointerdown', (e) => { downX = e.clientX; scroll = rail.scrollLeft; });
    });
  }

  // -------- Location prompt (mobile top bar) --------
  function initLocationSelector() {
    const el = document.querySelector('[data-location-btn]');
    if (!el) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const current = el.querySelector('.loc-text').textContent;
      const next = prompt('Enter your pincode or area:', current);
      if (next && next.trim()) {
        localStorage.setItem('gharana:location', next.trim());
        el.querySelector('.loc-text').textContent = next.trim();
        toast('Delivery location updated');
      }
    });
    const saved = localStorage.getItem('gharana:location');
    if (saved) el.querySelector('.loc-text').textContent = saved;
  }

  // -------- Product page: variant + gallery --------
  function initProductPage() {
    const page = document.querySelector('[data-product-page]');
    if (!page) return;
    const productJson = JSON.parse(page.getAttribute('data-product') || '{}');
    const pills = $$('.variant-pill', page);
    const priceNow = page.querySelector('[data-price-now]');
    const priceWas = page.querySelector('[data-price-was]');
    const priceSave = page.querySelector('[data-price-save]');
    const cta = page.querySelector('[data-buy-cta]');
    const addBtn = page.querySelector('[data-product-add]');
    const gallery = page.querySelector('[data-gallery-main]');
    const thumbs = $$('[data-gallery-thumb]', page);

    function selectVariant(variantId) {
      pills.forEach(p => p.classList.toggle('is-selected', p.getAttribute('data-variant-id') === String(variantId)));
      const v = productJson.variants && productJson.variants.find(v => String(v.id) === String(variantId));
      if (!v) return;
      priceNow && (priceNow.textContent = formatMoney(v.price));
      if (priceWas && v.compare_at_price && v.compare_at_price > v.price) {
        priceWas.textContent = formatMoney(v.compare_at_price);
        priceWas.style.display = '';
        const pct = Math.round(100 * (v.compare_at_price - v.price) / v.compare_at_price);
        if (priceSave) { priceSave.textContent = `Save ${pct}%`; priceSave.style.display = ''; }
      } else {
        priceWas && (priceWas.style.display = 'none');
        priceSave && (priceSave.style.display = 'none');
      }
      if (addBtn) addBtn.setAttribute('data-variant-id', v.id);
      if (cta) cta.setAttribute('data-variant-id', v.id);
      // Update URL param
      const u = new URL(window.location.href);
      u.searchParams.set('variant', v.id);
      history.replaceState({}, '', u);
      // Featured image swap
      if (gallery && v.featured_image && v.featured_image.src) {
        gallery.querySelector('img').src = v.featured_image.src;
      }
    }

    pills.forEach(p => p.addEventListener('click', () => selectVariant(p.getAttribute('data-variant-id'))));
    thumbs.forEach((t, i) => t.addEventListener('click', () => {
      thumbs.forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
      const src = t.getAttribute('data-src');
      if (gallery && src) gallery.querySelector('img').src = src;
    }));

    if (addBtn) {
      addBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const vId = addBtn.getAttribute('data-variant-id');
        try { addBtn.disabled = true; await addItem({ id: vId }); toast('Added to basket'); }
        catch (err) { toast(err.message || 'Could not add'); }
        finally { addBtn.disabled = false; }
      });
    }
    if (cta) {
      cta.addEventListener('click', async (e) => {
        e.preventDefault();
        const vId = cta.getAttribute('data-variant-id');
        try { await addItem({ id: vId }); window.location.href = '/checkout'; }
        catch (err) { toast(err.message || 'Could not proceed'); }
      });
    }
  }

  // -------- Init --------
  function boot() {
    fetchCart().then(() => { refreshAllCardActions(); }).catch(() => {});
    initProductCardActions();
    initCartPage();
    initHorizontalScrolls();
    initLocationSelector();
    initProductPage();

    // Re-init on section reload (theme editor)
    document.addEventListener('shopify:section:load', (e) => {
      initProductCardActions(e.target);
      refreshAllCardActions();
    });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);

  // Expose
  window.gharanaCart = { fetchCart, addItem, updateItemQty, onCart, formatMoney };
})();
