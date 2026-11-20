(function () {
const SAT = {g: 'g', kg: 'g', ml: 'ml', l: 'ml', pcs: 'pcs'};
const opt = a => a.map(x => '<option>' + x + '</option>').join('');
const pct = n => n == null ? '-' : (Math.round(n * 10) / 10).toLocaleString('id-ID') + '%';
const baris = (a, b, k) => '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0' + (k ? ';font-weight:700;border-top:1px solid var(--l)' : '') + '"><span>' + a + '</span><span>' + b + '</span></div>';
const f = (id, l) => '<label>' + l + '</label><input id="' + id + '" type="number" inputmode="decimal">';

HALAMAN.dashboard = async function (el) {
  const p = window._per || 'bulan';
  const d = await api('dashboard', {periode: p}), r = d.ringkasan;
  el.innerHTML = '<select id="per">' + [['hari', 'Hari ini'], ['minggu', 'Minggu ini'], ['bulan', 'Bulan ini'], ['tahun', 'Tahun ini']]
    .map(x => '<option value="' + x[0] + '"' + (x[0] === p ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select>' +
    '<div class="kartu" style="margin-top:12px"><div class="kecil">Omzet hari ini</div><h2>' + rp(d.omzet_hari_ini) + '</h2>' +
    '<div class="kecil">Omzet bulan ini ' + rp(d.omzet_bulan_ini) + ' · Saldo kas ' + rp(d.saldo_kas) + '</div></div>' +
    '<div class="kartu"><b>Periode terpilih</b>' + baris('Penjualan', rp(r.total_penjualan)) + baris('HPP terjual', rp(r.total_hpp)) +
    baris('Laba kotor', rp(r.laba_kotor)) + baris('Pengeluaran', rp(r.total_pengeluaran)) + baris('Laba bersih', rp(r.laba_bersih), 1) + '</div>' +
    (d.peringatan.length ? '<div class="kartu"><b>Stok hampir habis</b>' + d.peringatan.map(b => baris(esc(b.nama), b.stok + ' ' + b.satuan)).join('') + '</div>' : '');
  $('#per').onchange = e => { window._per = e.target.value; buka('dashboard'); };
};

HALAMAN.bahan = async function (el) {
  const a = await api('ambilAwal');
  el.innerHTML = '<div class="kartu"><h2>Tambah bahan</h2><label>Nama bahan</label><input id="bn">' +
    '<label>Satuan</label><select id="bs">' + opt(Object.keys(SAT)) + '</select>' +
    f('bst', 'Stok awal (boleh kosong)') + f('bh', 'Harga beli per satuan di atas (boleh kosong)') + f('bm', 'Stok minimum') +
    '<button class="tombol" id="bsim">Simpan bahan</button></div>' +
    '<div class="kartu"><h2>Daftar bahan</h2>' + (a.bahan.length ? a.bahan.map(b => baris('<b>' + esc(b.nama) + '</b><br><span class="kecil">Rp ' +
      Number(b.harga_rata2).toLocaleString('id-ID', {maximumFractionDigits: 2}) + ' per ' + b.satuan_dasar + '</span>',
      Number(b.stok).toLocaleString('id-ID') + ' ' + b.satuan_dasar)).join('') : '<p class="kecil">Belum ada bahan.</p>') + '</div>';
  $('#bsim').onclick = async () => {
    try {
      const s = $('#bs').value;
      await api('simpanBahan', {nama: $('#bn').value, satuan_dasar: SAT[s], satuan_input: s, satuan_harga: s,
        stok_awal: $('#bst').value, harga_beli: $('#bh').value, stok_min: $('#bm').value});
      toast('Bahan tersimpan'); buka('bahan');
    } catch (e) { toast(e.message); }
  };
};

HALAMAN.hpp = async function (el) {
  const a = await api('ambilAwal');
  const B = a.bahan.filter(b => String(b.aktif).toUpperCase() !== 'FALSE');
  if (!B.length) { el.innerHTML = '<div class="kartu">Isi dulu bahan di menu ☰ → Bahan Baku.</div>'; return; }
  const isi = r => {
    const d = B.find(b => b.id === r.querySelector('.bb').value).satuan_dasar;
    r.querySelector('.bu').innerHTML = opt(Object.keys(SAT).filter(k => SAT[k] === d));
  };
  const tambah = () => {
    const d = document.createElement('div'); d.className = 'br'; d.style.marginBottom = '10px';
    d.innerHTML = '<select class="bb">' + B.map(b => '<option value="' + b.id + '">' + esc(b.nama) + '</option>').join('') +
      '</select><div style="display:flex;gap:8px;margin-top:6px"><input class="bq" type="number" inputmode="decimal" placeholder="Jumlah"><select class="bu"></select></div>';
    $('#rows').appendChild(d); isi(d);
  };
  el.innerHTML = '<div class="kartu"><h2>Bahan resep</h2><div id="rows"></div><button class="tautan" id="tb">+ Tambah bahan</button>' +
    f('kem', 'Biaya kemasan (Rp)') + f('ten', 'Biaya tenaga kerja (Rp)') + f('ovh', 'Gas, listrik, overhead (Rp)') + f('has', 'Jumlah hasil produksi (jadi)') + '</div>' +
    '<div class="kartu"><h2>Harga jual (opsional)</h2>' + f('hj', 'Harga jual saya (Rp)') + f('tm', 'Target margin (%)') + f('tk', 'Target markup (%)') +
    f('dp', 'Simulasi diskon (%)') + f('bt', 'Biaya transaksi (%), contoh QRIS 0.7') + '</div>' +
    '<button class="tombol" id="hit">Hitung</button><div id="out" style="margin-top:14px"></div>';
  tambah();
  $('#tb').onclick = tambah;
  $('#rows').onchange = e => { if (e.target.classList.contains('bb')) isi(e.target.closest('.br')); };
  const ana = (j, x) => x ? '<div class="kartu"><b>' + j + '</b>' + baris('Harga jual', rp(x.harga)) + baris('Laba per unit', rp(x.laba)) +
    baris('Markup', pct(x.markup)) + baris('Margin', pct(x.margin)) +
    (x.biaya_transaksi ? baris('Biaya transaksi', rp(x.biaya_transaksi)) + baris('Laba bersih', rp(x.laba_bersih)) + baris('Margin bersih', pct(x.margin_bersih)) : '') + '</div>' : '';
  $('#hit').onclick = async () => {
    try {
      const bars = [...document.querySelectorAll('.br')].map(r => ({bahan_id: r.querySelector('.bb').value, qty: r.querySelector('.bq').value, satuan: r.querySelector('.bu').value}));
      const h = await api('hitungHPP', {baris: bars, biaya_kemasan: $('#kem').value, biaya_tenaga: $('#ten').value, biaya_overhead: $('#ovh').value, hasil: $('#has').value});
      const g = await api('hitungHarga', {hpp: h.hpp_unit, harga_jual: $('#hj').value, target_margin: $('#tm').value, target_markup: $('#tk').value,
        diskon_persen: $('#dp').value, biaya_transaksi_persen: $('#bt').value});
      $('#out').innerHTML = '<div class="kartu"><b>Rincian HPP</b>' +
        h.baris.map(b => baris(esc(b.nama) + '<br><span class="kecil">' + b.jumlah_dasar + ' ' + b.satuan_dasar + '</span>', rp(b.biaya))).join('') +
        baris('Total bahan', rp(h.total_bahan), 1) + baris('Kemasan', rp(h.biaya_kemasan)) + baris('Tenaga kerja', rp(h.biaya_tenaga)) +
        baris('Overhead', rp(h.biaya_overhead)) + baris('Total biaya produksi', rp(h.total_biaya), 1) + baris('Jumlah hasil', h.hasil) +
        baris('HPP per unit', rp(h.hpp_unit), 1) + '</div>' +
        ana('Harga jual Anda', g.manual) + ana('Rekomendasi (target margin)', g.rekomendasi_margin) +
        ana('Rekomendasi (target markup)', g.rekomendasi_markup) + ana('Setelah diskon', g.diskon);
      $('#out').scrollIntoView({behavior: 'smooth'});
    } catch (e) { toast(e.message); }
  };
};

if (!$('#aplikasi').hidden) buka(location.hash.slice(1));
})();
// AKHIR FILE hal1.js
