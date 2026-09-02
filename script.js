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

  /* ---------- Bestellen : Vor Ort / Uber Eats ---------- */

  /* Erzeugt eine zufällige, innerhalb dieses Besuchs eindeutige Bestellnummer (Demo, kein Backend). */
  function erzeugeBestellnummer() {
    let verlauf = [];
    try {
      verlauf = JSON.parse(sessionStorage.getItem('raum_bestell_verlauf') || '[]');
    } catch (e) {
      verlauf = [];
    }
    let nummer;
    do {
      nummer = Math.floor(1000 + Math.random() * 9000);
    } while (verlauf.includes(nummer));
    verlauf.push(nummer);
    try {
      sessionStorage.setItem('raum_bestell_verlauf', JSON.stringify(verlauf));
      sessionStorage.setItem('raum_letzte_bestellung', String(nummer));
    } catch (e) {
      /* sessionStorage nicht verfügbar (z. B. private Modus) — Nummer wird trotzdem angezeigt, nur nicht gemerkt. */
    }
    return nummer;
  }

  /* Zeigt das feste Bestell-Badge unten rechts, falls eine Bestellung in diesem Besuch existiert. */
  function aktualisiereBestellBadge() {
    const badge = document.getElementById('order-badge');
    const nummerEl = document.getElementById('order-badge-number');
    if (!badge || !nummerEl) return;
    let letzte = null;
    try {
      letzte = sessionStorage.getItem('raum_letzte_bestellung');
    } catch (e) {
      letzte = null;
    }
    if (letzte) {
      nummerEl.textContent = '#' + letzte;
      badge.removeAttribute('hidden');
    } else {
      badge.setAttribute('hidden', '');
    }
  }

  aktualisiereBestellBadge();

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.order-toggle');
    if (toggle) {
      const menu = toggle.closest('.order-menu');
      const options = menu.querySelector('.order-options');
      const isOpen = !options.hasAttribute('hidden');
      document.querySelectorAll('.order-options').forEach((el) => el.setAttribute('hidden', ''));
      document.querySelectorAll('.order-toggle').forEach((el) => el.setAttribute('aria-expanded', 'false'));
      if (!isOpen) {
        options.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    const vorOrt = event.target.closest('.order-option[data-mode="vor-ort"]');
    if (vorOrt) {
      const menu = vorOrt.closest('.order-menu');
      const confirmEl = menu.querySelector('.order-confirm');
      const reviewPrompt = menu.querySelector('.review-prompt');
      const nummer = erzeugeBestellnummer();
      if (confirmEl) {
        confirmEl.innerHTML =
          'Bestellung bestätigt — Nummer <strong>#' + nummer + '</strong><br>Zeigen Sie diese Nummer an der Kasse.';
        confirmEl.classList.add('show');
      }
      aktualisiereBestellBadge();
      if (reviewPrompt) {
        window.setTimeout(() => reviewPrompt.classList.add('show'), 1800);
      }
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
