// Gunakan Window object agar aman dari error redeclaration di sistem SPA
window.dataPengajuanMhs = window.dataPengajuanMhs || [];

window.loadPantauTransparansi = function() {
    const container = document.getElementById("containerCardPengajuan");
    if (!container) return;
    
    container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Memuat data pengajuan...</p></div>`;

    const userSession = JSON.parse(sessionStorage.getItem("user"));
    if (!userSession || !userSession.nim) {
        container.innerHTML = `<div class="col-12 text-center text-danger py-4">Gagal memuat sesi pengguna.</div>`;
        return;
    }

    fetch(GAS_TRANSPARANSI, {
        method: 'POST',
        body: JSON.stringify({ action: "get_transparansi_mhs", nim: userSession.nim })
    })
    .then(res => res.json())
    .then(response => {
        if (response.status === "ok") {
            // FILTER: Hanya yang statusnya "Diajukan"
            window.dataPengajuanMhs = response.data.filter(item => item.status === "Diajukan").reverse();
            window.renderCardPengajuan(window.dataPengajuanMhs);
        } else {
            container.innerHTML = `<div class="col-12 text-center text-danger py-4">Gagal mengambil data dari server.</div>`;
        }
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = `<div class="col-12 text-center text-danger py-4">Koneksi bermasalah dengan server.</div>`;
    });
};

window.renderCardPengajuan = function(data) {
    const container = document.getElementById("containerCardPengajuan");
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-check-circle-fill fs-1 text-success"></i>
                <h5 class="mt-3 text-secondary">Tidak ada pengajuan aktif.</h5>
                <p class="small text-muted">Semua pengajuan mungkin sudah selesai dikonfirmasi atau belum diajukan.</p>
            </div>`;
        return;
    }

    let html = "";
    data.forEach(item => {
        // Gabungkan teks Dosen Pengampu yang ada
        let infoDosen = `<li>${item.dosen1}</li>`;
        if (item.dosen2 && item.dosen2 !== "-") infoDosen += `<li>${item.dosen2}</li>`;
        if (item.dosen3 && item.dosen3 !== "-") infoDosen += `<li>${item.dosen3}</li>`;

        html += `
            <div class="col-md-6">
                <div class="card shadow-sm border-0 rounded-4 h-100 border-start border-4 border-primary">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="badge bg-primary">Diajukan</span>
                            <small class="text-muted fw-bold">#${item.no}</small>
                        </div>
                        <h6 class="fw-bold text-dark mb-2">${item.matkul}</h6>
                        
                        <div class="row g-2 mb-2 bg-light p-2 rounded border mx-0 small">
                            <div class="col-6"><strong>Kelas:</strong> ${item.kelas}</div>
                            <div class="col-6 text-end"><strong>Nilai Awal:</strong> <span class="badge bg-danger">${item.nilai_awal}</span></div>
                        </div>

                        <div class="small text-muted mb-2">
                            <strong class="d-block text-secondary small fw-bold">Tim Dosen Pengampu:</strong>
                            <ul class="mb-0 ps-3 style-none small">${infoDosen}</ul>
                        </div>
                        <hr class="my-2">
                        <div class="small mb-1"><strong>Hal Dikonfirmasi:</strong> ${item.hal}</div>
                        <div class="small mb-2"><strong>Alasan Mahasiswa:</strong> <span class="text-muted fst-italic">"${item.alasan}"</span></div>
                        
                        <div class="d-flex gap-2 justify-content-end mt-3">
                            <button class="btn btn-sm btn-outline-warning text-dark fw-bold" onclick="window.bukaModalEditT('${item.no}')">
                                <i class="bi bi-pencil-square"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger fw-bold" onclick="window.hapusTransparansi('${item.no}')">
                                <i class="bi bi-trash"></i> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
};

// --- FUNGSI TAMPIL MODAL EDIT ---
window.bukaModalEditT = function(no) {
    const item = window.dataPengajuanMhs.find(d => String(d.no) === String(no));
    if (!item) return;

    // Isi formulir penampung data (Data Mata Kuliah dan Tim Dosen dikunci via HTML)
    document.getElementById("editNo").value = item.no;
    document.getElementById("editMatkul").value = item.matkul;
    document.getElementById("editKelas").value = item.kelas;
    document.getElementById("editNilai").value = item.nilai_awal;
    
    document.getElementById("editDosen1").value = item.dosen1;
    document.getElementById("editDosen2").value = item.dosen2 || "-";
    document.getElementById("editDosen3").value = item.dosen3 || "-";
    
    document.getElementById("editHal").value = item.hal;
    document.getElementById("editAlasan").value = item.alasan;

    const modalElement = document.getElementById('modalEditTransparansi');
    if(modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
};

// --- SIMPAN UPDATE DATA KE SPREADSHEET VIA GAS ---
window.simpanEditTransparansi = function() {
    const no = document.getElementById("editNo").value;
    
    // Tarik data payload terstruktur menyesuaikan arsitektur database baru A-V
    const payload = {
        action: "edit_transparansi",
        no: no,
        matkul: document.getElementById("editMatkul").value,
        kelas: document.getElementById("editKelas").value,
        nilai_saat_ini: document.getElementById("editNilai").value,
        dosen_nama1: document.getElementById("editDosen1").value,
        dosen_email1: "-", // Biarkan dicari otomatis oleh sistem backend / tetap memakai struktur submit awal
        dosen_nama2: document.getElementById("editDosen2").value,
        dosen_email2: "-",
        dosen_nama3: document.getElementById("editDosen3").value,
        dosen_email3: "-",
        hal: document.getElementById("editHal").value,
        alasan: document.getElementById("editAlasan").value
    };

    Swal.fire({ title: 'Menyimpan Perubahan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    fetch(GAS_TRANSPARANSI, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            Swal.fire("Berhasil", "Data pengajuan berhasil diperbarui secara permanen.", "success").then(() => {
                const modalEl = document.getElementById('modalEditTransparansi');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if(modalInstance) modalInstance.hide();
                
                window.loadPantauTransparansi(); 
            });
        } else {
            Swal.fire("Gagal", data.message, "error");
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire("Error", "Gagal menghubungi server database.", "error");
    });
};

// --- FUNGSI HAPUS DATA ---
window.hapusTransparansi = function(no) {
    Swal.fire({
        title: 'Hapus Pengajuan?',
        text: "Anda yakin ingin membatalkan dan menghapus permanen pengajuan transparansi ini?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            fetch(GAS_TRANSPARANSI, {
                method: 'POST',
                body: JSON.stringify({ action: "delete_transparansi", no: no })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    Swal.fire("Terhapus", "Pengajuan berhasil dibatalkan.", "success").then(() => window.loadPantauTransparansi());
                } else {
                    Swal.fire("Gagal", data.message, "error");
                }
            })
            .catch(err => Swal.fire("Error", "Gagal menghubungi server.", "error"));
        }
    });
};

// Eksekusi otomatis pemuatan data saat halaman SPA dibuka
window.loadPantauTransparansi();