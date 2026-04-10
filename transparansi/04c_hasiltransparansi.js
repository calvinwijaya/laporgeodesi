window.loadHasilTransparansi = function() {
    const container = document.getElementById("containerHasilTransparansi");
    if (!container) return;
    
    container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-success" role="status"></div><p class="mt-2 text-muted">Mengecek hasil konfirmasi...</p></div>`;

    const userSession = JSON.parse(sessionStorage.getItem("user"));
    fetch(GAS_TRANSPARANSI, {
        method: 'POST',
        body: JSON.stringify({ action: "get_transparansi_mhs", nim: userSession.nim })
    })
    .then(res => res.json())
    .then(response => {
        if (response.status === "ok") {
            // FILTER: Hanya yang statusnya "Dikonfirmasi"
            const dataHasil = response.data.filter(item => item.status === "Dikonfirmasi").reverse();
            window.renderHasilCards(dataHasil);
        }
    });
};

window.renderHasilCards = function(data) {
    const container = document.getElementById("containerHasilTransparansi");
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-info-circle fs-1 text-muted"></i>
                <h5 class="mt-3 text-secondary">Belum ada hasil transparansi.</h5>
                <p class="small text-muted">Semua pengajuan masih dalam tahap konfirmasi ke Dosen Pengampu.</p>
            </div>`;
        return;
    }

    let html = "";
    data.forEach(item => {
        html += `
            <div class="col-md-12">
                <div class="card shadow-sm border-0 rounded-4 h-100 border-start border-4 border-success">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between mb-3">
                            <span class="badge bg-success"><i class="bi bi-check-all me-1"></i>Dikonfirmasi</span>
                            <small class="text-muted fw-bold">No. Pengajuan: #${item.no}</small>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <h5 class="fw-bold text-dark mb-1">${item.matkul}</h5>
                                <p class="text-muted"><i class="bi bi-person-badge me-2"></i>${item.dosen} (Kelas ${item.kelas})</p>
                                <hr>
                                <div class="mb-2 small"><strong>Tanggal Pengajuan:</strong> ${item.tanggal}</div>
                                <div class="mb-2 small"><strong>Tanggal Konfirmasi Dosen:</strong> <span class="text-success fw-bold">${item.tgl_selesai}</span></div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="p-3 bg-white rounded-3 border">
                                    <div class="small fw-bold text-secondary mb-1">Hal yang Dikonfirmasi:</div>
                                    <p class="small mb-2 italic">${item.hal}</p>
                                    <div class="small fw-bold text-secondary mb-1">Alasan Mahasiswa:</div>
                                    <p class="small mb-0 text-muted">${item.alasan}</p>
                                </div>
                            </div>
                        </div>

                        <div class="card border-success bg-success bg-opacity-10 rounded-3 mt-2">
                            <div class="card-body">
                                <h6 class="fw-bold text-success mb-2"><i class="bi bi-chat-left-dots-fill me-2"></i>Tanggapan & Hasil Nilai</h6>
                                <div class="row">
                                    <div class="col-md-4 mb-2">
                                        <div class="small fw-bold">Nilai Akhir Hasil Konfirmasi:</div>
                                        <div class="display-6 fw-bold text-success">${item.nilai_hasil}</div>
                                    </div>
                                    <div class="col-md-8">
                                        <div class="small fw-bold">Alasan Keputusan Dosen:</div>
                                        <p class="small mb-0 text-dark">${item.alasan_keputusan}</p>
                                    </div>
                                    <div class="col-md-8">
                                        <div class="small fw-bold">Alasan Keputusan Dosen:</div>
                                        <p class="small mb-0 text-dark">${item.alasan_keputusan}</p>
                                        
                                        ${(item.gambar_bukti && item.gambar_bukti.startsWith("data:image")) 
                                            ? `<div class="mt-2"><div class="small fw-bold mb-1">Lampiran Dosen:</div>
                                               <img src="${item.gambar_bukti}" class="img-fluid rounded border shadow-sm" style="max-height: 200px;"></div>` 
                                            : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
};

window.loadHasilTransparansi();