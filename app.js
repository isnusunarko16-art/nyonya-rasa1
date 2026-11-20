const K = {api: 'nr_api', tok: 'nr_token', usr: 'nr_user'};
const $ = s => document.querySelector(s);
const HALAMAN = {}; let aktif = '';
const JUDUL = {dashboard: 'Dashboard', produk: 'Produk', hpp: 'Kalkulator HPP', transaksi: 'Transaksi', laporan: 'Laporan',
  bahan: 'Bahan Baku', pembelian: 'Pembelian', produksi: 'Produksi', pengeluaran: 'Pengeluaran', supplier: 'Supplier & Kategori', pengaturan: 'Pengaturan'};
const MENU = [['bahan', 'Bahan Baku'], ['pembelian', 'Pembelian Bahan'], ['produksi', 'Produksi'], ['pengeluaran', 'Pengeluaran'],
  ['supplier', 'Supplier & Kategori'], ['pengaturan', 'Pengaturan & Backup']];

const rp = n => (Number(n) < 0 ? '-Rp ' : 'Rp ') + Math.abs(Math.round(Number(n) || 0)).toLocaleString('id-ID');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

let tToast;
function toast(t) {
  const e = $('#toast'); e.textContent = t; e.hidden = false;
  clearTimeout(tToast); tToast = setTimeout(() => e.hidden = true, 3000);
}

async function api(aksi, data) {
  const url = localStorage.getItem(K.api);
  if (!url) throw new Error('Alamat server belum diisi.');
  let r;
  try {
    r = await fetch(url, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({aksi: aksi, data: data || {}, token: localStorage.getItem(K.tok) || ''})});
  } catch (e) { throw new Error('Tidak bisa terhubung. Periksa internet dan alamat server.'); }
  let j;
  try { j = await r.json(); }
  catch (e) { throw new Error('Jawaban server tidak dikenali. Pastikan deployment diatur "Siapa saja" dan alamatnya berakhiran /exec.'); }
  if (!j.ok) {
    if (String(j.error).indexOf('SESI_HABIS') >= 0) { keluar(true); throw new Error('Sesi habis. Silakan masuk lagi.'); }
    throw new Error(j.error || 'Terjadi kesalahan.');
  }
  return j.data;
}

function tampilLogin(pesan) {
  $('#aplikasi').hidden = true; $('#layarLogin').hidden = false;
  $('#blokUrl').hidden = !!localStorage.getItem(K.api);
  $('#inUrl').value = localStorage.getItem(K.api) || '';
  $('#inPin').value = '';
  const e = $('#errLogin'); e.hidden = !pesan; e.textContent = pesan || '';
}
function tampilApp() {
  $('#layarLogin').hidden = true; $('#aplikasi').hidden = false;
  buka((location.hash || '#dashboard').slice(1));
}
function keluar(otomatis) {
  const t = localStorage.getItem(K.tok);
  localStorage.removeItem(K.tok); localStorage.removeItem(K.usr);
  if (t && !otomatis) fetch(localStorage.getItem(K.api), {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({aksi: 'logout', token: t})}).catch(() => {});
  tampilLogin(otomatis ? 'Sesi habis. Silakan masuk lagi.' : '');
}

$('#ubahUrl').onclick = () => { $('#blokUrl').hidden = false; $('#inUrl').focus(); };
$('#formLogin').onsubmit = async ev => {
  ev.preventDefault();
  const url = $('#inUrl').value.trim(), btn = $('#btnMasuk'), err = $('#errLogin');
  err.hidden = true;
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) { err.textContent = 'Alamat server harus berawalan https://script.google.com dan berakhiran /exec.'; err.hidden = false; return; }
  if (!$('#inUser').value.trim() || !$('#inPin').value) { err.textContent = 'Username dan PIN wajib diisi.'; err.hidden = false; return; }
  localStorage.setItem(K.api, url);
  btn.disabled = true; btn.textContent = 'Memeriksa…';
  try {
    const h = await api('login', {username: $('#inUser').value.trim(), pin: $('#inPin').value});
    localStorage.setItem(K.tok, h.token); localStorage.setItem(K.usr, h.username);
    $('#inPin').value = '';
    tampilApp();
  } catch (e) { err.textContent = e.message; err.hidden = false; }
  btn.disabled = false; btn.textContent = 'Masuk';
};

async function buka(nama) {
  if (!JUDUL[nama]) nama = 'dashboard';
    aktif = nama; location.hash = nama;
  $('#judul').textContent = JUDUL[nama];
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('aktif', a.dataset.h === nama));
  const el = $('#isi'); window.scrollTo(0, 0);
  try {
    if (HALAMAN[nama]) await HALAMAN[nama](el);
    else el.innerHTML = '<div class="kartu"><h2>' + esc(JUDUL[nama]) + '</h2><p class="kecil">Halaman ini dibuat di tahap berikutnya.</p></div>';
  } catch (e) {
    if (localStorage.getItem(K.tok)) el.innerHTML = '<div class="kartu"><div class="galat">' + esc(e.message) + '</div><button class="tombol" onclick="buka(\'' + nama + '\')">Coba lagi</button></div>';
  }
}
window.addEventListener('hashchange', () => { if (!$('#aplikasi').hidden && location.hash.slice(1) !== aktif) buka(location.hash.slice(1)); });

$('#daftarMenu').innerHTML = MENU.map(m => '<button data-h="' + m[0] + '">' + m[1] + '</button>').join('') +
  '<button class="keluar" id="btnKeluar">Keluar</button>';
$('#btnMenu').onclick = () => $('#sheet').hidden = false;
$('#sheet').onclick = e => {
  if (e.target.id === 'sheet') $('#sheet').hidden = true;
  const b = e.target.closest('button');
  if (!b) return;
  $('#sheet').hidden = true;
  if (b.id === 'btnKeluar') keluar(false); else buka(b.dataset.h);
};

HALAMAN.dashboard = async function (el) {
  el.innerHTML = '<div class="kartu">Memeriksa koneksi…</div>';
  const a = await api('ambilAwal');
  el.innerHTML = '<div class="kartu"><div class="kecil">Terhubung ke</div><h2>' + esc((a.pengaturan || {}).nama_usaha || 'NYONYA RASA') + '</h2>' +
    '<p>Server aktif. Produk: <b>' + a.produk.length + '</b> · Bahan: <b>' + a.bahan.length + '</b> · Kategori: <b>' + a.kategori.length + '</b></p>' +
    '<p class="kecil">Masuk sebagai ' + esc(localStorage.getItem(K.usr)) + '</p></div>' +
    '<div class="kartu kecil">Dashboard lengkap dibuat di Tahap 4B.</div>';
};

if (localStorage.getItem(K.tok) && localStorage.getItem(K.api)) tampilApp(); else tampilLogin();
// AKHIR FILE app.js
