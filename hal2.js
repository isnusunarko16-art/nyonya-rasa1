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
(function () {
const SAT = {g: ['g', 'kg'], ml: ['ml', 'l'], pcs: ['pcs']};
const DAS = {g: 'g', kg: 'g', ml: 'ml', l: 'ml', pcs: 'pcs'};
const pct = n => n == null ? '-' : (Math.round(n * 10) / 10).toLocaleString('id-ID') + '%';
const rp2 = n => 'Rp ' + Number(n).toLocaleString('id-ID', {maximumFractionDigits: 2});
const br = (a, b, k) => '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0' + (k ? ';font-weight:700;border-top:1px solid var(--l)' : '') + '"><span>' + a + '</span><span>' + b + '</span></div>';
const fld = (id, l, v) => '<label>' + l + '</label><input id="' + id + '" type="number" inputmode="decimal"' + (v ? ' value="' + v + '"' : '') + '>';
const aktifOk = x => String(x.aktif).toUpperCase() !== 'FALSE';

HALAMAN.hpp = async function (el) {
  const a = await api('ambilAwal');
  const semua = a.bahan.slice();
  const B = semua.filter(aktifOk);
  const K = a.kategori.filter(k => k.jenis === 'produk' && aktifOk(k));
  const PR = a.produk.filter(aktifOk);
  let pid = '', tok = 0;

  el.innerHTML =
    '<div class="kartu"><h2>1. Produk</h2><label>Pilih produk atau buat baru</label><select id="pp"><option value="">+ Produk baru</option>' +
    PR.map(p => '<option value="' + p.id + '">' + esc(p.nama) + '</option>').join('') + '</select>' +
    '<div id="pbaru"><label>Nama produk baru</label><input id="pn" placeholder="Contoh: Sambal Bawang 100 g">' +
    '<label>Kategori</label><select id="pk">' + K.map(k => '<option value="' + k.id + '">' + esc(k.nama) + '</option>').join('') +
    '<option value="_baru"' + (K.length ? '' : ' selected') + '>+ Kategori baru…</option></select>' +
    '<input id="pkn" placeholder="Nama kategori baru" style="margin-top:8px"' + (K.length ? ' hidden' : '') + '></div></div>' +
    '<div class="kartu"><h2>2. Bahan resep</h2>' + (B.length ? '' : '<p class="kecil">Belum ada bahan. Buat bahan baru di bawah.</p>') +
    '<div id="rows"></div><button class="tautan" id="tb" type="button">+ Tambah baris bahan</button>' +
    '<button class="tautan" id="bb" type="button">+ Bahan belum ada? Buat bahan baru</button>' +
    '<div id="fb" hidden style="border-top:1px solid var(--l);margin-top:10px;padding-top:4px"><label>Nama bahan</label><input id="bnm">' +
    '<label>Satuan beli</label><select id="bsa">' + ['g', 'kg', 'ml', 'l', 'pcs'].map(u => '<option>' + u + '</option>').join('') + '</select>' +
    fld('bhg', 'Harga beli per satuan di atas (Rp)') + '<div class="kecil">Contoh: tepung Rp 12.000 per kg, pilih kg dan isi 12000.</div>' +
    '<button class="tombol" id="bsv" type="button">Simpan bahan</button></div></div>' +
    '<div class="kartu"><h2>3. Biaya lain &amp; hasil</h2>' + fld('kem', 'Biaya kemasan (Rp)') + fld('ten', 'Biaya tenaga kerja (Rp)') +
    fld('ovh', 'Gas, listrik, overhead (Rp)') + fld('has', 'Jumlah produk jadi dari resep ini') + '</div>' +
    '<div class="kartu"><h2>4. Cari harga jual</h2>' + fld('tm', 'Target margin (%)', '40') + fld('tk', 'Target markup (%), opsional') +
    fld('hj', 'Harga jual pilihan Anda (Rp), opsional') + fld('dp', 'Simulasi diskon (%), perlu harga jual') + fld('bt', 'Biaya transaksi (%), mis. QRIS 0,7') +
    '<div class="kecil" style="margin-top:8px">Margin = laba ÷ harga jual. Markup = laba ÷ HPP. Keduanya berbeda.</div></div>' +
    '<button class="tombol" id="hit" type="button">Hitung HPP &amp; harga jual</button><div id="out" style="margin-top:14px"></div>';

  const optB = sel => B.map(b => '<option value="' + b.id + '"' + (b.id === sel ? ' selected' : '') + '>' + esc(b.nama) +
    (Number(b.harga_rata2) > 0 ? '' : ' (harga belum ada)') + '</option>').join('');
  const unit = (d, sat) => {
    const bh = B.find(b => b.id === d.querySelector('.bb').value);
    const ls = SAT[bh ? bh.satuan_dasar : 'g'] || ['g'];
    d.querySelector('.bu').innerHTML = ls.map(u => '<option' + (u === sat ? ' selected' : '') + '>' + u + '</option>').join('');
  };
  const baris = (sel, qty, sat) => {
    const d = document.createElement('div'); d.className = 'br';
    d.style.cssText = 'margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--l)';
    d.innerHTML = '<select class="bb">' + optB(sel) + '</select><div style="display:flex;gap:8px;margin-top:6px;align-items:center">' +
      '<input class="bq" type="number" inputmode="decimal" placeholder="Jumlah" value="' + (qty == null ? '' : qty) + '">' +
      '<select class="bu" style="max-width:90px"></select>' +
      '<button type="button" class="hp" style="border:0;background:none;color:var(--er);font-size:20px;padding:6px 8px">✕</button></div>';
    $('#rows').appendChild(d); unit(d, sat);
    return d;
  };
  const kumpul = () => ({
    baris: [...document.querySelectorAll('.br')].map(r => ({bahan_id: r.querySelector('.bb').value, qty: r.querySelector('.bq').value,
      satuan: r.querySelector('.bu').value})).filter(x => x.qty !== ''),
    biaya_kemasan: $('#kem').value, biaya_tenaga: $('#ten').value, biaya_overhead: $('#ovh').value, hasil: $('#has').value
  });

  const pilih = async id => {
    const t = ++tok;
    $('#rows').innerHTML = ''; $('#out').innerHTML = '';
    ['kem', 'ten', 'ovh', 'has', 'hj'].forEach(i => $('#' + i).value = '');
    pid = id; $('#pbaru').hidden = !!id;
    if (!id) { baris(); return; }
    const p = PR.find(x => x.id === id);
    const r = await api('ambilResep', {produk_id: id});
    if (t !== tok) return;
    (r.baris || []).forEach(x => {
      if (!B.find(b => b.id === x.bahan_id)) { const o = semua.find(b => b.id === x.bahan_id); if (o) B.push(o); }
      baris(x.bahan_id, x.qty, x.satuan);
    });
    if (!(r.baris || []).length) baris();
    const c = r.rincian || {};
    $('#kem').value = c.biaya_kemasan || ''; $('#ten').value = c.biaya_tenaga || ''; $('#ovh').value = c.biaya_overhead || '';
    $('#has').value = Number(p.hasil_per_batch) || '';
    if (Number(p.harga_jual) > 0) $('#hj').value = p.harga_jual;
  };

  const ana = (j, x, tombol) => x ? '<div class="kartu"><b>' + j + '</b>' + br('Harga jual', '<b>' + rp(x.harga) + '</b>') +
    br('Laba per unit', rp(x.laba)) + br('Markup', pct(x.markup)) + br('Margin', pct(x.margin)) +
    (Number($('#bt').value) > 0 ? br('Biaya transaksi', rp(x.biaya_transaksi)) + br('Laba bersih', rp(x.laba_bersih)) + br('Margin bersih', pct(x.margin_bersih)) : '') +
    (x.harga_murni != null ? '<div class="kecil">Sebelum dibulatkan ke atas (kelipatan Rp 500): ' + rp(x.harga_murni) + '</div>' : '') +
    (tombol ? '<button class="tombol pk" type="button" data-h="' + x.harga + '">Pakai harga ini</button>' : '') + '</div>' : '';

  const tampil = (h, g) => {
    const hj = $('#hj').value;
    $('#out').innerHTML =
      '<div class="kartu"><b>Rincian HPP</b>' +
      h.baris.map(b => br(esc(b.nama) + '<br><span class="kecil">' + b.jumlah_dasar + ' ' + b.satuan_dasar + ' × ' + rp2(b.harga_dasar) + '</span>', rp(b.biaya))).join('') +
      br('Total bahan', rp(h.total_bahan), 1) + br('Kemasan', rp(h.biaya_kemasan)) + br('Tenaga kerja', rp(h.biaya_tenaga)) +
      br('Overhead', rp(h.biaya_overhead)) + br('Total biaya produksi', rp(h.total_biaya), 1) + br('Jumlah hasil', h.hasil) +
      br('HPP per unit', '<b>' + rp2(h.hpp_unit) + '</b>', 1) + '</div>' +
      (g.rekomendasi_margin ? ana('Saran harga (target margin ' + $('#tm').value + '%)', g.rekomendasi_margin, 1) : '') +
      (g.rekomendasi_markup ? ana('Saran harga (target markup ' + $('#tk').value + '%)', g.rekomendasi_markup, 1) : '') +
      ana('Harga jual Anda', g.manual) + ana('Setelah diskon ' + $('#dp').value + '%', g.diskon) +
      '<div class="kartu"><b>Simpan sebagai produk</b><p class="kecil">' + (pid ? 'Resep dan HPP produk terpilih akan diperbarui.' : 'Produk baru dibuat beserta resepnya.') +
      ' Harga jual yang disimpan mengikuti kolom "Harga jual pilihan Anda": <b>' + (hj ? rp(hj) : 'belum diisi') + '</b>.</p>' +
      '<button class="tombol" id="sim" type="button">Simpan produk &amp; resep</button></div>';
    $('#out').querySelectorAll('.pk').forEach(b => b.onclick = () => { $('#hj').value = b.dataset.h; hitung(); });
    $('#sim').onclick = simpan;
  };

  const hitung = async () => {
    const btn = $('#hit'); btn.disabled = true;
    try {
      const h = await api('hitungHPP', kumpul());
      const hj = $('#hj').value;
      const q = {hpp: h.hpp_unit, harga_jual: hj, target_margin: $('#tm').value, target_markup: $('#tk').value, biaya_transaksi_persen: $('#bt').value};
      if (hj) q.diskon_persen = $('#dp').value;
      const g = await api('hitungHarga', q);
      tampil(h, g);
      $('#out').scrollIntoView({behavior: 'smooth'});
    } catch (e) { toast(e.message); }
    btn.disabled = false;
  };

  const simpan = async () => {
    const btn = $('#sim'); btn.disabled = true;
    try {
      const k = kumpul();
      if (!k.baris.length) throw new Error('Tambahkan minimal satu bahan.');
      const hj = $('#hj').value;
      if (!pid) {
        const nama = $('#pn').value.trim();
        if (!nama) throw new Error('Isi nama produk di bagian 1.');
        let kat = $('#pk').value;
        if (kat === '_baru') {
          const kn = $('#pkn').value.trim();
          if (!kn) throw new Error('Isi nama kategori baru.');
          const kb = await api('simpanKategori', {jenis: 'produk', nama: kn});
          K.push(kb); kat = kb.id;
          const o = document.createElement('option'); o.value = kb.id; o.textContent = kb.nama;
          $('#pk').insertBefore(o, $('#pk').lastElementChild); $('#pk').value = kb.id; $('#pkn').hidden = true;
        }
        const p = await api('simpanProduk', {nama: nama, kategori_id: kat, harga_jual: hj || 0});
        PR.push(p); pid = p.id;
        const o = document.createElement('option'); o.value = p.id; o.textContent = p.nama;
        $('#pp').appendChild(o); $('#pp').value = p.id; $('#pbaru').hidden = true;
      } else {
        const p = PR.find(x => x.id === pid);
        await api('simpanProduk', {id: pid, nama: p.nama, kategori_id: p.kategori_id, harga_jual: hj || p.harga_jual || 0});
        p.harga_jual = hj || p.harga_jual;
      }
      const r = await api('simpanResep', {produk_id: pid, hasil_per_batch: k.hasil, biaya_kemasan: k.biaya_kemasan,
        biaya_tenaga: k.biaya_tenaga, biaya_overhead: k.biaya_overhead, baris: k.baris});
      const lama = $('#okSim'); if (lama) lama.remove();
      $('#out').insertAdjacentHTML('afterbegin', '<div class="kartu" id="okSim" style="border-color:var(--g)"><b>✓ Tersimpan</b>' +
        '<p class="kecil">Produk, resep, dan HPP per unit ' + rp2(r.hpp_unit) + ' sudah masuk ke Google Sheets Anda.</p></div>');
      toast('Produk dan resep tersimpan');
      $('#out').scrollIntoView({behavior: 'smooth'});
    } catch (e) { toast(e.message); }
    btn.disabled = false;
  };

  $('#pp').onchange = e => pilih(e.target.value).catch(x => toast(x.message));
  $('#pk').onchange = e => { $('#pkn').hidden = e.target.value !== '_baru'; };
  $('#rows').onchange = e => { if (e.target.classList.contains('bb')) unit(e.target.closest('.br')); };
  $('#rows').onclick = e => { if (e.target.classList.contains('hp')) e.target.closest('.br').remove(); };
  $('#tb').onclick = () => baris();
  $('#bb').onclick = () => { $('#fb').hidden = !$('#fb').hidden; };
  $('#bsv').onclick = async () => {
    try {
      const s = $('#bsa').value;
      if (!$('#bhg').value) throw new Error('Isi harga beli bahan.');
      const b = await api('simpanBahan', {nama: $('#bnm').value, satuan_dasar: DAS[s], satuan_input: s, satuan_harga: s, harga_beli: $('#bhg').value});
      B.push(b); semua.push(b);
      document.querySelectorAll('.bb').forEach(x => x.insertAdjacentHTML('beforeend', '<option value="' + b.id + '">' + esc(b.nama) + '</option>'));
      const kos = [...document.querySelectorAll('.br')].find(r => r.querySelector('.bq').value === '');
      if (kos) { kos.querySelector('.bb').value = b.id; unit(kos, DAS[s]); } else baris(b.id, '', DAS[s]);
      $('#bnm').value = ''; $('#bhg').value = ''; $('#fb').hidden = true;
      toast('Bahan "' + b.nama + '" tersimpan dan dipilih');
    } catch (e) { toast(e.message); }
  };
  $('#hit').onclick = hitung;
  baris();
};
})();

// AKHIR FILE hal2.js
