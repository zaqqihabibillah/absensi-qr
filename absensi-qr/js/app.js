import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, runTransaction, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export { auth, db, onAuthStateChanged, collection, doc, getDoc, getDocs, query, where, orderBy, limit, runTransaction, setDoc, serverTimestamp };
export const $ = (selector) => document.querySelector(selector);
export const localDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(date);
  const pick = type => parts.find(part => part.type === type)?.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
};
export const localTime = (date = new Date()) => new Intl.DateTimeFormat("id-ID", { timeZone:"Asia/Jakarta", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(date);
export const attendanceId = (date, nisn) => `${date}_${nisn}`;
export function requireAuth(redirect = "./index.html") {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      if (!user) location.replace(redirect);
      else resolve(user);
    });
  });
}
export async function logout() { await signOut(auth); location.replace("./index.html"); }
export function setNotice(element, message, type = "") {
  if (!element) return;
  element.textContent = message;
  element.className = `notice ${type}`.trim();
}
export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
