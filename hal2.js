(function () {
const P = 'nr_c_';
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const kosong = v => v === '' || v === null || v === undefined;
const z2 = n => String(n).padStart(2, '0');
const hariIniLokal = () => { const t = new Date(); return t.getFullYear() + '-' + z2(t.getMonth() + 1) + '-' + z2(t.getDate()); };
const awalBulan = () => hariIniLokal().slice(0, 8) + '01';
const tg = s => String(s).slice(8, 10) + '/' + String(s).slice(5, 7) + '/' + String(s).slice(0, 4);
const pct = n => n == null ? '-' : (Math.round(n * 10) / 10).toLocaleString('id-ID') + '%';
const num = n => Number(n).toLocaleString('id-ID', {maximumFractionDigits: 2});
const rb = n => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? (a / 1e9).toFixed(1).replace('.', ',') + ' M' : a >= 1e6 ? (a / 1e6).toFixed(1).replace('.', ',') + ' jt' : a >= 1e3 ? Math.round(a / 1e3) + ' rb' : String(Math.round(a));
  return (n < 0 ? '-' : '') + s;
};

// ===== Kecepatan: cache, permintaan ganda, pemanasan =====
const asli = api, kAsli = keluar, bAsli = buka;
let awalCache = null, tb = '', tt = 0;
const PETA = {simpanBahan: 'bahan', simpanProduk: 'produk', simpanKategori: 'kategori', simpanSupplier: 'supplier'};
function bersih() {
  awalCache = null;
  Object.keys(localStorage).filter(k => k.indexOf(P) === 0).forEach(k => localStorage.removeItem(k));
}
function panas() {
  if (localStorage.getItem(K.tok) && localStorage.getItem(K.api)) api('ambilAwal').catch(() => {});
}
function sesudah(aksi, h) {
  if (PETA[aksi]) {
    const c = awalCache;
    if (c && h && h.id) c.p.then(d => {
      const a = d[PETA[aksi]];
      if (!Array.isArray(a)) return;
      const i = a.findIndex(x => x.id === h.id);
      if (i >= 0) a[i] = h; else a.push(h);
    }).catch(() => {});
  } else if (/^(simpan|batalkan|unggah)/.test(aksi)) awalCache = null;
}
api = function (aksi, data) {
  data = data || {};
  if (aksi === 'ambilAwal') {
    if (awalCache && Date.now() - awalCache.t < 180000) return awalCache.p;
    const p = asli(aksi, data);
    awalCache = {t: Date.now(), p: p};
    p.catch(() => { if (awalCache && awalCache.p === p) awalCache = null; });
    return p;
  }
  if (aksi === 'hitungHarga' && ['harga_jual', 'target_margin', 'target_markup', 'diskon_persen', 'harga_promo'].every(k => kosong(data[k])))
    return Promise.resolve({hpp: Number(data.hpp) || 0});
  if (aksi === 'login') {
    bersih();
    return asli(aksi, data).then(h => { setTimeout(panas, 400); return h; });
  }
  return asli(aksi, data).then(h => { sesudah(aksi, h); return h; });
};
keluar = function (o) { bersih(); kAsli(o); };
buka = function (n) {
  const now = Date.now();
  if (n === tb && now - tt < 700) return;
  tb = n; tt = now;
  return bAsli(n);
};

// ===== Gaya dashboard =====
const st = document.createElement('style');
st.textContent = '.chip{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}' +
  '.chip button{flex:0 0 auto;padding:8px 14px;border:1px solid var(--l);background:var(--p);border-radius:20px;font-size:14px;color:var(--t)}' +
  '.chip button.on{background:var(--m);color:#fff;border-color:var(--m)}' +
  '.mat{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}' +
  '.ubin{background:var(--p);border:1px solid var(--l);border-radius:14px;padding:12px}' +
  '.ubin .k{font-size:12px;color:var(--s)}' +
  '.ubin .v{font-size:17px;font-weight:700;color:var(--m);margin-top:2px;word-break:break-word}' +
  '.ubin.lebar{grid-column:1/3;background:var(--m);border-color:var(--m)}' +
  '.ubin.lebar .k{color:#EAD9B8}.ubin.lebar .v{color:#fff;font-size:24px}' +
  '.ubin .v.neg{color:var(--er)}' +
  '.baris{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid var(--l);font-size:14px}' +
  '.lencana{background:#FBEAE8;color:var(--er);border-radius:8px;padding:2px 8px;font-size:11px;white-space:nowrap}' +
  '.legenda{display:flex;gap:14px;font-size:12px;color:var(--s);margin:6px 0}' +
  '.legenda i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px}' +
  '.bar{height:6px;background:var(--l);border-radius:4px;overflow:hidden;margin-top:5px}' +
  '.bar b{display:block;height:100%;background:var(--g)}.bar.rendah b{background:var(--er)}';
document.head.appendChild(st);

// ===== Grafik =====
function grupkan(g) {
  const n = g.length, f = t => t.slice(8) + '/' + t.slice(5, 7);
  if (n <= 31) return g.map(x => ({l: f(x.tanggal), o: x.omzet, b: x.laba}));
  if (n <= 62) {
    const o = [];
    for (let i = 0; i < n; i += 7) {
      const s = g.slice(i, i + 7);
      o.push({l: f(s[0].tanggal), o: s.reduce((a, x) => a + x.omzet, 0), b: s.reduce((a, x) => a + x.laba, 0)});
    }
    return o;
  }
  const m = {};
  g.forEach(x => {
    const k = x.tanggal.slice(0, 7);
    const e = m[k] = m[k] || {l: BLN[Number(k.slice(5)) - 1], o: 0, b: 0};
    e.o += x.omzet; e.b += x.laba;
  });
  return Object.keys(m).sort().map(k => m[k]);
}
function grafik(g) {
  const d = grupkan(g || []);
  if (!d.length || !d.some(x => x.o || x.b)) return '<p class="kecil">Belum ada data untuk digambar.</p>';
  const W = 340, H = 170, L = 6, R = 6, T = 16, B = 28;
  const v = d.reduce((a, x) => a.concat([x.o, x.b]), [0]);
  let mx = Math.max.apply(null, v), mn = Math.min.apply(null, v);
  if (mx === mn) mx = mn + 1;
  const y = n => T + (mx - n) / (mx - mn) * (H - T - B);
  const bw = (W - L - R) / d.length, y0 = y(0);
  const tx = (x, yy, t, a) => '<text x="' + x.toFixed(1) + '" y="' + yy + '" text-anchor="' + a + '" style="fill:var(--s);font-size:9px">' + t + '</text>';
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block">';
  s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '" stroke="#E8DFD0"/>';
  d.forEach((x, i) => {
    const yy = y(x.o), h = Math.abs(y0 - yy);
    s += '<rect x="' + (L + i * bw + bw * 0.18).toFixed(1) + '" y="' + Math.min(y0, yy).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) +
      '" height="' + (x.o ? Math.max(h, 1.5) : 0).toFixed(1) + '" rx="2" fill="#6B1E2E" opacity=".88"/>';
  });
  s += '<polyline points="' + d.map((x, i) => (L + i * bw + bw / 2).toFixed(1) + ',' + y(x.b).toFixed(1)).join(' ') +
    '" fill="none" stroke="#B8964E" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
  if (d.length <= 31) d.forEach((x, i) => { s += '<circle cx="' + (L + i * bw + bw / 2).toFixed(1) + '" cy="' + y(x.b).toFixed(1) + '" r="2.6" fill="#B8964E"/>'; });
  s += tx(L, 10, rb(mx), 'start');
  if (mn < 0) s += tx(L, H - B - 3, rb(mn), 'start');
  s += tx(L, H - 10, d[0].l, 'start');
  if (d.length > 1) s += tx(W - R, H - 10, d[d.length - 1].l, 'end');
  if (d.length >= 5) { const i = Math.floor((d.length - 1) / 2); s += tx(L + i * bw + bw / 2, H - 10, d[i].l, 'middle'); }
  return s + '</svg>';
}

