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
                document.getElementById("mainContent").innerHTML = `
                    <div class='text-center mt-5 py-5'>
                        <i class='bi bi-calendar-x-fill text-danger' style='font-size: 4rem;'></i>
                        <h4 class='mt-3 text-secondary'>Masa Transparansi Telah Ditutup</h4>
                        <p class="text-muted">Anda hanya bisa melihat riwayat pengajuan Anda di menu Pantau dan Hasil.</p>
                    </div>`;
            });
            return;
        }

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

        // 3. Fetch Datalist Matkul & Dosen secara pararel dengan Safety Check SPA
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

        // 4. Proses Ekstraksi String Nama & Email Dosen Mandiri
        function ekstrakDosen(idInput) {
            const inputVal = document.getElementById(idInput).value.trim();
            if (!inputVal) return { nama: "-", email: "-" };
            
            if (inputVal.includes("|")) {
                const parts = inputVal.split("|");
                return { nama: parts[0].trim(), email: parts[1].trim() };
            }
            return { nama: inputVal, email: "-" };
        }

        // // 5. Tangani Proses Submit
        // const form = document.getElementById("formTransparansi");
        // if (form) {
        //     form.onsubmit = function(e) {
        //         e.preventDefault(); 
                
        //         const userCaptcha = parseInt(document.getElementById("trCaptcha").value);
        //         if (userCaptcha !== captchaAnswer) {
        //             Swal.fire("Captcha Salah", "Jawaban matematika Anda kurang tepat. Silakan coba lagi.", "warning");
        //             generateCaptcha();
        //             return;
        //         }

        //         // --- LOGIKA BARU: FILTER MATA KULIAH PILOT PROJECT ---
        //         const selectedMatkul = document.getElementById("trMatkul").value;
        //         const allowedMK = [
        //             "TKD213607", // Praktikum Analisis Citra Penginderaan Jauh
        //             "TKD213609", // Praktikum Analisis Geospasial
        //             "TKD212407", // Praktikum Grafika Komputer dan Visualisasi
        //             "TKD211207", // Praktikum Sistem Basisdata
        //             "TKD211211", // Praktikum Survei Terestris II
        //             "TKD213510"  // Praktikum Survei Kadastral
        //         ];

        //         // Cek apakah MK yang diketik/dipilih mengandung salah satu kode di atas
        //         const isAllowed = allowedMK.some(kode => selectedMatkul.includes(kode));

        //         if (!isAllowed) {
        //             Swal.fire({
        //                 title: 'Mata Kuliah Belum Terdaftar',
        //                 html: 'Maaf, saat ini Pengajuan Transparansi hanya bisa dilakukan untuk MK-MK yang diajar oleh Mas Calvin sebagai <i>testing</i> dan <i>Pilot Project</i>. <br><br>Untuk MK lain akan melalui form dari Prodi. Mohon maaf atas ketidaknyamanannya, saya berusaha mengajukan ini ke Prodi.',
        //                 icon: 'info',
        //                 confirmButtonText: 'Mengerti',
        //                 confirmButtonColor: '#0d6efd'
        //             });
        //             return; // Hentikan proses submit
        //         }
        //         // -----------------------------------------------------

        //         // Ekstrak Tim Dosen Pengampu 1, 2, dan 3
        //         const dosen1 = ekstrakDosen("trDosen1");
        //         const dosen2 = ekstrakDosen("trDosen2");
        //         const dosen3 = ekstrakDosen("trDosen3");

        //         const today = new Date();
        //         const tglDiajukan = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

        //         // Integrasi data ke Payload
        //         const payload = {
        //             action: "submit_transparansi",
        //             tanggal_pengajuan: tglDiajukan,
        //             nim: userSession.nim || "-",
        //             niu: userSession.niu || "-",
        //             nama: userSession.nama,
        //             email: userSession.email,
        //             matkul: selectedMatkul,
        //             kelas: document.getElementById("trKelas").value,
        //             nilai_saat_ini: document.getElementById("trNilai").value,
        //             dosen_nama1: dosen1.nama,
        //             dosen_email1: dosen1.email,
        //             dosen_nama2: dosen2.nama,
        //             dosen_email2: dosen2.email,
        //             dosen_nama3: dosen3.nama,
        //             dosen_email3: dosen3.email,
        //             hal_konfirmasi: document.getElementById("trHal").value,
        //             alasan_mendasari: document.getElementById("trAlasan").value
        //         };

        //         Swal.fire({
        //             title: 'Konfirmasi Pengajuan',
        //             text: "Apakah Anda yakin data pengajuan transparansi ini sudah valid?",
        //             icon: 'question',
        //             showCancelButton: true,
        //             confirmButtonColor: '#0d6efd',
        //             cancelButtonColor: '#6c757d',
        //             confirmButtonText: 'Ya, Ajukan!',
        //             cancelButtonText: 'Batal',
        //             reverseButtons: true
        //         }).then((result) => {
        //             if (result.isConfirmed) {
        //                 Swal.fire({ title: 'Mengirim Pengajuan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        //                 fetch(GAS_TRANSPARANSI, {
        //                     method: 'POST',
        //                     body: JSON.stringify(payload)
        //                 })
        //                 .then(res => res.json())
        //                 .then(data => {
        //                     if (data.status === "ok") {
        //                         Swal.fire("Berhasil", "Pengajuan transparansi Anda telah masuk ke sistem. Anda dapat memantaunya di menu Pantau Pengajuan.", "success")
        //                         .then(() => {
        //                             form.reset();
        //                             const trNama = document.getElementById("trNama");
        //                             const trNim = document.getElementById("trNim");
        //                             if (trNama) trNama.value = userSession.nama;
        //                             if (trNim) trNim.value = userSession.nim || "-";
        //                             generateCaptcha();
        //                         });
        //                     } else {
        //                         Swal.fire('Gagal', data.message, 'error');
        //                     }
        //                 })
        //                 .catch(err => {
        //                     console.error(err);
        //                     Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
        //                 });
        //             }
        //         });
        //     };
        // }
        // 5. Tangani Proses Submit
        const form = document.getElementById("formTransparansi");
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault(); 
                
                const userCaptcha = parseInt(document.getElementById("trCaptcha").value);
                if (userCaptcha !== captchaAnswer) {
                    Swal.fire("Captcha Salah", "Jawaban matematika Anda kurang tepat. Silakan coba lagi.", "warning");
                    generateCaptcha();
                    return;
                }

                // (Filter MK Pilot Project telah dihapus di sini, sehingga semua MK lolos)

                // Ekstrak Tim Dosen Pengampu 1, 2, dan 3
                const dosen1 = ekstrakDosen("trDosen1");
                const dosen2 = ekstrakDosen("trDosen2");
                const dosen3 = ekstrakDosen("trDosen3");

                const today = new Date();
                const tglDiajukan = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

                // Integrasi data ke Payload
                const payload = {
                    action: "submit_transparansi",
                    tanggal_pengajuan: tglDiajukan,
                    nim: userSession.nim || "-",
                    niu: userSession.niu || "-",
                    nama: userSession.nama,
                    email: userSession.email,
                    matkul: document.getElementById("trMatkul").value,
                    kelas: document.getElementById("trKelas").value,
                    nilai_saat_ini: document.getElementById("trNilai").value,
                    dosen_nama1: dosen1.nama,
                    dosen_email1: dosen1.email,
                    dosen_nama2: dosen2.nama,
                    dosen_email2: dosen2.email,
                    dosen_nama3: dosen3.nama,
                    dosen_email3: dosen3.email,
                    hal_konfirmasi: document.getElementById("trHal").value,
                    alasan_mendasari: document.getElementById("trAlasan").value
                };

                Swal.fire({
                    title: 'Konfirmasi Pengajuan',
                    text: "Apakah Anda yakin data pengajuan transparansi ini sudah valid?",
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
    });
})();