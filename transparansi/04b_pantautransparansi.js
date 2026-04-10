// Gunakan Window object agar aman dari error redeclaration di sistem SPA
window.dataPengajuanMhs = window.dataPengajuanMhs || [];

window.loadPantauTransparansi = function() {
    const container = document.getElementById("containerCardPengajuan");
    if (!container) return;
    
    container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Memuat data pengajuan...</p></div>`;

    const userSession = JSON.parse(sessionStorage.getItem("user"));
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
        }
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
                <p class="small text-muted">Semua pengajuan mungkin sudah selesai atau belum diajukan.</p>
            </div>`;
        return;
    }

    let html = "";
    data.forEach(item => {
        html += `
            <div class="col-md-6">
                <div class="card shadow-sm border-0 rounded-4 h-100 border-start border-4 border-primary">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="badge bg-primary">Diajukan</span>
                            <small class="text-muted fw-bold">#${item.no}</small>
                        </div>
                        <h6 class="fw-bold text-dark mb-1">${item.matkul}</h6>
                        <p class="small text-muted mb-2"><i class="bi bi-person-badge"></i> ${item.dosen} (Kelas ${item.kelas})</p>
                        <hr class="my-2">
                        <div class="small mb-1"><strong>Hal:</strong> ${item.hal}</div>
                        <div class="small mb-2"><strong>Alasan:</strong> ${item.alasan}</div>
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

// --- FUNGSI EDIT ---
window.bukaModalEditT = function(no) {
    // Memastikan tipe data dicocokkan dengan aman
    const item = window.dataPengajuanMhs.find(d => String(d.no) === String(no));
    if (!item) return;

    document.getElementById("editNo").value = item.no;
    document.getElementById("editMatkul").value = item.matkul;
    document.getElementById("editKelas").value = item.kelas;
    document.getElementById("editDosen").value = item.dosen; 
    document.getElementById("editHal").value = item.hal;
    document.getElementById("editAlasan").value = item.alasan;

    window.loadDatalistEdit();

    const modalElement = document.getElementById('modalEditTransparansi');
    if(modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
};

window.loadDatalistEdit = function() {
    const dlMatkul = document.getElementById("listEditMatkul");
    const dlDosen = document.getElementById("listEditDosen");

    if (dlMatkul && dlMatkul.options.length === 0) {
        fetch(GAS_TRANSPARANSI, { method: 'POST', body: JSON.stringify({ action: "get_matkul" }) })
        .then(res => res.json()).then(data => {
            if (data.status === "ok") {
                const dl = document.getElementById("listEditMatkul"); // fetch ulang element jika telat
                if(dl) data.data.forEach(mk => dl.insertAdjacentHTML('beforeend', `<option value="${mk}">`));
            }
        });
    }

    if (dlDosen && dlDosen.options.length === 0) {
        fetch(GAS_TRANSPARANSI, { method: 'POST', body: JSON.stringify({ action: "get_dosen" }) })
        .then(res => res.json()).then(data => {
            if (data.status === "ok") {
                const dl = document.getElementById("listEditDosen");
                if(dl) data.data.forEach(dos => dl.insertAdjacentHTML('beforeend', `<option value="${dos}">`));
            }
        });
    }
};

window.simpanEditTransparansi = function() {
    const no = document.getElementById("editNo").value;
    const inputDosen = document.getElementById("editDosen").value;
    
    let dosenNama = inputDosen;
    let dosenEmail = "-";
    if (inputDosen.includes("|")) {
        const parts = inputDosen.split("|");
        dosenNama = parts[0].trim();
        dosenEmail = parts[1].trim();
    }

    const payload = {
        action: "edit_transparansi",
        no: no,
        matkul: document.getElementById("editMatkul").value,
        kelas: document.getElementById("editKelas").value,
        dosen_nama: dosenNama,
        dosen_email: dosenEmail,
        hal: document.getElementById("editHal").value,
        alasan: document.getElementById("editAlasan").value
    };

    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    fetch(GAS_TRANSPARANSI, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            Swal.fire("Berhasil", "Data pengajuan berhasil diperbarui.", "success").then(() => {
                const modalEl = document.getElementById('modalEditTransparansi');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if(modalInstance) modalInstance.hide();
                
                window.loadPantauTransparansi(); 
            });
        } else {
            Swal.fire("Gagal", data.message, "error");
        }
    })
    .catch(err => Swal.fire("Error", "Gagal menghubungi server.", "error"));
};

// --- FUNGSI HAPUS ---
window.hapusTransparansi = function(no) {
    Swal.fire({
        title: 'Hapus Pengajuan?',
        text: "Anda yakin ingin membatalkan dan menghapus pengajuan ini?",
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
                    Swal.fire("Terhapus", "Pengajuan dibatalkan.", "success").then(() => window.loadPantauTransparansi());
                } else {
                    Swal.fire("Gagal", data.message, "error");
                }
            })
            .catch(err => Swal.fire("Error", "Gagal menghubungi server.", "error"));
        }
    });
};

// Eksekusi load awal
window.loadPantauTransparansi();