// ===== Dashboard =====
function filter(p) {
  const chips = [['hari', 'Hari'], ['minggu', 'Minggu'], ['bulan', 'Bulan'], ['tahun', 'Tahun'], ['khusus', 'Khusus']]
    .map(x => '<button data-p="' + x[0] + '" class="' + (x[0] === p ? 'on' : '') + '">' + x[1] + '</button>').join('');
  let h = '<div class="chip">' + chips + '</div>';
  if (p === 'khusus') h += '<div class="kartu" style="margin-top:10px"><div style="display:flex;gap:8px">' +
    '<div style="flex:1"><label>Dari</label><input type="date" id="dr" value="' + window._dari + '"></div>' +
    '<div style="flex:1"><label>Sampai</label><input type="date" id="sp" value="' + window._sampai + '"></div></div>' +
    '<button class="tombol" id="trp">Terapkan</button></div>';
  return h + '<div id="dbIsi" style="margin-top:12px"></div>';
}
function gambar(d, p, lama) {
  const box = $('#dbIsi');
  if (!box) return;
  const r = d.ringkasan;
  const kmk = r.total_penjualan > 0 ? r.laba_kotor / r.total_penjualan * 100 : null;
  const ubin = (k, v, o) => '<div class="ubin' + (o && o.l ? ' lebar' : '') + '"><div class="k">' + k + '</div><div class="v' + (o && o.n ? ' neg' : '') + '">' + v + '</div></div>';
  const brs = (a, b) => '<div class="baris"><span>' + a + '</span><span>' + b + '</span></div>';
  let h = lama ? '<div class="kecil" style="margin-bottom:8px">Memperbarui data…</div>' : '';
  h += '<div class="mat">' + ubin('Omzet hari ini', rp(d.omzet_hari_ini), {l: 1}) + ubin('Omzet bulan ini', rp(d.omzet_bulan_ini)) +
    ubin('Saldo kas', rp(d.saldo_kas), {n: d.saldo_kas < 0}) + '</div>';
  h += '<div class="kecil" style="margin:4px 2px 8px">Periode: ' + tg(d.dari) + ' – ' + tg(d.sampai) + '</div>';
  if (!r.transaksi && !r.total_pengeluaran) h += '<div class="kartu kecil">Belum ada transaksi pada periode ini. Angka terisi otomatis setelah Anda mencatat penjualan dan pengeluaran.</div>';
  h += '<div class="mat">' + ubin('Total penjualan', rp(r.total_penjualan)) + ubin('Jumlah transaksi', num(r.transaksi)) +
    ubin('HPP barang terjual', rp(r.total_hpp)) + ubin('Laba kotor', rp(r.laba_kotor), {n: r.laba_kotor < 0}) +
    ubin('Pengeluaran', rp(r.total_pengeluaran)) + ubin('Laba bersih operasional', rp(r.laba_bersih), {n: r.laba_bersih < 0}) +
    ubin('Margin kotor', pct(kmk)) + ubin('Margin bersih', r.total_penjualan > 0 ? pct(r.margin_bersih) : '-') + '</div>';
  h += '<div class="kartu"><b>Omzet &amp; laba</b><div class="legenda"><span><i style="background:#6B1E2E"></i>Omzet</span><span><i style="background:#B8964E"></i>Laba bersih</span></div>' + grafik(d.grafik) + '</div>';
  const daftar = (j, a, f) => '<div class="kartu"><b>' + j + '</b>' + (a.length ? a.map(f).join('') : '<p class="kecil">Belum ada data.</p>') + '</div>';
  h += daftar('Produk terlaris', d.terlaris, x => brs(esc(x.nama), num(x.qty) + ' terjual'));
  h += daftar('Keuntungan tertinggi', d.laba_tertinggi, x => brs(esc(x.nama), rp(x.laba)));
  const mm = d.margin_terendah.length ? d.margin_terendah : d.margin_terendah_master;
  h += daftar('Margin terendah' + (d.margin_terendah.length ? '' : ' (harga jual saat ini)'), mm, x => brs(esc(x.nama), pct(x.margin)));
  h += '<div class="kartu"><b>Stok bahan baku</b>' +
    (d.peringatan.length ? '<div class="galat" style="margin:8px 0">' + d.peringatan.length + ' bahan hampir habis</div>' : '') +
    (d.stok_bahan.length ? d.stok_bahan.map(b => {
      const maks = Math.max(Number(b.stok_min) * 3, Number(b.stok), 1), w = Math.max(0, Math.min(100, Number(b.stok) / maks * 100));
      return '<div style="padding:8px 0;border-top:1px solid var(--l)"><div style="display:flex;justify-content:space-between;gap:10px;font-size:14px"><span>' +
        esc(b.nama) + (b.hampir_habis ? ' <span class="lencana">Hampir habis</span>' : '') + '</span><span>' + num(b.stok) + ' ' + esc(b.satuan) +
        '</span></div><div class="bar' + (b.hampir_habis ? ' rendah' : '') + '"><b style="width:' + w.toFixed(0) + '%"></b></div></div>';
    }).join('') : '<p class="kecil">Belum ada bahan. Tambahkan lewat menu ☰ → Bahan Baku.</p>') + '</div>';
  box.innerHTML = h;
}
let seq = 0;
HALAMAN.dashboard = async function (el) {
  const p = window._per || 'bulan';
  if (p === 'khusus') { window._dari = window._dari || awalBulan(); window._sampai = window._sampai || hariIniLokal(); }
  const data = {periode: p};
  if (p === 'khusus') { data.dari = window._dari; data.sampai = window._sampai; }
  const kunci = P + 'dash_' + p + (p === 'khusus' ? window._dari + window._sampai : '');
  const mine = ++seq;
  el.innerHTML = filter(p);
  el.querySelectorAll('.chip button').forEach(b => b.onclick = () => { window._per = b.dataset.p; HALAMAN.dashboard(el).catch(e => toast(e.message)); });
  const trp = $('#trp');
  if (trp) trp.onclick = () => {
    const a = $('#dr').value, b = $('#sp').value;
    if (!a || !b) return toast('Isi tanggal awal dan akhir.');
    if (a > b) return toast('Tanggal awal tidak boleh setelah tanggal akhir.');
    window._dari = a; window._sampai = b;
    HALAMAN.dashboard(el).catch(e => toast(e.message));
  };
  let ada = false;
  try { const s = localStorage.getItem(kunci); if (s) { gambar(JSON.parse(s), p, true); ada = true; } } catch (e) {}
  if (!ada) $('#dbIsi').innerHTML = '<div class="kartu kecil">Memuat data…</div>';
  let d;
  try { d = await api('dashboard', data); }
  catch (e) { if (!ada) throw e; toast('Gagal memperbarui: ' + e.message); return; }
  try { localStorage.setItem(kunci, JSON.stringify(d)); } catch (e) {}
  if (mine === seq && location.hash.slice(1) === 'dashboard') gambar(d, p, false);
};

panas();
})();
// AKHIR FILE hal2.js
