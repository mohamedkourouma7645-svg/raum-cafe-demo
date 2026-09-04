// RAUM — envoie chaque commande validée vers Firestore pour le tableau de bord vendeur
// privé (dashboard.html). Purement additif : si Firebase est injoignable (offline,
// bloqueur de pub, etc.), la commande reste valable côté client comme avant — on échoue
// silencieusement, sans jamais bloquer l'affichage du numéro au client.

import { db } from './firebase-init.js';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

window.RAUM_ORDER_SYNC = {
  async sendOrder({ nummer, items, gesamt }) {
    try {
      await addDoc(collection(db, 'orders'), {
        nummer,
        items: items.map((i) => ({
          name: i.name,
          size: i.size || null,
          preis: i.preis,
          menge: i.menge,
        })),
        gesamt,
        status: 'neu',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      /* silencieux — voir commentaire en tête de fichier */
    }
  },
};
