// 1. Buat Firebase Web App, lalu salin konfigurasi dari Firebase Console.
// 2. Isi nilai di bawah ini. Firebase Web API key bukan password; keamanan utama
//    tetap harus ditegakkan melalui Authentication dan Firestore Security Rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
  messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

if (Object.values(firebaseConfig).some(value => value.startsWith("GANTI_"))) {
  console.warn("Konfigurasi Firebase belum diisi. Lengkapi js/firebase-config.js.");
}
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
