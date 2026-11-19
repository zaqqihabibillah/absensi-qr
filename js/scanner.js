import { auth, db, $, requireAuth, logout, localDate, localTime, attendanceId, doc, getDoc, getDocs, collection, query, where, runTransaction, serverTimestamp, escapeHtml } from "./app.js";
const user = await requireAuth();
$("#logout-button").addEventListener("click", logout);
const today = localDate();
$("#today-label").textContent = new Intl.DateTimeFormat("id-ID", { dateStyle:"full", timeZone:"Asia/Jakarta" }).format(new Date());
$("#result-date").textContent = today;
let scanner = null, running = false, lastScan = "", lastScanAt = 0, busy = false;
const showResult = (kind, title, detail, time = localTime()) => {
  $("#scan-icon").textContent = kind === "success" ? "✓" : kind === "warning" ? "!" : "×";
  $("#scan-icon").className = `result-icon ${kind}`;
  $("#scan-title").textContent = title; $("#scan-detail").textContent = detail; $("#result-time").textContent = time;
};
async function refreshToday() {
  const q = query(collection(db,"absensi"), where("tanggal","==",today));
  const snap = await getDocs(q);
  const recent = snap.docs.map(d => d.data()).sort((a,b) => String(b.waktu||"").localeCompare(String(a.waktu||""))).slice(0,8);
  $("#today-count").textContent = snap.size;
  $("#recent-body").innerHTML = recent.length === 0 ? '<tr><td colspan="5" class="empty">Belum ada presensi hari ini.</td></tr>' : recent.map(a => {
    return `<tr><td>${escapeHtml(a.waktu)}</td><td>${escapeHtml(a.nisn)}</td><td>${escapeHtml(a.nama)}</td><td>${escapeHtml(a.kelas)}</td><td><span class="status hadir">${escapeHtml(a.status)}</span></td></tr>`;
  }).join("");
}
async function processQr(decodedText) {
  const nisn = decodedText.trim();
  if (!/^\d{10}$/.test(nisn)) { showResult("error","QR tidak valid","QR harus berisi NISN 10 digit."); return; }
  const now = Date.now();
  if (busy || (nisn === lastScan && now - lastScanAt < 2000)) return;
  busy = true; lastScan = nisn; lastScanAt = now;
  try {
    const studentRef = doc(db,"siswa",nisn), studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists() || studentSnap.data().aktif !== true) {
      showResult("error","QR tidak terdaftar","NISN tidak ditemukan atau siswa tidak aktif."); return;
    }
    const student = studentSnap.data(), date = localDate(), time = localTime(), recordRef = doc(db,"absensi",attendanceId(date,nisn));
    const outcome = await runTransaction(db, async tx => {
      const existing = await tx.get(recordRef);
      if (existing.exists()) return { duplicate:true, record:existing.data() };
      tx.set(recordRef,{ nisn, nama:student.nama, kelas:student.kelas, tanggal:date, waktu:time, status:"Hadir", pencatat:user.email || user.uid, createdAt:serverTimestamp() });
      return { duplicate:false };
    });
    if (outcome.duplicate) showResult("warning",`${student.nama} sudah absen`, `Tercatat pukul ${outcome.record.waktu}. Data lama tidak diubah.`, outcome.record.waktu);
    else {
      showResult("success",`Hadir: ${student.nama}`,`${student.kelas} · NISN ${nisn}`);
      try { const AudioCtx = window.AudioContext || window.webkitAudioContext; if (AudioCtx) { const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value=880; gain.gain.value=0.08; osc.start(); osc.stop(ctx.currentTime+0.12); osc.onended=()=>ctx.close(); } } catch {}
      await refreshToday();
    }
  } catch (error) {
    console.error(error); showResult("error","Gagal menyimpan","Periksa koneksi internet dan aturan akses Firestore.");
  } finally { setTimeout(() => { busy=false; }, 900); }
}
$("#start-scan").addEventListener("click", async () => {
  if (running) return;
  try {
    scanner = new Html5Qrcode("reader");
    await scanner.start({ facingMode:"environment" }, { fps:12, qrbox:{ width:240, height:240 }, aspectRatio:1 }, processQr, () => {});
    running=true; $("#start-scan").disabled=true; $("#stop-scan").disabled=false;
  } catch(error) { showResult("error","Kamera tidak tersedia","Izinkan akses kamera dan pastikan aplikasi dibuka melalui HTTPS."); console.error(error); }
});
$("#stop-scan").addEventListener("click", async () => {
  if (!scanner || !running) return;
  await scanner.stop(); await scanner.clear(); running=false;
  $("#start-scan").disabled=false; $("#stop-scan").disabled=true;
});
window.addEventListener("beforeunload", () => { if (running) scanner.stop().catch(()=>{}); });
await refreshToday();
