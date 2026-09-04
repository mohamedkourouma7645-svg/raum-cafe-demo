// RAUM — tableau de bord vendeur : écoute Firestore en temps réel et affiche les
// commandes en cours (page privée, jamais liée depuis le site public).

import { db, auth } from './firebase-init.js';
import {
  signInAnonymously,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const statusEl = document.getElementById('dash-status');
const statusTextEl = document.getElementById('dash-status-text');
const ordersEl = document.getElementById('dash-orders');
const emptyEl = document.getElementById('dash-empty');

const bekannteIds = new Set();

function setStatus(state, text) {
  statusEl.classList.remove('is-live', 'is-error');
  if (state) statusEl.classList.add(state);
  statusTextEl.textContent = text;
}

function formatUhrzeit(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '—:—';
  return timestamp.toDate().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function renderOrder(orderDoc) {
  const data = orderDoc.data();
  const istNeuAngekommen = !bekannteIds.has(orderDoc.id);
  bekannteIds.add(orderDoc.id);

  const li = document.createElement('li');
  li.className = 'dash-order' + (istNeuAngekommen ? ' is-new' : '');
  li.dataset.id = orderDoc.id;

  const items = Array.isArray(data.items) ? data.items : [];
  const itemsHtml = items
    .map(
      (i) =>
        '<li class="dash-order-item">' +
        '<span class="dash-order-item-name">' +
        escapeHtml(i.name || '') +
        (i.size ? ' <span class="dash-order-item-size">(' + escapeHtml(i.size) + ')</span>' : '') +
        '</span>' +
        '<span class="dash-order-item-qty">× ' + i.menge + '</span>' +
        '</li>'
    )
    .join('');

  li.innerHTML =
    '<div class="dash-order-top">' +
    '<span class="dash-order-number">#' + data.nummer + '</span>' +
    '<span class="dash-order-time">' + formatUhrzeit(data.createdAt) + '</span>' +
    '</div>' +
    '<ul class="dash-order-items">' + itemsHtml + '</ul>' +
    '<button type="button" class="dash-order-done" data-id="' + orderDoc.id + '">Erledigt</button>';

  return li;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function startListening() {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));

  onSnapshot(
    q,
    (snapshot) => {
      setStatus('is-live', 'Live');

      const offen = snapshot.docs.filter((d) => d.data().status === 'neu').reverse();

      ordersEl.innerHTML = '';
      offen.forEach((orderDoc) => ordersEl.appendChild(renderOrder(orderDoc)));

      emptyEl.hidden = offen.length > 0;
      ordersEl.hidden = offen.length === 0;
    },
    (err) => {
      console.error('onSnapshot error:', err.code, err.message);
      setStatus('is-error', 'Verbindung unterbrochen');
    },
  );
}

ordersEl.addEventListener('click', async (event) => {
  const btn = event.target.closest('.dash-order-done');
  if (!btn) return;
  btn.disabled = true;
  try {
    await updateDoc(doc(db, 'orders', btn.dataset.id), { status: 'erledigt' });
  } catch (e) {
    btn.disabled = false;
  }
});

setStatus(null, 'Verbindung…');

onAuthStateChanged(auth, (user) => {
  if (user) startListening();
});

signInAnonymously(auth).catch((err) => {
  console.error('signInAnonymously error:', err);
  setStatus('is-error', 'Anmeldung fehlgeschlagen');
});
