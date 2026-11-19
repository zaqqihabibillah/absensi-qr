import { auth, db, $, requireAuth, logout, localDate, localTime, attendanceId, doc, getDoc, getDocs, collection, query, where, orderBy, runTransaction, serverTimestamp, setDoc, escapeHtml } from "./app.js";
const user = await requireAuth(); $("#logout-button").addEventListener("click",logout);
let students = [], csvRows = [];
const today=localDate(); $("#report-date").value=today;
async function loadStudents() {
  const snap=await getDocs(collection(db,"siswa"));
  students=snap.docs.map(d=>({nisn:d.id,...d.data()})).sort((a,b)=>a.nama.localeCompare(b.nama,"id"));
  const classes=[...new Set(students.map(s=>s.kelas))].sort();
  ["#class-filter","#report-class"].forEach(sel=>$(sel).innerHTML='<option value="">Semua kelas</option>'+classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(""));
  $("#total-students").textContent=students.filter(s=>s.aktif).length;
  renderStudents(); await loadReport();
}
function renderStudents() {
  const term=$("#student-search").value.toLowerCase(), cls=$("#class-filter").value;
  const shown=students.filter(s=>(!cls||s.kelas===cls)&&(`${s.nisn} ${s.nama}`.toLowerCase().includes(term)));
  $("#student-grid").innerHTML=shown.length?shown.map(s=>`<article class="student-card"><div class="qr-code" data-qr="${escapeHtml(s.nisn)}"></div><div><b>${escapeHtml(s.nama)}</b><span>${escapeHtml(s.nisn)} · ${escapeHtml(s.kelas)}</span><small>${s.aktif?"Aktif":"Nonaktif"}</small></div><button class="mini-button toggle-active" data-id="${escapeHtml(s.nisn)}" data-active="${s.aktif}">${s.aktif?"Nonaktifkan":"Aktifkan"}</button></article>`).join(""):'<p class="empty">Tidak ada siswa yang cocok.</p>';
  document.querySelectorAll(".qr-code").forEach(el=>new QRCode(el,{text:el.dataset.qr,width:88,height:88,correctLevel:QRCode.CorrectLevel.M}));
}
async function loadReport() {
  const date=$("#report-date").value||today, cls=$("#report-class").value;
  const q=query(collection(db,"absensi"),where("tanggal","==",date),orderBy("waktu","desc"));
  const snap=await getDocs(q);
  const saved=snap.docs.map(d=>({id:d.id,...d.data()}));
  const filteredSaved=saved.filter(a=>!cls||a.kelas===cls);
  const active=students.filter(s=>s.aktif&&(!cls||s.kelas===cls));
  const savedByNisn=new Map(saved.map(a=>[a.nisn,a]));
  const missing=active.filter(s=>!savedByNisn.has(s.nisn)).map(s=>({
    id:attendanceId(date,s.nisn), nisn:s.nisn, nama:s.nama, kelas:s.kelas,
    tanggal:date, waktu:"—", status:"Belum", pencatat:"—", missing:true
  }));
  const rows=[...filteredSaved,...missing].sort((a,b)=>{
    if(a.missing!==b.missing) return a.missing?1:-1;
    return String(b.waktu).localeCompare(String(a.waktu));
  });
  $("#total-present").textContent=saved.filter(r=>r.status==="Hadir"&&(!cls||r.kelas===cls)).length;
  $("#total-missing").textContent=missing.length;
  $("#report-body").innerHTML=rows.length?rows.map(a=>`<tr><td>${escapeHtml(a.waktu)}</td><td>${escapeHtml(a.nisn)}</td><td>${escapeHtml(a.nama)}</td><td>${escapeHtml(a.kelas)}</td><td><span class="status ${a.status.toLowerCase()}">${escapeHtml(a.status)}</span></td><td>${escapeHtml(a.pencatat||"—")}</td><td><select class="change-status" data-id="${escapeHtml(a.id)}" data-nisn="${escapeHtml(a.nisn)}" data-missing="${a.missing?"true":"false"}"><option value="">Pilih…</option>${["Hadir","Sakit","Izin","Alpa"].map(x=>`<option value="${x}">${x}</option>`).join("")}</select></td></tr>`).join(""):'<tr><td colspan="7" class="empty">Belum ada siswa aktif untuk filter ini.</td></tr>';
}
$("#student-form").addEventListener("submit",async e=>{
  e.preventDefault(); const nisn=$("#student-nisn").value.trim(), nama=$("#student-name").value.trim(), kelas=$("#student-class").value.trim();
  if(!/^\d{10}$/.test(nisn)){ $("#student-message").textContent="NISN harus terdiri dari 10 digit angka."; return; }
  try { await setDoc(doc(db,"siswa",nisn),{nama,kelas,aktif:true,updatedAt:serverTimestamp()},{merge:true}); e.target.reset(); $("#student-message").textContent="Data siswa berhasil disimpan."; await loadStudents(); }
  catch(err){console.error(err);$("#student-message").textContent="Gagal menyimpan data. Periksa aturan Firestore.";}
});
$("#student-search").addEventListener("input",renderStudents); $("#class-filter").addEventListener("change",renderStudents);
$("#report-date").addEventListener("change",loadReport); $("#report-class").addEventListener("change",loadReport);
$("#student-grid").addEventListener("click",async e=>{
 const btn=e.target.closest(".toggle-active"); if(!btn)return;
 const active=btn.dataset.active==="true";
 await setDoc(doc(db,"siswa",btn.dataset.id),{aktif:!active,updatedAt:serverTimestamp()},{merge:true}); await loadStudents();
});
$("#report-body").addEventListener("change",async e=>{
 const select=e.target.closest(".change-status"); if(!select||!select.value)return;
 const ref=doc(db,"absensi",select.dataset.id);
 if(select.dataset.missing==="true"){
   const student=students.find(s=>s.nisn===select.dataset.nisn);
   if(!student)return;
   const date=$("#report-date").value||today;
   await setDoc(ref,{nisn:student.nisn,nama:student.nama,kelas:student.kelas,tanggal:date,waktu:localTime(),status:select.value,pencatat:user.email||user.uid,createdAt:serverTimestamp(),inputManual:true});
 } else {
   await setDoc(ref,{status:select.value,diubahOleh:user.email||user.uid,diubahPada:serverTimestamp()},{merge:true});
 }
 await loadReport();
});
$("#csv-file").addEventListener("change",async e=>{
 const file=e.target.files[0]; if(!file)return;
 const text=await file.text(); csvRows=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean).map(line=>line.split(",").map(v=>v.trim().replace(/^"|"$/g,"")));
});
$("#import-csv").addEventListener("click",async()=>{
 if(!csvRows.length){$("#import-message").textContent="Pilih file CSV terlebih dahulu.";return;}
 let count=0, errors=0;
 for(const row of csvRows){
  const [nisn,nama,kelas]=row; if(!/^\d{10}$/.test(nisn||"")||!nama||!kelas||nisn.toLowerCase()==="nisn")continue;
  try{await setDoc(doc(db,"siswa",nisn),{nama,kelas,aktif:true,updatedAt:serverTimestamp()},{merge:true});count++;}catch{errors++;}
 }
 $("#import-message").textContent=`Import selesai: ${count} berhasil, ${errors} gagal.`; csvRows=[]; await loadStudents();
});
$("#export-csv").addEventListener("click",async()=>{
 const date=$("#report-date").value||today, cls=$("#report-class").value;
 const snap=await getDocs(query(collection(db,"absensi"),where("tanggal","==",date),orderBy("waktu","asc")));
 const rows=snap.docs.map(d=>d.data()).filter(a=>!cls||a.kelas===cls);
 const quote=v=>`"${String(v??"").replace(/"/g,'""')}"`;
 const csv=["Tanggal,Waktu,NISN,Nama,Kelas,Status,Pencatat",...rows.map(a=>[a.tanggal,a.waktu,a.nisn,a.nama,a.kelas,a.status,a.pencatat].map(quote).join(","))].join("\r\n");
 const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}), url=URL.createObjectURL(blob), a=document.createElement("a");
 a.href=url;a.download=`presensi-${date}.csv`;a.click();URL.revokeObjectURL(url);
});
$("#print-cards").addEventListener("click",()=>window.print());
await loadStudents();
