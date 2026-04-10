window.dataTransparansiSemua = [];
window.isUserAdmin = false;

window.loadDosenTransparansi = function() {
    const userSession = JSON.parse(sessionStorage.getItem("user"));
    if (!userSession) return;

    window.isUserAdmin = typeof ADMIN !== 'undefined' && ADMIN.includes(userSession.email);
    
    // 1. CEK STATUS MASA PENGAJUAN (ON/OFF) TERLEBIH DAHULU
    fetch(GAS_TRANSPARANSI, { method: 'POST', body: JSON.stringify({ action: "get_status" }) })
    .then(res => res.json())
    .then(resStatus => {
        const masaAktif = resStatus.data === "ON";

        // JIKA OFF & BUKAN ADMIN -> USIR DOSEN
        if (!window.isUserAdmin && !masaAktif) {
            Swal.fire({
                icon: 'warning',
                title: 'Akses Ditutup',
                text: 'Masa sanggah/pengajuan transparansi nilai sedang ditutup oleh Admin.',
                confirmButtonColor: '#0d6efd'
            }).then(() => {
                // Kosongkan layar agar data tidak bocor
                document.getElementById("mainContent").innerHTML = `
                    <div class='text-center mt-5 py-5'>
                        <i class='bi bi-lock-fill text-secondary' style='font-size: 4rem;'></i>
                        <h4 class='mt-3 text-secondary'>Masa Transparansi Ditutup</h4>
                    </div>`;
            });
            return; // Hentikan eksekusi script di sini
        }

        // JIKA ADMIN -> MUNCULKAN & SET TOGGLE
        if (window.isUserAdmin) {
            const toggleCont = document.getElementById("adminToggleContainer");
            const toggleBtn = document.getElementById("toggleTransparansi");
            const toggleLbl = document.getElementById("labelToggle");
            
            if (toggleCont) toggleCont.classList.remove("d-none");
            if (toggleBtn) toggleBtn.checked = masaAktif;
            if (toggleLbl) {
                toggleLbl.textContent = "Masa Pengajuan: " + (masaAktif ? "ON" : "OFF");
                toggleLbl.className = masaAktif ? "form-check-label fw-bold mt-1 ms-1 text-success" : "form-check-label fw-bold mt-1 ms-1 text-danger";
            }
        }

        // 2. LANJUTKAN RENDER UI (Karena ON, atau karena user adalah Admin)
        const tbAktif = document.getElementById("tbDosenTransAktif");
        const tbSelesai = document.getElementById("tbDosenTransSelesai");
        if (tbAktif && tbSelesai) {
            const colspan = window.isUserAdmin ? 8 : 7;
            tbAktif.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Memuat...</td></tr>`;
            tbSelesai.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Memuat...</td></tr>`;
        }

        const sub = document.getElementById("subjudulTransparansiDosen");
        if(sub) sub.innerHTML = window.isUserAdmin 
            ? `<span class="badge bg-warning text-dark me-1">Mode Admin</span> Memantau seluruh pengajuan mahasiswa.`
            : `<i class="bi bi-envelope-check me-1"></i> Menampilkan pengajuan yang ditujukan ke: <b>${userSession.email}</b>`;

        // Tarik Data Tabel
        fetch(GAS_TRANSPARANSI, {
            method: 'POST',
            body: JSON.stringify({ action: "get_transparansi_dosen", email: userSession.email, is_admin: window.isUserAdmin })
        }).then(res => res.json()).then(response => {
            if (response.status === "ok") {
                window.dataTransparansiSemua = response.data.reverse(); 
                window.renderTabelDosenTransparansi();
            }
        });
    });
};

// --- FUNGSI BARU UNTUK ADMIN MENGUBAH STATUS ---
window.ubahStatusTransparansi = function(checkbox) {
    const newState = checkbox.checked ? "ON" : "OFF";
    Swal.fire({ title: 'Mengubah Status...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    fetch(GAS_TRANSPARANSI, {
        method: 'POST',
        body: JSON.stringify({ action: "set_status", state: newState })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            Swal.fire("Berhasil", `Masa pengajuan transparansi telah diubah menjadi <b>${newState}</b>.`, "success");
            const toggleLbl = document.getElementById("labelToggle");
            if (toggleLbl) {
                toggleLbl.textContent = "Masa Pengajuan: " + newState;
                toggleLbl.className = checkbox.checked ? "form-check-label fw-bold mt-1 ms-1 text-success" : "form-check-label fw-bold mt-1 ms-1 text-danger";
            }
        }
    });
};

