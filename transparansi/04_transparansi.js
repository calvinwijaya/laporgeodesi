window.dataTransparansiSemua = [];
window.isUserAdmin = false;

window.loadDosenTransparansi = function() {
    const userSession = JSON.parse(sessionStorage.getItem("user"));
    if (!userSession) return;

    window.isUserAdmin = typeof ADMIN !== 'undefined' && ADMIN.includes(userSession.email);
    
    const tbAktif = document.getElementById("tbDosenTransAktif");
    const tbSelesai = document.getElementById("tbDosenTransSelesai");
    if (tbAktif && tbSelesai) {
        const colspan = window.isUserAdmin ? 8 : 7;
        tbAktif.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Memuat...</td></tr>`;
        tbSelesai.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Memuat...</td></tr>`;
    }

    const sub = document.getElementById("subjudulTransparansiDosen");

    fetch(GAS_TRANSPARANSI, { method: 'POST', body: JSON.stringify({ action: "get_status" }) })
    .then(res => res.json())
    .then(resStatus => {
        window.isMasaAktif = resStatus.data === "ON";

        // UBAH DISINI: Dosen biasa tetap bisa memproses, hanya ganti info teksnya saja
        if (!window.isUserAdmin && !window.isMasaAktif) {
            if(sub) sub.innerHTML = `<span class="badge bg-danger me-1">Pengajuan Baru Ditutup</span> <i class="bi bi-envelope-check ms-1 me-1"></i> Data untuk: <b>${userSession.email}</b>`;
        } else if (window.isUserAdmin) {
            const toggleCont = document.getElementById("adminToggleContainer");
            const toggleBtn = document.getElementById("toggleTransparansi");
            const toggleLbl = document.getElementById("labelToggle");
            
            if (toggleCont) toggleCont.classList.remove("d-none");
            if (toggleBtn) toggleBtn.checked = window.isMasaAktif;
            if (toggleLbl) {
                toggleLbl.textContent = "Masa Pengajuan: " + (window.isMasaAktif ? "ON" : "OFF");
                toggleLbl.className = window.isMasaAktif ? "form-check-label fw-bold mt-1 ms-1 text-success" : "form-check-label fw-bold mt-1 ms-1 text-danger";
            }
            if(sub) sub.innerHTML = `<span class="badge bg-warning text-dark me-1">Mode Admin</span> Memantau seluruh pengajuan mahasiswa.`;
        } else {
             if(sub) sub.innerHTML = `<i class="bi bi-envelope-check me-1"></i> Menampilkan pengajuan yang ditujukan ke: <b>${userSession.email}</b>`;
        }

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
        // Susun HTML Daftar Dosen (Untuk Admin)
        let listDosenAdmin = `<ul class="mb-0 ps-3 style-none text-start"><li>${item.dosen1}</li>`;
        if(item.dosen2 && item.dosen2 !== "-") listDosenAdmin += `<li>${item.dosen2}</li>`;
        if(item.dosen3 && item.dosen3 !== "-") listDosenAdmin += `<li>${item.dosen3}</li>`;
        listDosenAdmin += `</ul>`;

        const tdDosen = window.isUserAdmin ? `<td>${listDosenAdmin}</td>` : '';

        if (item.status === "Diajukan") {
            // UBAH DISINI: Hapus logika blokir, biarkan tombol "Berikan" selalu aktif
            const btnProsesHtml = `<button class="btn btn-sm btn-primary py-1 px-2 fw-bold shadow-sm" onclick="window.bukaModalProses('${item.no}')"><i class="bi bi-pencil-square"></i> Tanggapi</button>`;

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
                        ${btnProsesHtml}
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

// --- MODAL 1: PROSES BERIKAN ATAU EDIT TRANSPARANSI ---
window.bukaModalProses = function(no, isEdit = false) {
    const item = window.dataTransparansiSemua.find(d => String(d.no) === String(no));
    if (!item) return;

    // Jika ini dari tombol "Edit", tutup modal detail dulu
    if (isEdit) {
        const modalDetail = bootstrap.Modal.getInstance(document.getElementById('modalDetailTransparansi'));
        if (modalDetail) modalDetail.hide();
    }

    document.getElementById("prsNo").value = item.no;
    document.getElementById("prsTgl").textContent = item.tgl_pengajuan;
    document.getElementById("prsNim").textContent = item.nim;
    document.getElementById("prsNama").textContent = item.nama;
    document.getElementById("prsMatkul").textContent = item.matkul;
    document.getElementById("prsKelas").textContent = item.kelas;
    
    // Tampilkan Nilai Awal
    document.getElementById("prsNilaiAwal").textContent = item.nilai_awal;

    document.getElementById("prsHal").textContent = item.hal;
    document.getElementById("prsAlasan").textContent = item.alasan;

    const modalTitle = document.querySelector('#modalProsesTransparansi .modal-title');
    
    if (isEdit) {
        // Mode Edit: Isi dengan data yang sudah ada
        modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Keputusan Transparansi';
        document.getElementById("prsNilai").value = item.nilai_hasil;
        document.getElementById("prsAlasanDosen").value = item.alasan_keputusan;
        // Gambar tidak bisa di-prefill di input file karena alasan keamanan browser
        document.getElementById("prsGambarBase64").value = item.gambar_bukti !== "-" ? item.gambar_bukti : "";
    } else {
        // Mode Baru: Kosongkan
        modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Tanggapi Pengajuan Transparansi Nilai';
        document.getElementById("prsNilai").value = "";
        document.getElementById("prsAlasanDosen").value = "";
        document.getElementById("prsGambarBase64").value = "";
    }

    const inpGbr = document.getElementById("prsGambar");
    if(inpGbr) inpGbr.value = ""; // Selalu kosongkan input file visualnya

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
        text: "Pastikan nilai dan alasan sudah benar.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754', 
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Kirim!'
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
                alasan_keputusan: alasanDosen,
                gambar_bukti: document.getElementById("prsGambarBase64").value || "-"
            };

            fetch(GAS_TRANSPARANSI, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    Swal.fire("Selesai!", "Keputusan transparansi nilai telah berhasil disimpan.", "success").then(() => {
                        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalProsesTransparansi'));
                        if (modalInstance) modalInstance.hide();
                        window.loadDosenTransparansi(); 
                    });
                } else {
                    Swal.fire("Gagal", data.message, "error");
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire("Error", "Gagal menghubungi server.", "error");
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
    
    // Rangkai teks tim dosen yang rapi (Dosen 1, Dosen 2, Dosen 3)
    let dtlDosenText = item.dosen1;
    if(item.dosen2 && item.dosen2 !== "-") dtlDosenText += `, ${item.dosen2}`;
    if(item.dosen3 && item.dosen3 !== "-") dtlDosenText += `, ${item.dosen3}`;
    document.getElementById("dtlDosen").textContent = dtlDosenText;
    
    // Tampilkan Nilai Awal
    document.getElementById("dtlNilaiAwal").textContent = item.nilai_awal;
    
    document.getElementById("dtlHal").textContent = item.hal;
    document.getElementById("dtlAlasan").textContent = item.alasan;
    document.getElementById("dtlNilai").textContent = item.nilai_hasil;
    document.getElementById("dtlAlasanDosen").textContent = item.alasan_keputusan;

    const imgContainer = document.getElementById("dtlGambarContainer");
    const imgElement = document.getElementById("dtlGambar");
    
    // Jika gambar berupa teks Base64, tampilkan
    if (item.gambar_bukti && item.gambar_bukti.startsWith("data:image")) {
        imgElement.src = item.gambar_bukti;
        imgContainer.classList.remove("d-none");
    } else {
        imgElement.src = "";
        imgContainer.classList.add("d-none");
    }

    // Sambungkan tombol Edit di modal Detail ke fungsi bukaModalProses mode edit
    const btnEdit = document.getElementById("btnEditTransparansiDosen");
    if (btnEdit) {
        btnEdit.classList.remove("d-none"); // Pastikan tidak tersembunyi
        btnEdit.onclick = function() {
            window.bukaModalProses(item.no, true);
        };
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetailTransparansi'));
    modal.show();
};

// --- AUTO COMPRESS GAMBAR SAAT UPLOAD (SMART COMPRESSION) ---
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'prsGambar') {
        const file = e.target.files[0];
        if (!file) return;

        Swal.fire({ title: 'Memproses Gambar...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let MAX_WIDTH = 600; 
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                let quality = 0.6;
                let base64Str = canvas.toDataURL('image/jpeg', quality); 

                while (base64Str.length > 45000 && quality > 0.1) {
                    quality -= 0.1;
                    base64Str = canvas.toDataURL('image/jpeg', quality);
                }

                if (base64Str.length > 45000) {
                    canvas.width = width / 2;
                    canvas.height = height / 2;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    base64Str = canvas.toDataURL('image/jpeg', 0.5);
                }

                document.getElementById('prsGambarBase64').value = base64Str;
                Swal.close(); 
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// Jalankan saat load pertama kali
window.loadDosenTransparansi();