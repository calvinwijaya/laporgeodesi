(function initBuatAduan() {
    const datalist = document.getElementById("listMahasiswa");
    let daftarMahasiswaUtuh = []; // Variabel untuk menyimpan data utuh dari GAS

    // 1. Fetch List Mahasiswa dari GAS Login
    if (datalist) {
        fetch(GAS_LOGIN, {
            method: 'POST',
            body: JSON.stringify({ action: "get_mahasiswa" })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok") {
                datalist.innerHTML = "";
                daftarMahasiswaUtuh = data.user; // Simpan data utuh (nim, niu, nama)
                
                data.user.forEach(mhs => {
                    const option = document.createElement("option");
                    option.value = `${mhs.nim} - ${mhs.nama}`;
                    datalist.appendChild(option);
                });
            }
        })
        .catch(err => console.error("Gagal memuat list mahasiswa: ", err));
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

    // 3. Logika Dropdown Ujian Dinamis
    const srJenis = document.getElementById("srJenis");
    const wrapperUjianAduan = document.getElementById("wrapperUjianAduan");
    const srUjian = document.getElementById("srUjian");

    if (srJenis && wrapperUjianAduan && srUjian) {
        srJenis.addEventListener("change", function() {
            if (this.value === "Terlambat mengikuti ujian") {
                wrapperUjianAduan.classList.remove("d-none");
                srUjian.required = true;
            } else {
                wrapperUjianAduan.classList.add("d-none");
                srUjian.required = false;
                srUjian.value = ""; 
            }
        });
    }

    // 4. Tangani Proses Submit
    const form = document.getElementById("formBuatAduan");
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault(); 

            // Format Tanggal ke DD/MM/YYYY
            const rawDate = document.getElementById("srTanggal").value; 
            const [year, month, day] = rawDate.split("-");
            const formattedDate = `${day}/${month}/${year}`;

            // Pisahkan NIM dan NAMA dari input datalist
            const inputPelanggar = document.getElementById("srNamaPelanggar").value;
            let nimTerpilih = "-";
            let namaTerpilih = inputPelanggar;
            let niuTerpilih = "-";

            if (inputPelanggar.includes(" - ")) {
                const parts = inputPelanggar.split(" - ");
                nimTerpilih = parts[0].trim();
                namaTerpilih = parts.slice(1).join(" - ").trim(); 
                
                const dataDitemukan = daftarMahasiswaUtuh.find(m => m.nim === nimTerpilih);
                if (dataDitemukan) {
                    niuTerpilih = dataDitemukan.niu;
                }
            }

            // Penggabungan Teks Keterangan & Jenis Ujian
            let finalKeterangan = document.getElementById("srKeterangan").value;
            const jenisDipilih = document.getElementById("srJenis").value;

            if (jenisDipilih === "Terlambat mengikuti ujian") {
                const ujianDipilih = document.getElementById("srUjian").value;
                finalKeterangan = `${ujianDipilih} - ${finalKeterangan}`;
            }

            // --- Logika Identitas Pelapor Tertutup ---
            const userSession = JSON.parse(sessionStorage.getItem("user"));
            const namaPelapor = userSession ? userSession.nama : "Anonim";

            const payload = {
                action: "self_report", 
                tanggal: formattedDate,
                jenis: jenisDipilih,
                nim: nimTerpilih,      
                niu: niuTerpilih,      
                nama: namaTerpilih,    
                keterangan: finalKeterangan,
                link: document.getElementById("srLink").value || "-",
                laporan_oleh: `Dilaporkan oleh ${namaPelapor}` 
            };

            // --- TAMBAHAN: Pop-up Konfirmasi SweetAlert2 ---
            Swal.fire({
                title: 'Konfirmasi Pengaduan',
                text: "Apakah Anda yakin melakukan pelaporan?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#dc3545', // Merah (Danger)
                cancelButtonColor: '#6c757d',  // Abu-abu (Secondary)
                confirmButtonText: 'Ya, kirim laporan!',
                cancelButtonText: 'Batal',
                reverseButtons: true // Membalik posisi tombol agar 'Ya' di kanan
            }).then((result) => {
                if (result.isConfirmed) {
                    
                    // Jika user klik "Ya", munculkan loading dan lakukan Fetch
                    Swal.fire({
                        title: 'Mengirim Laporan...',
                        text: 'Mohon tunggu, sistem sedang memproses laporan tanpa merekam identitas Anda.',
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
                                title: 'Pengaduan Berhasil Terkirim!',
                                text: 'Terima kasih telah melapor. Laporan Anda telah tercatat dengan aman.',
                                confirmButtonColor: '#dc3545'
                            }).then(() => {
                                form.reset();
                                document.getElementById("srTanggal").value = `${yyyy}-${mm}-${dd}`;
                                wrapperUjianAduan.classList.add("d-none");
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

                }
            });
        };
    }
})();