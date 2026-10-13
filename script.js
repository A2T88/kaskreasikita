let transaksiList = JSON.parse(localStorage.getItem('kreasikita_transaksi')) || [];

window.onload = function() {
    document.getElementById('trans-tanggal').valueAsDate = new Date();
    document.getElementById('saldo-awal-input').value = "0";
    hitungKas();
};

function formatRupiah(angka) {
    if (isNaN(angka)) return 'Rp0';
    return 'Rp' + Number(angka).toLocaleString('id-ID');
}

function parseRupiah(str) {
    if (!str) return 0;
    return parseFloat(str.toString().replace(/\./g, '')) || 0;
}

function formatInputRupiah(input) {
    let value = input.value.replace(/\D/g, '');
    if (value === '') {
        input.value = '';
        return;
    }
    input.value = Number(value).toLocaleString('id-ID');
}

function hitungKas() {
    let saldoAwalStr = document.getElementById('saldo-awal-input').value;
    let saldoAwal = parseRupiah(saldoAwalStr);
    let totalMasuk = 0;
    let totalKeluar = 0;
    
    let htmlTransaksi = '';
    let kategoriData = {};
    let saldoBerjalan = saldoAwal;

    transaksiList.forEach((item, index) => {
        let masuk = parseFloat(item.masuk) || 0;
        let keluar = parseFloat(item.keluar) || 0;

        totalMasuk += masuk;
        totalKeluar += keluar;
        saldoBerjalan = saldoBerjalan + masuk - keluar;

        let kat = item.kategori ? item.kategori.trim() : 'Lain-Lain';
        if (!kategoriData[kat]) {
            kategoriData[kat] = { masuk: 0, keluar: 0 };
        }
        kategoriData[kat].masuk += masuk;
        kategoriData[kat].keluar += keluar;

        let tglFormatted = item.tanggal ? item.tanggal.split('-').reverse().join('/') : '';
        htmlTransaksi += `
            <tr>
                <td>${tglFormatted}</td>
                <td>${item.uraian}</td>
                <td>${item.kategori}</td>
                <td style="text-align:right">${masuk > 0 ? formatRupiah(masuk) : '-'}</td>
                <td style="text-align:right">${keluar > 0 ? formatRupiah(keluar) : '-'}</td>
                <td style="text-align:right; font-weight:bold;">${formatRupiah(saldoBerjalan)}</td>
                <td style="text-align:center" class="no-print">
                    <button class="btn btn-warning" onclick="bukaModalEdit(${index})">Edit</button>
                    <button class="btn btn-danger" onclick="hapusTransaksi(${index})">Hapus</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('tabel-transaksi').querySelector('tbody').innerHTML = htmlTransaksi;

    let htmlKategori = '';
    for (let kat in kategoriData) {
        htmlKategori += `
            <tr>
                <td><b>${kat}</b></td>
                <td style="text-align:right">${kategoriData[kat].masuk > 0 ? formatRupiah(kategoriData[kat].masuk) : '-'}</td>
                <td style="text-align:right">${kategoriData[kat].keluar > 0 ? formatRupiah(kategoriData[kat].keluar) : '-'}</td>
            </tr>
        `;
    }
    if (Object.keys(kategoriData).length === 0) {
        htmlKategori = `<tr><td colspan="3" style="text-align:center; color:#777;">Belum ada kategori tercatat</td></tr>`;
    }
    document.getElementById('tabel-kategori').querySelector('tbody').innerHTML = htmlKategori;

    let saldoAkhir = saldoAwal + totalMasuk - totalKeluar;
    document.getElementById('total-masuk').innerText = formatRupiah(totalMasuk);
    document.getElementById('total-keluar').innerText = formatRupiah(totalKeluar);
    document.getElementById('saldo-akhir').innerText = formatRupiah(saldoAkhir);

    localStorage.setItem('kreasikita_transaksi', JSON.stringify(transaksiList));
}

function bukaModalTambah() {
    document.getElementById('edit-index').value = -1;
    document.getElementById('modal-title').innerText = 'Tambah Transaksi Baru';
    document.getElementById('form-transaksi').reset();
    document.getElementById('trans-tanggal').valueAsDate = new Date();
    document.getElementById('modal-transaksi').style.display = 'block';
}

function bukaModalEdit(index) {
    let item = transaksiList[index];
    document.getElementById('edit-index').value = index;
    document.getElementById('modal-title').innerText = 'Edit Transaksi';
    document.getElementById('trans-tanggal').value = item.tanggal;
    document.getElementById('trans-uraian').value = item.uraian;
    document.getElementById('trans-kategori').value = item.kategori;
    
    if (item.masuk > 0) {
        document.getElementById('trans-jenis').value = 'masuk';
        document.getElementById('trans-nominal').value = Number(item.masuk).toLocaleString('id-ID');
    } else {
        document.getElementById('trans-jenis').value = 'keluar';
        document.getElementById('trans-nominal').value = Number(item.keluar).toLocaleString('id-ID');
    }

    document.getElementById('modal-transaksi').style.display = 'block';
}

function tutupModal() {
    document.getElementById('modal-transaksi').style.display = 'none';
}

function simpanTransaksi(event) {
    event.preventDefault();
    let editIndex = parseInt(document.getElementById('edit-index').value);
    let tanggal = document.getElementById('trans-tanggal').value;
    let uraian = document.getElementById('trans-uraian').value;
    let kategori = document.getElementById('trans-kategori').value;
    let jenis = document.getElementById('trans-jenis').value;
    let nominalStr = document.getElementById('trans-nominal').value;
    let nominal = parseRupiah(nominalStr);

    let masuk = jenis === 'masuk' ? nominal : 0;
    let keluar = jenis === 'keluar' ? nominal : 0;

    if (editIndex === -1) {
        transaksiList.push({ tanggal, uraian, kategori, masuk, keluar });
    } else {
        transaksiList[editIndex] = { tanggal, uraian, kategori, masuk, keluar };
    }
    
    tutupModal();
    hitungKas();
}

function hapusTransaksi(index) {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
        transaksiList.splice(index, 1);
        hitungKas();
    }
}

function cetakPDF() {
    const element = document.getElementById('pdf-content');
    const options = {
        margin:       10,
        filename:     'Laporan_Kas_Kreasikita_Membrane.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(options).save();
}