window.renderTabelDosenTransparansi = function() {
    const tbAktif = document.getElementById("tbDosenTransAktif");
    const tbSelesai = document.getElementById("tbDosenTransSelesai");
    if (!tbAktif || !tbSelesai) return;

    // Atur visibilitas header "Dosen Pengampu"
    document.querySelectorAll('.th-dosen').forEach(th => {
        if (window.isUserAdmin) th.classList.remove('d-none');
        else th.classList.add('d-none');
    });

    let htmlAktif = "";
    let htmlSelesai = "";
    let noAktif = 1;

    window.dataTransparansiSemua.forEach(item => {
        // Jika Admin, tambahkan sel (td) untuk nama Dosen
        const tdDosen = window.isUserAdmin ? `<td><span class="badge bg-light text-dark border">${item.dosen}</span></td>` : '';

        if (item.status === "Diajukan") {
            htmlAktif += `
                <tr>
                    <td class="ps-3 fw-bold text-muted">${noAktif++}</td>
                    <td>${item.tgl_pengajuan}</td>
                    <td class="fw-semibold">${item.nim}</td>
                    <td>${item.nama}</td>
                    <td>${item.matkul}</td>
                    <td>${item.kelas}</td>
                    ${tdDosen}
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary py-1 px-2 fw-bold shadow-sm" onclick="window.bukaModalProses('${item.no}')">
                            <i class="bi bi-pencil-square"></i> Berikan
                        </button>
                    </td>
                </tr>`;
        } else if (item.status === "Dikonfirmasi") {
            htmlSelesai += `
                <tr>
                    <td class="ps-3">${item.tgl_pengajuan}</td>
                    <td class="fw-bold text-success">${item.tgl_selesai}</td>
                    <td>${item.nim}</td>
                    <td class="fw-semibold">${item.nama}</td>
                    <td>${item.matkul}</td>
                    <td>${item.kelas}</td>
                    ${tdDosen}
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-success py-1 px-2 fw-bold" onclick="window.bukaModalDetail('${item.no}')">
                            <i class="bi bi-eye"></i> Detail
                        </button>
                    </td>
                </tr>`;
        }
    });

    const colspan = window.isUserAdmin ? 8 : 7;
    tbAktif.innerHTML = htmlAktif || `<tr><td colspan="${colspan}" class="text-center py-4 text-muted"><i class="bi bi-check-circle text-success fs-4 d-block mb-2"></i>Tidak ada pengajuan yang menunggu konfirmasi Anda.</td></tr>`;
    tbSelesai.innerHTML = htmlSelesai || `<tr><td colspan="${colspan}" class="text-center py-4 text-muted">Belum ada data yang dikonfirmasi.</td></tr>`;
};

// --- MODAL 1: PROSES BERIKAN TRANSPARANSI ---
window.bukaModalProses = function(no) {
    const item = window.dataTransparansiSemua.find(d => String(d.no) === String(no));
    if (!item) return;

    document.getElementById("prsNo").value = item.no;
    document.getElementById("prsTgl").textContent = item.tgl_pengajuan;
    document.getElementById("prsNim").textContent = item.nim;
    document.getElementById("prsNama").textContent = item.nama;
    document.getElementById("prsMatkul").textContent = item.matkul;
    document.getElementById("prsKelas").textContent = item.kelas;
    document.getElementById("prsHal").textContent = item.hal;
    document.getElementById("prsAlasan").textContent = item.alasan;

    document.getElementById("prsNilai").value = "";
    document.getElementById("prsAlasanDosen").value = "";

    const modal = new bootstrap.Modal(document.getElementById('modalProsesTransparansi'));
    modal.show();
};

window.simpanProsesTransparansi = function() {
    const nilai = document.getElementById("prsNilai").value;
    const alasanDosen = document.getElementById("prsAlasanDosen").value;

    if (!nilai || !alasanDosen.trim()) {
        return Swal.fire("Peringatan", "Harap pilih nilai akhir dan berikan alasan yang mendasarinya.", "warning");
    }

    Swal.fire({
        title: 'Kirim Keputusan?',
        text: "Pastikan nilai dan alasan sudah benar. Data yang dikirim akan langsung masuk ke Dashboard Mahasiswa.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754', 
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Kirim Transparansi!'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menyimpan Data...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            const today = new Date();
            const tglSelesai = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

            const payload = {
                action: "proses_transparansi",
                no: document.getElementById("prsNo").value,
                tgl_selesai: tglSelesai,
                nilai_hasil: nilai,
                alasan_keputusan: alasanDosen
            };

            fetch(GAS_TRANSPARANSI, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    Swal.fire("Selesai!", "Transparansi nilai telah berhasil diberikan.", "success").then(() => {
                        bootstrap.Modal.getInstance(document.getElementById('modalProsesTransparansi')).hide();
                        window.loadDosenTransparansi(); 
                    });
                } else {
                    Swal.fire("Gagal", data.message, "error");
                }
            });
        }
    });
};

// --- MODAL 2: LIHAT DETAIL SELESAI ---
window.bukaModalDetail = function(no) {
    const item = window.dataTransparansiSemua.find(d => String(d.no) === String(no));
    if (!item) return;

    document.getElementById("dtlMatkul").textContent = `${item.matkul} (Kelas ${item.kelas})`;
    document.getElementById("dtlNama").textContent = item.nama;
    document.getElementById("dtlNim").textContent = item.nim;
    document.getElementById("dtlTglMulai").textContent = item.tgl_pengajuan;
    document.getElementById("dtlTglSelesai").textContent = item.tgl_selesai;
    document.getElementById("dtlDosen").textContent = item.dosen;
    
    document.getElementById("dtlHal").textContent = item.hal;
    document.getElementById("dtlAlasan").textContent = item.alasan;
    document.getElementById("dtlNilai").textContent = item.nilai_hasil;
    document.getElementById("dtlAlasanDosen").textContent = item.alasan_keputusan;

    const modal = new bootstrap.Modal(document.getElementById('modalDetailTransparansi'));
    modal.show();
};

window.loadDosenTransparansi();