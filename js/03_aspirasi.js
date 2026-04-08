(function initAspirasi() {
    // 1. Ambil Data Session 
    const userSession = JSON.parse(sessionStorage.getItem("user"));
    
    if (userSession) {
        const aspNama = document.getElementById("aspNama");
        if (aspNama) {
            aspNama.value = userSession.nama;
        }
    }

    // 2. Set Tanggal Default ke Hari Ini
    const aspTanggal = document.getElementById("aspTanggal");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); 
    const dd = String(today.getDate()).padStart(2, '0');
    
    if (aspTanggal) {
        aspTanggal.value = `${yyyy}-${mm}-${dd}`;
    }

    // 3. Tangani Proses Submit
    const form = document.getElementById("formAspirasi");
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault(); 

            // Format Tanggal (HTML Date: YYYY-MM-DD -> DD/MM/YYYY)
            const rawDate = document.getElementById("aspTanggal").value; 
            const [year, month, day] = rawDate.split("-");
            const formattedDate = `${day}/${month}/${year}`;

            // Siapkan payload data (Ambil NIM dan Status dari Session)
            const payload = {
                action: "submit_aspirasi",
                tanggal: formattedDate,
                jenis: document.getElementById("aspJenis").value,
                status: userSession ? userSession.status : "Unknown",
                nim: userSession ? (userSession.nim || "-") : "-",
                nama: document.getElementById("aspNama").value,
                keterangan: document.getElementById("aspKeterangan").value,
                link: document.getElementById("aspLink").value || "-"
            };

            Swal.fire({
                title: 'Mengirim Aspirasi...',
                text: 'Mohon tunggu, suara Anda sedang dicatat.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Pastikan GAS_ASPIRASI sudah ada di config.js
            fetch(GAS_ASPIRASI, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    Swal.fire({
                        icon: 'success',
                        title: 'Aspirasi Terkirim!',
                        text: 'Terima kasih atas kepedulian Anda terhadap Teknik Geodesi UGM.',
                        confirmButtonColor: '#198754' // Hijau Bootstrap
                    }).then(() => {
                        form.reset();
                        document.getElementById("aspNama").value = userSession.nama;
                        document.getElementById("aspTanggal").value = `${yyyy}-${mm}-${dd}`;
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