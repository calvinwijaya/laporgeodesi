(function initSelfReport() {
    // 1. Ambil Data Session (Nama dan NIM)
    const userSession = JSON.parse(sessionStorage.getItem("user"));
    
    if (userSession) {
        const srNama = document.getElementById("srNama");
        const srNim = document.getElementById("srNim");

        if (srNama) srNama.value = userSession.nama;
        
        if (srNim && userSession.nim && userSession.nim !== "-") {
            srNim.value = userSession.nim;
            srNim.readOnly = true;
            srNim.classList.add("bg-light");
        }
    }

    // 2. Set Tanggal Default ke Hari Ini
    const srTanggal = document.getElementById("srTanggal");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); 
    const dd = String(today.getDate()).padStart(2, '0');
    
    if (srTanggal) {
        srTanggal.value = `${yyyy}-${mm}-${dd}`;
    }

    // --- TAMBAHAN LOGIKA DROPDOWN DINAMIS ---
    const srJenis = document.getElementById("srJenis");
    const wrapperUjian = document.getElementById("wrapperUjian");
    const srUjian = document.getElementById("srUjian");

    if (srJenis && wrapperUjian && srUjian) {
        srJenis.addEventListener("change", function() {
            if (this.value === "Terlambat mengikuti ujian") {
                // Tampilkan opsi ujian
                wrapperUjian.classList.remove("d-none");
                srUjian.required = true; // Wajib diisi
            } else {
                // Sembunyikan dan reset
                wrapperUjian.classList.add("d-none");
                srUjian.required = false;
                srUjian.value = ""; 
            }
        });
    }
    // ---------------------------------------

    // 3. Tangani Proses Submit
    const form = document.getElementById("formSelfReport");
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault(); 

            // Format Tanggal
            const rawDate = document.getElementById("srTanggal").value; 
            const [year, month, day] = rawDate.split("-");
            const formattedDate = `${day}/${month}/${year}`;

            // --- TAMBAHAN LOGIKA PENGGABUNGAN TEKS ---
            let finalKeterangan = document.getElementById("srKeterangan").value;
            const jenisDipilih = document.getElementById("srJenis").value;

            // Jika dia memilih terlambat ujian, gabungkan teksnya
            if (jenisDipilih === "Terlambat mengikuti ujian") {
                const ujianDipilih = document.getElementById("srUjian").value;
                // Hasil format: "UTS Genap 25/26 - karena ketiduran"
                finalKeterangan = `${ujianDipilih} - ${finalKeterangan}`;
            }
            // -----------------------------------------

            // Siapkan payload data
            const payload = {
                action: "self_report",
                tanggal: formattedDate,
                jenis: jenisDipilih,
                nim: document.getElementById("srNim").value,
                niu: userSession.niu || "-",
                nama: document.getElementById("srNama").value,
                keterangan: finalKeterangan, // Masukkan teks yang sudah digabung
                link: document.getElementById("srLink").value || "-",
                laporan_oleh: "Diri Sendiri"
            };

            Swal.fire({
                title: 'Mengirim Laporan...',
                text: 'Mohon tunggu, sistem sedang mencatat data Anda.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetch(GAS_PELANGGARAN, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: 'Laporan Anda telah tercatat dalam sistem.',
                        confirmButtonColor: '#1e7e34'
                    }).then(() => {
                        form.reset();
                        // Kembalikan ke kondisi semula
                        document.getElementById("srNama").value = userSession.nama;
                        if (userSession.nim && userSession.nim !== "-") {
                            document.getElementById("srNim").value = userSession.nim;
                        }
                        document.getElementById("srTanggal").value = `${yyyy}-${mm}-${dd}`;
                        
                        // Sembunyikan kolom ujian kembali
                        wrapperUjian.classList.add("d-none");
                        srUjian.required = false;
                    });
                } else {
                    Swal.fire('Gagal', data.message || 'Terjadi kesalahan di server.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire('Error', 'Gagal terhubung ke server. Pastikan koneksi internet stabil.', 'error');
            });
        };
    }
})();