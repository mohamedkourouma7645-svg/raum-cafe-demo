// RAUM — initialisation Firebase partagée (site public + tableau de bord privé).
// Config publique par nature (SDK client) : la protection réelle se fait via les
// règles de sécurité Firestore, pas en cachant ces valeurs.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAzoXLMr7aRm9iDTV_dDWVUSsEiopQflEM',
  authDomain: 'raum-cafe.firebaseapp.com',
  projectId: 'raum-cafe',
  storageBucket: 'raum-cafe.firebasestorage.app',
  messagingSenderId: '754953714917',
  appId: '1:754953714917:web:f086ae601f841cb31ae80c',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
