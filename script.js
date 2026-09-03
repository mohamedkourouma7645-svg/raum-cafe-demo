// RAUM — comportement partagé du site (démo, sans backend)

// Service Worker : active le cache navigateur pour un chargement instantané au retour.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Menu mobile ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const navInner = document.querySelector('.nav-inner');
  if (toggle && navInner) {
    toggle.addEventListener('click', () => {
      const isOpen = navInner.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ---------- Sélecteur de taille (Normal / Groß) ---------- */
  document.querySelectorAll('.size-select').forEach((group) => {
    group.addEventListener('click', (event) => {
      const btn = event.target.closest('.size-btn');
      if (!btn || !group.contains(btn)) return;
      group.querySelectorAll('.size-btn').forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');

    });
  });

  /* ---------- Warenkorb : plusieurs plats, une seule commande à la validation ---------- */

  const WARENKORB_KEY = 'raum_warenkorb';
  const LETZTE_BESTELLUNG_KEY = 'raum_letzte_bestellung';
  const VERLAUF_KEY = 'raum_bestell_verlauf';

  function ladeWarenkorb() {
    try {
      return JSON.parse(sessionStorage.getItem(WARENKORB_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function speichereWarenkorb(items) {
    try {
      sessionStorage.setItem(WARENKORB_KEY, JSON.stringify(items));
    } catch (e) {
      /* sessionStorage nicht verfügbar (z. B. privater Modus) — der Warenkorb funktioniert
         dann nur für die aktuelle Seitenansicht, ohne Speicherung. */
    }
  }

  function formatPreis(zahl) {
    return zahl.toFixed(2).replace('.', ',') + ' €';
  }

  /* "Normal · 15,50 €" -> { label: "Normal", preis: 15.50 } */
  function parsePreisText(text) {
    const teile = text.split('·').map((t) => t.trim());
    const label = teile.length > 1 ? teile[0] : null;
    const preisText = teile[teile.length - 1];
    const preis = parseFloat(preisText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    return { label, preis };
  }

  function warenkorbAendereMenge(index, delta) {
    const items = ladeWarenkorb();
    if (!items[index]) return;
    items[index].menge += delta;
    if (items[index].menge <= 0) items.splice(index, 1);
    speichereWarenkorb(items);
    aktualisiereBestellBadge();
    renderCartPanel();
  }

  /* Lit le nom/taille/prix "actuels" d'un plat (taille sélectionnée pour les Donburi,
     prix fixe sinon) — utilisé à la fois par le sélecteur de quantité et par la
     synchronisation d'affichage quand on change de taille. */
  function infosPlat(orderMenu) {
    const row = orderMenu.closest('.menu-row');
    const name = orderMenu.getAttribute('data-dish-name') || '';
    let size = null;
    let preis = 0;
    const sizeSelect = row.querySelector('.size-select');
    if (sizeSelect) {
      const selected = sizeSelect.querySelector('.size-btn.selected') || sizeSelect.querySelector('.size-btn');
      const parsed = parsePreisText(selected.textContent);
      size = parsed.label;
      preis = parsed.preis;
    } else {
      const priceEl = row.querySelector('.price');
      if (priceEl) preis = parsePreisText(priceEl.textContent).preis;
    }
    return { name, size, preis };
  }

  /* Ajoute au panier le plat, à la quantité actuellement choisie dans son sélecteur
     +/- (min. 1 — le sélecteur n'affiche jamais 0, il indique "combien j'ajoute
     maintenant", pas "combien j'ai déjà dans le panier"). Remet le sélecteur à 1
     ensuite, prêt pour un prochain ajout. */
  function dishAddToCart(orderMenu) {
    const { name, size, preis } = infosPlat(orderMenu);
    const input = orderMenu.closest('.menu-row')?.querySelector('.dish-qty-value');
    if (!input) return;
    const min = parseInt(input.min, 10) || 1;
    let menge = parseInt(input.value, 10);
    if (isNaN(menge) || menge < min) menge = min;

    const items = ladeWarenkorb();
    const index = items.findIndex((i) => i.name === name && i.size === size);
    if (index !== -1) {
      items[index].menge += menge;
      items[index].preis = preis;
    } else {
      items.push({ name, size, preis, menge });
    }
    speichereWarenkorb(items);
    aktualisiereBestellBadge();

    const confirmEl = document.getElementById('cart-confirm');
    if (confirmEl) confirmEl.setAttribute('hidden', '');
    renderCartPanel();

    input.value = String(min);

    const addedEl = orderMenu.querySelector('.order-added');
    if (addedEl) {
      addedEl.textContent = menge > 1 ? '✓ ' + menge + '× zum Warenkorb hinzugefügt' : '✓ Zum Warenkorb hinzugefügt';
      addedEl.classList.add('show');
      window.clearTimeout(addedEl._timeout);
      addedEl._timeout = window.setTimeout(() => addedEl.classList.remove('show'), 2200);
    }
  }

  function resetAlleDishQty() {
    document.querySelectorAll('.dish-qty-value').forEach((input) => {
      input.value = input.min || '1';
    });
  }

  function warenkorbGesamt(items) {
    return items.reduce((summe, i) => summe + i.preis * i.menge, 0);
  }

  /* Erzeugt eine zufällige, innerhalb dieses Besuchs eindeutige Bestellnummer (Demo, kein Backend). */
  function erzeugeBestellnummer() {
    let verlauf = [];
    try {
      verlauf = JSON.parse(sessionStorage.getItem(VERLAUF_KEY) || '[]');
    } catch (e) {
      verlauf = [];
    }
    let nummer;
    do {
      nummer = Math.floor(1000 + Math.random() * 9000);
    } while (verlauf.includes(nummer));
    verlauf.push(nummer);
    try {
      sessionStorage.setItem(VERLAUF_KEY, JSON.stringify(verlauf));
      sessionStorage.setItem(LETZTE_BESTELLUNG_KEY, String(nummer));
    } catch (e) {
      /* sessionStorage nicht verfügbar (z. B. private Modus) — Nummer wird trotzdem angezeigt, nur nicht gemerkt. */
    }
    return nummer;
  }

  /* Zeigt das feste Badge unten rechts. Tant qu'aucune commande n'est validée, on
     n'affiche RIEN qui ressemble à un numéro — juste l'icône panier + le nombre
     d'articles (une simple quantité, pas un identifiant de commande). Le numéro de
     commande n'apparaît que dans l'état "Ihre Bestellung", après la validation. */
  function aktualisiereBestellBadge() {
    const badge = document.getElementById('order-badge');
    const countEl = document.getElementById('order-badge-count');
    const labelEl = document.getElementById('order-badge-label');
    const nummerEl = document.getElementById('order-badge-number');
    if (!badge || !nummerEl) return;

    const items = ladeWarenkorb();
    const anzahl = items.reduce((n, i) => n + i.menge, 0);

    if (anzahl > 0) {
      labelEl.textContent = 'Warenkorb ansehen';
      nummerEl.textContent = '';
      countEl.textContent = String(anzahl);
      countEl.removeAttribute('hidden');
      badge.removeAttribute('hidden');
      return;
    }

    let letzte = null;
    try {
      letzte = sessionStorage.getItem(LETZTE_BESTELLUNG_KEY);
    } catch (e) {
      letzte = null;
    }
    countEl.setAttribute('hidden', '');
    if (letzte) {
      labelEl.textContent = 'Ihre Bestellung';
      nummerEl.textContent = '#' + letzte;
      badge.removeAttribute('hidden');
    } else {
      badge.setAttribute('hidden', '');
    }
  }

  /* ---------- Panier : rendu du contenu ---------- */

  function renderCartPanel() {
    const itemsEl = document.getElementById('cart-items');
    const emptyEl = document.getElementById('cart-empty');
    const footerEl = document.getElementById('cart-footer');
    const confirmEl = document.getElementById('cart-confirm');
    const totalEl = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('cart-checkout');
    if (!itemsEl) return;

    // Une confirmation de commande est affichée : on ne touche pas au panier tant
    // qu'elle est visible (elle se referme au prochain ajout ou à la fermeture).
    if (confirmEl && !confirmEl.hasAttribute('hidden')) return;

    const items = ladeWarenkorb();

    if (items.length === 0) {
      itemsEl.innerHTML = '';
      emptyEl.removeAttribute('hidden');
      footerEl.setAttribute('hidden', '');
      return;
    }

    emptyEl.setAttribute('hidden', '');
    footerEl.removeAttribute('hidden');

    itemsEl.innerHTML = items
      .map((item, index) => {
        const sizeHtml = item.size ? '<span class="cart-item-size">' + item.size + '</span>' : '';
        return (
          '<li class="cart-item">' +
          '<div class="cart-item-info"><span class="cart-item-name">' + item.name + '</span>' + sizeHtml + '</div>' +
          '<div class="cart-item-qty">' +
          '<button type="button" class="cart-qty-btn" data-cart-action="dec" data-index="' + index + '" aria-label="Weniger">−</button>' +
          '<span>' + item.menge + '</span>' +
          '<button type="button" class="cart-qty-btn" data-cart-action="inc" data-index="' + index + '" aria-label="Mehr">+</button>' +
          '</div>' +
          '<span class="cart-item-price">' + formatPreis(item.preis * item.menge) + '</span>' +
          '</li>'
        );
      })
      .join('');

    totalEl.textContent = formatPreis(warenkorbGesamt(items));
    checkoutBtn.removeAttribute('disabled');
  }

  function oeffneCartPanel() {
    const scrim = document.getElementById('cart-scrim');
    const panel = document.getElementById('cart-panel');
    if (!panel || !scrim) return;
    renderCartPanel();
    scrim.removeAttribute('hidden');
    panel.removeAttribute('hidden');
    // Un reflow avant d'ajouter la classe : garantit que la transition CSS se joue
    // (sinon le navigateur peut fusionner "hidden retiré" et "show ajouté" en une frame).
    requestAnimationFrame(() => {
      scrim.classList.add('show');
      panel.classList.add('show');
    });
  }

  function schliesseCartPanel() {
    const scrim = document.getElementById('cart-scrim');
    const panel = document.getElementById('cart-panel');
    if (!panel || !scrim) return;
    scrim.classList.remove('show');
    panel.classList.remove('show');
    window.setTimeout(() => {
      scrim.setAttribute('hidden', '');
      panel.setAttribute('hidden', '');
    }, 350);
  }

  function checkoutWarenkorb() {
    const items = ladeWarenkorb();
    if (items.length === 0) return;

    const nummer = erzeugeBestellnummer();
    const anzahl = items.reduce((n, i) => n + i.menge, 0);
    const liste = items
      .map(
        (i) =>
          '<li class="cart-confirm-item">' +
          '<span class="cart-confirm-item-name">' + i.name + (i.size ? ' <span class="cart-confirm-item-size">(' + i.size + ')</span>' : '') + '</span>' +
          '<strong class="cart-confirm-item-qty">× ' + i.menge + '</strong>' +
          '</li>'
      )
      .join('');

    speichereWarenkorb([]);
    resetAlleDishQty();

    const confirmEl = document.getElementById('cart-confirm');
    const itemsEl = document.getElementById('cart-items');
    const emptyEl = document.getElementById('cart-empty');
    const footerEl = document.getElementById('cart-footer');

    itemsEl.innerHTML = '';
    emptyEl.setAttribute('hidden', '');
    footerEl.setAttribute('hidden', '');

    confirmEl.innerHTML =
      '<p class="cart-confirm-msg">Bestellung bestätigt — Nummer <strong>#' + nummer + '</strong><br>' +
      'Zeigen Sie diese Nummer an der Kasse.</p>' +
      '<p class="cart-confirm-list-label">' + anzahl + ' Artikel:</p>' +
      '<ul class="cart-confirm-list">' + liste + '</ul>' +
      '<div class="review-prompt" id="cart-review-prompt">' +
      '<p class="review-question">Hoffentlich hat es Ihnen geschmeckt! 😊</p>' +
      '<div class="review-emojis" role="group" aria-label="Wie war Ihr Essen?">' +
      '<button type="button" class="review-emoji" data-sentiment="happy" aria-label="Zufrieden">😊</button>' +
      '<button type="button" class="review-emoji" data-sentiment="neutral" aria-label="Geht so">😐</button>' +
      '<button type="button" class="review-emoji" data-sentiment="sad" aria-label="Enttäuscht">😞</button>' +
      '</div>' +
      '<div class="review-followup" hidden></div>' +
      '</div>';
    confirmEl.removeAttribute('hidden');

    aktualisiereBestellBadge();

    const reviewPrompt = document.getElementById('cart-review-prompt');
    if (reviewPrompt) {
      window.setTimeout(() => reviewPrompt.classList.add('show'), 1800);
    }
  }

  aktualisiereBestellBadge();

  // Couvre aussi la saisie directe au clavier dans le champ (pas seulement +/-) :
  // toujours un entier valide, jamais en dessous du minimum.
  document.addEventListener('change', (event) => {
    const input = event.target.closest('.dish-qty-value');
    if (!input) return;
    const min = parseInt(input.min, 10) || 1;
    let val = parseInt(input.value, 10);
    if (isNaN(val) || val < min) val = min;
    input.value = String(val);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const panel = document.getElementById('cart-panel');
      if (panel && !panel.hasAttribute('hidden')) schliesseCartPanel();
    }
  });

  document.addEventListener('click', (event) => {
    const dishQtyBtn = event.target.closest('.dish-qty-btn');
    if (dishQtyBtn) {
      const input = dishQtyBtn.closest('.dish-qty')?.querySelector('.dish-qty-value');
      if (!input) return;
      const min = parseInt(input.min, 10) || 1;
      const aktuelleMenge = parseInt(input.value, 10);
      const basis = isNaN(aktuelleMenge) ? min : aktuelleMenge;
      const delta = dishQtyBtn.getAttribute('data-qty-action') === 'inc' ? 1 : -1;
      input.value = String(Math.max(min, basis + delta));
      return;
    }

    const addBtn = event.target.closest('.dish-add-btn');
    if (addBtn) {
      const orderMenu = addBtn.closest('.order-menu');
      if (orderMenu) dishAddToCart(orderMenu);
      return;
    }

    if (event.target.closest('#order-badge')) {
      oeffneCartPanel();
      return;
    }
    if (event.target.closest('#cart-close') || event.target.closest('#cart-scrim')) {
      schliesseCartPanel();
      return;
    }
    if (event.target.closest('#cart-checkout')) {
      checkoutWarenkorb();
      return;
    }
    const qtyBtn = event.target.closest('.cart-qty-btn');
    if (qtyBtn) {
      const index = parseInt(qtyBtn.getAttribute('data-index'), 10);
      const delta = qtyBtn.getAttribute('data-cart-action') === 'inc' ? 1 : -1;
      warenkorbAendereMenge(index, delta);
      return;
    }

    /* ---------- Avis nach der Bestellung ---------- */
    const emojiBtn = event.target.closest('.review-emoji');
    if (emojiBtn) {
      const prompt = emojiBtn.closest('.review-prompt');
      const followup = prompt.querySelector('.review-followup');
      const sentiment = emojiBtn.getAttribute('data-sentiment');
      prompt.querySelectorAll('.review-emoji').forEach((b) => b.classList.remove('selected'));
      emojiBtn.classList.add('selected');

      if (sentiment === 'happy') {
        followup.innerHTML =
          '<p>Das freut uns sehr, danke!</p>' +
          '<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&query=RAUM+M%C3%BCnsterstra%C3%9Fe+11+40477+D%C3%BCsseldorf" target="_blank" rel="noopener">Google-Bewertung hinterlassen</a>';
      } else {
        followup.innerHTML =
          '<p>Danke für Ihr Feedback — sagen Sie uns, was nicht gepasst hat.</p>' +
          '<textarea rows="3" maxlength="500" placeholder="Ihre Rückmeldung …"></textarea>' +
          '<button type="button" class="btn btn-line review-send">Absenden</button>';
      }
      followup.removeAttribute('hidden');
      return;
    }

    const sendBtn = event.target.closest('.review-send');
    if (sendBtn) {
      const followup = sendBtn.closest('.review-followup');
      followup.innerHTML = '<p class="review-thanks">Danke, wir haben Ihre Rückmeldung erfasst.</p>';
    }
  });

  /* ---------- Révélation au scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  document.querySelectorAll('.reveal-stagger').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty('--i', i);
      child.classList.add('reveal');
    });
  });

  /* ---------- Validation de formulaire (inline, sans alert()) ---------- */
  function attachValidation(form) {
    if (!form) return;

    const showError = (field, message) => {
      field.setAttribute('aria-invalid', 'true');
      const errorEl = form.querySelector(`[data-error-for="${field.id}"]`);
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
      }
    };
    const clearError = (field) => {
      field.removeAttribute('aria-invalid');
      const errorEl = form.querySelector(`[data-error-for="${field.id}"]`);
      if (errorEl) errorEl.classList.remove('show');
    };

    form.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('input', () => clearError(field));
      field.addEventListener('blur', () => {
        if (field.hasAttribute('required') && !field.value.trim()) {
          showError(field, 'Dieses Feld wird benötigt.');
        } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          showError(field, 'Bitte eine gültige E-Mail-Adresse eingeben.');
        }
      });
    });

    return function validate() {
      let valid = true;
      form.querySelectorAll('input, textarea').forEach((field) => {
        if (field.hasAttribute('required') && !field.value.trim()) {
          showError(field, 'Dieses Feld wird benötigt.');
          valid = false;
        } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          showError(field, 'Bitte eine gültige E-Mail-Adresse eingeben.');
          valid = false;
        } else {
          clearError(field);
        }
      });
      return valid;
    };
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const validate = attachValidation(contactForm);
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validate()) return;
      const name = document.getElementById('contact-name').value.trim();
      const confirmation = document.getElementById('contact-confirmation');
      confirmation.textContent = `Danke, ${name}. Ihre Nachricht wurde erfasst. Demo — es wird aktuell nichts versendet.`;
      confirmation.classList.add('show');
      contactForm.reset();
    });
  }
});
