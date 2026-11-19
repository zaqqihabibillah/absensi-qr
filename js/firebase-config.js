// 1. Buat Firebase Web App, lalu salin konfigurasi dari Firebase Console.
// 2. Isi nilai di bawah ini. Firebase Web API key bukan password; keamanan utama
//    tetap harus ditegakkan melalui Authentication dan Firestore Security Rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyBeEIyEc_vimMO_s7jAIoWdybSp021QaXk",
    authDomain: "bksmp-a90e2.firebaseapp.com",
    projectId: "bksmp-a90e2",
    storageBucket: "bksmp-a90e2.firebasestorage.app",
    messagingSenderId: "599365529685",
    appId: "1:599365529685:web:5841f586dd4bfa0663e4dc",
    measurementId: "G-7JYNTEC0JK"
};

if (Object.values(firebaseConfig).some(value => value.startsWith("GANTI_"))) {
  console.warn("Konfigurasi Firebase belum diisi. Lengkapi js/firebase-config.js.");
}
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
