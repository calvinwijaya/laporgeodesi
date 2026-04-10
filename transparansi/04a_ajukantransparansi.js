(function initTransparansi() {
    let captchaAnswer = 0;

    const userSession = JSON.parse(sessionStorage.getItem("user"));
    if (userSession) {
        const trNama = document.getElementById("trNama");
        const trNim = document.getElementById("trNim");
        if (trNama) trNama.value = userSession.nama;
        if (trNim) trNim.value = userSession.nim || "-";
    }

    // --- CEK STATUS MASA PENGAJUAN (ON/OFF) ---
    fetch(GAS_TRANSPARANSI, { method: 'POST', body: JSON.stringify({ action: "get_status" }) })
    .then(res => res.json())
    .then(resStatus => {
        if (resStatus.data === "OFF") {
            Swal.fire({
                icon: 'warning',
                title: 'Masa Pengajuan Ditutup',
                text: 'Mohon maaf, masa pengajuan transparansi nilai saat ini sedang ditutup.',
                confirmButtonColor: '#0d6efd'
            }).then(() => {
                // Hapus form dari layar
                document.getElementById("mainContent").innerHTML = `
                    <div class='text-center mt-5 py-5'>
                        <i class='bi bi-calendar-x-fill text-danger' style='font-size: 4rem;'></i>
                        <h4 class='mt-3 text-secondary'>Masa Transparansi Telah Ditutup</h4>
                        <p class="text-muted">Anda hanya bisa melihat riwayat pengajuan Anda di menu Pantau dan Hasil.</p>
                    </div>`;
            });
            return; // Hentikan script
        }

        // JIKA "ON", LANJUTKAN RENDER HALAMAN PENGAJUAN SEPERTI BIASA
        
        // 2. Generate Math Captcha
        function generateCaptcha() {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            captchaAnswer = num1 + num2;
            const cq = document.getElementById("captchaQuestion");
            const tc = document.getElementById("trCaptcha");
            if(cq) cq.innerText = `Berapa hasil dari ${num1} + ${num2}?`;
            if(tc) tc.value = "";
        }
        generateCaptcha();

        // 3. Fetch Datalist Matkul & Dosen secara pararel
        if (typeof GAS_TRANSPARANSI !== 'undefined') {
            fetch(GAS_TRANSPARANSI, { method: 'POST', body: JSON.stringify({ action: "get_matkul" }) })
            .then(res => res.json()).then(data => {
                if (data.status === "ok") {
                    const list = document.getElementById("listMatkul");
                    if (list) data.data.forEach(mk => list.insertAdjacentHTML('beforeend', `<option value="${mk}">`));
                }
            });

            fetch(GAS_TRANSPARANSI, { method: 'POST', body: JSON.stringify({ action: "get_dosen" }) })
            .then(res => res.json()).then(data => {
                if (data.status === "ok") {
                    const list = document.getElementById("listDosen");
                    if (list) data.data.forEach(dos => list.insertAdjacentHTML('beforeend', `<option value="${dos}">`));
                }
            });
        }

        // 4. Tangani Proses Submit (Sisanya sama persis seperti kode Anda sebelumnya...)
        const form = document.getElementById("formTransparansi");
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault(); 
                // ... (Masukkan kode validasi captcha, payload, dan fetch submit di sini) ...
                
                const userCaptcha = parseInt(document.getElementById("trCaptcha").value);
                if (userCaptcha !== captchaAnswer) {
                    Swal.fire("Captcha Salah", "Jawaban matematika Anda kurang tepat. Silakan coba lagi.", "warning");
                    generateCaptcha();
                    return;
                }

                const inputDosen = document.getElementById("trDosen").value;
                let dosenNama = inputDosen;
                let dosenEmail = "-";
                if (inputDosen.includes("|")) {
                    const parts = inputDosen.split("|");
                    dosenNama = parts[0].trim();
                    dosenEmail = parts[1].trim();
                }

                const today = new Date();
                const tglDiajukan = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

                const payload = {
                    action: "submit_transparansi",
                    tanggal_pengajuan: tglDiajukan,
                    nim: userSession.nim || "-",
                    niu: userSession.niu || "-",
                    nama: userSession.nama,
                    email: userSession.email,
                    matkul: document.getElementById("trMatkul").value,
                    kelas: document.getElementById("trKelas").value,
                    dosen_nama: dosenNama,
                    dosen_email: dosenEmail,
                    hal_konfirmasi: document.getElementById("trHal").value,
                    alasan_mendasari: document.getElementById("trAlasan").value
                };

                Swal.fire({
                    title: 'Konfirmasi Pengajuan',
                    text: "Apakah Anda yakin data yang dimasukkan sudah benar?",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#0d6efd',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Ya, Ajukan!',
                    cancelButtonText: 'Batal',
                    reverseButtons: true
                }).then((result) => {
                    if (result.isConfirmed) {
                        Swal.fire({ title: 'Mengirim Pengajuan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                        fetch(GAS_TRANSPARANSI, {
                            method: 'POST',
                            body: JSON.stringify(payload)
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.status === "ok") {
                                Swal.fire("Berhasil", "Pengajuan transparansi Anda telah masuk ke sistem. Anda dapat memantaunya di menu Pantau Pengajuan.", "success")
                                .then(() => {
                                    form.reset();
                                    const trNama = document.getElementById("trNama");
                                    const trNim = document.getElementById("trNim");
                                    if (trNama) trNama.value = userSession.nama;
                                    if (trNim) trNim.value = userSession.nim || "-";
                                    generateCaptcha();
                                });
                            } else {
                                Swal.fire('Gagal', data.message, 'error');
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
                        });
                    }
                });
            };
        }
    }); // Akhir dari Fetch Status
})();