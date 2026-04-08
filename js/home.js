let globalDosenData = [];
let pieChartInstance = null;
let barChartInstance = null;

const user = JSON.parse(sessionStorage.getItem("user"));

if (!user) {
    window.location.href = 'index.html';
} else {
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("userNama").textContent = user.nama;
        
        const sidebarUserNama = document.getElementById("sidebarUserNama");
        const sidebarUserRole = document.getElementById("sidebarUserRole");
        const userProfilePic = document.getElementById("userProfilePic");

        if (sidebarUserNama) sidebarUserNama.textContent = user.nama;
        if (sidebarUserRole) sidebarUserRole.textContent = user.status;
        
        if (userProfilePic) {
            const nameForAvatar = user.nama.replace(/\s+/g, '+');
            const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${nameForAvatar}&background=0d6efd&color=fff&rounded=true&bold=true`;

            if (user.picture) {
                userProfilePic.src = user.picture;
                // Jika foto Google gagal dimuat, ganti ke Inisial Nama
                userProfilePic.onerror = function() {
                    this.onerror = null; 
                    this.src = defaultAvatarUrl;
                };
            } else {
                userProfilePic.src = defaultAvatarUrl;
            }
        }

        const menuSelfReport = document.getElementById("menuSelfReport");
        const dosenDashboard = document.getElementById("dosenDashboard");
        const mahasiswaDashboard = document.getElementById("mahasiswaDashboard");

        const isAdmin = ADMIN.includes(user.email);

        if (user.status === "Mahasiswa" || isAdmin) {
            if (menuSelfReport) menuSelfReport.classList.remove("d-none");
        } else {
            if (menuSelfReport) menuSelfReport.classList.add("d-none");
        }

        if (user.status === "Mahasiswa") {
            if (mahasiswaDashboard) mahasiswaDashboard.classList.remove("d-none");
            if (user.niu && user.niu !== "-") {
                loadRiwayatMahasiswa(user.niu);
            } else {
                renderTabelKosong("NIU tidak ditemukan. Hubungi admin.");
            }
        } else {
            if (dosenDashboard) dosenDashboard.classList.remove("d-none");
            if (isAdmin && sidebarUserRole) {
                sidebarUserRole.innerHTML = `${user.status} <span class="badge bg-warning text-dark ms-1">Admin</span>`;
            }

            loadDosenData();
        }
    });
}

function refreshRiwayat() {
    const btn = document.getElementById("btnRefresh");
    if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Loading...';
    
    if (user && user.niu && user.niu !== "-") {
        loadRiwayatMahasiswa(user.niu);
    } else {
        Swal.fire("Error", "Sesi login tidak valid, silakan login ulang.", "error");
    }
}

function loadRiwayatMahasiswa(niu) {
    document.getElementById("tabelPelanggaranBody").innerHTML = '<tr><td colspan="4" class="text-center py-4">Memperbarui data...</td></tr>';
    document.getElementById("tabelPemutihanBody").innerHTML = '<tr><td colspan="4" class="text-center py-4">Memperbarui data...</td></tr>';

    fetch(GAS_PELANGGARAN, {
        method: 'POST',
        body: JSON.stringify({ action: "get_riwayat_mahasiswa", niu: niu })
    })
    .then(res => res.json())
    .then(response => {
        const btn = document.getElementById("btnRefresh");
        if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh Data';

        if (response.status === "ok") {
            const data = response.data;
            const tbPelanggaran = document.getElementById("tabelPelanggaranBody");
            const tbPemutihan = document.getElementById("tabelPemutihanBody");
            
            let htmlPelanggaran = "";
            let htmlPemutihan = "";
            let countPelanggaran = 0;
            let countPemutihan = 0;

           data.forEach(item => {
                const rowHtml = `
                    <tr>
                        <td class="ps-4 fw-bold text-muted">${item.no}</td> 
                        <td>${item.tanggal}</td>
                        <td class="fw-semibold">${item.jenis}</td>
                        <td class="text-muted small">${item.keterangan}</td>
                    </tr>
                `;

                if (item.status === "Pelanggaran") {
                    htmlPelanggaran += rowHtml;
                    countPelanggaran++;
                } else if (item.status === "Pemutihan") {
                    htmlPemutihan += rowHtml;
                    countPemutihan++;
                }
            });

            document.getElementById("countPelanggaran").textContent = countPelanggaran;
            tbPelanggaran.innerHTML = htmlPelanggaran || `<tr><td colspan="4" class="text-center text-muted py-4"><i class="bi bi-emoji-smile fs-4 d-block mb-2 text-success"></i>Bagus! Anda tidak memiliki catatan pelanggaran.</td></tr>`;

            document.getElementById("countPemutihan").textContent = countPemutihan;
            tbPemutihan.innerHTML = htmlPemutihan || `<tr><td colspan="4" class="text-center text-muted py-4">Belum ada riwayat pemutihan.</td></tr>`;

        } else {
            renderTabelKosong(response.message || "Gagal mengambil data.");
        }
    })
    .catch(err => {
        console.error("Fetch Error:", err);
        const btn = document.getElementById("btnRefresh");
        if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh Data';
        renderTabelKosong("Terjadi kesalahan koneksi ke server GAS.");
    });
}

function renderTabelKosong(pesan) {
    const errorHtml = `<tr><td colspan="4" class="text-center text-danger py-4">${pesan}</td></tr>`;
    document.getElementById("tabelPelanggaranBody").innerHTML = errorHtml;
    document.getElementById("tabelPemutihanBody").innerHTML = errorHtml;
}

const Loading = {
    show: () => {
        const el = document.getElementById("loadingOverlay");
        if (el) el.classList.remove("d-none");
    },
    hide: () => {
        const el = document.getElementById("loadingOverlay");
        if (el) el.classList.add("d-none");
    }
};

// Sidebar Toggle & Logout
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('collapsed');
            if (sidebar.classList.contains('collapsed')) {
                document.querySelectorAll('.sidebar .collapse.show').forEach(el => {
                    const bsCollapse = bootstrap.Collapse.getInstance(el) || new bootstrap.Collapse(el, { toggle: false });
                    bsCollapse.hide();
                });
            }
        });
    }

    document.getElementById("btnLogout").addEventListener("click", (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Keluar dari Sistem?',
            text: "Sesi Anda akan berakhir.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Ya, Keluar',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) performLogout();
        });
    });

    // Handle initial routing (Disesuaikan untuk Lapor Geodesi)
    const params = new URLSearchParams(window.location.search);
    const pageKey = params.get("page");
    const routes = { 
        'laporsendiri': '01_laporsendiri.html',
        'buataduan': '02_buataduan.html',
        'aspirasi': '03_aspirasi.html'
    };
    if (pageKey && routes[pageKey]) loadPage(routes[pageKey], pageKey);
});

// Fungsi Load Page
function loadPage(eventOrPage, pagePath, key) {
    let finalPage, finalKey;
    if (typeof eventOrPage === 'object' && eventOrPage !== null) {
        if (eventOrPage.preventDefault) eventOrPage.preventDefault();
        finalPage = pagePath;
        finalKey = key;
    } else {
        finalPage = eventOrPage;
        finalKey = pagePath;
    }

    if (!finalPage || !finalKey) return;

    Loading.show(); 

    fetch(finalPage)
        .then(res => {
            if (!res.ok) throw new Error("Gagal mengambil file");
            return res.text();
        })
        .then(html => {
            document.getElementById("mainContent").innerHTML = html;
            const newUrl = `${window.location.origin}${window.location.pathname}?page=${finalKey}`;
            history.pushState({ page: finalPage, key: finalKey }, "", newUrl);

            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`a[onclick*="'${finalKey}'"]`);
            if (activeLink) activeLink.classList.add('active');

            // Load script berdasarkan halaman yang dibuka
            if (finalKey === 'laporsendiri') loadScript('js/01_laporsendiri.js')
            else if (finalKey === 'buataduan') loadScript('js/02_buataduan.js')
            else if (finalKey === 'aspirasi') loadScript('js/03_aspirasi.js')
        })
        .catch(err => {
            console.error(err);
            document.getElementById("mainContent").innerHTML = "<p class='text-danger text-center mt-5'>Gagal memuat halaman. Pastikan file tersedia.</p>";
        })
        .finally(() => Loading.hide()); 
}

function loadScript(src) {
    const oldScript = document.querySelector(`script[src="${src}"]`);
    if (oldScript) oldScript.remove();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
}

window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        loadPage(event.state.page, event.state.key);
    } else {
        window.location.href = window.location.pathname;
    }
};

function performLogout() {
    sessionStorage.clear();
    localStorage.clear();
    Swal.fire({
        title: 'Berhasil Keluar',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false
    }).then(() => {
        window.location.href = "index.html";
    });
}

function loadDosenData() {
    const btn = document.getElementById("btnRefreshDosen");
    if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>...';

    fetch(GAS_PELANGGARAN, {
        method: 'POST',
        body: JSON.stringify({ action: "get_semua_pelanggaran" })
    })
    .then(res => res.json())
    .then(response => {
        if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh';
        if (response.status === "ok") {
            globalDosenData = response.data;
            processDosenDashboard(globalDosenData);
        } else {
            Swal.fire("Gagal", "Gagal mengambil data dari server.", "error");
        }
    })
    .catch(err => {
        if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh';
        console.error("Error:", err);
    });
}

function processDosenDashboard(data) {
    renderDosenTables(data);
    renderDosenCharts(data);
}

function renderDosenTables(data) {
    const tbPelanggaran = document.getElementById("tabelDosenPelanggaran");
    const tbPemutihan = document.getElementById("tabelDosenPemutihan");
    
    // SAFETY CHECK: Jika tabel tidak ada di layar (karena user pindah menu), hentikan fungsi
    if (!tbPelanggaran || !tbPemutihan) return; 

    let htmlPel = "", htmlPem = "";

    data.forEach(item => {
        if (item.status === "Pelanggaran") {
            htmlPel += `
                <tr>
                    <td class="ps-3 fw-bold text-muted">${item.no}</td>
                    <td>${item.tanggal}</td>
                    <td class="fw-semibold text-danger">${item.jenis}</td>
                    <td>${item.niu}</td>
                    <td class="fw-bold">${item.nama}</td>
                    <td class="text-muted">${item.keterangan}</td>
                    <td><a href="${item.link}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-link-45deg"></i> Bukti</a></td>
                </tr>`;
        } else if (item.status === "Pemutihan") {
            htmlPem += `
                <tr>
                    <td class="ps-3 fw-bold text-muted">${item.no}</td>
                    <td>${item.tanggal}</td>
                    <td class="fw-semibold text-success">${item.jenis}</td>
                    <td>${item.niu}</td>
                    <td class="fw-bold">${item.nama}</td>
                    <td class="text-muted">${item.keterangan}</td>
                    <td class="fw-bold text-success">${item.tgl_pemutihan}</td>
                </tr>`;
        }
    });

    tbPelanggaran.innerHTML = htmlPel || '<tr><td colspan="7" class="text-center py-3">Tidak ada data pelanggaran aktif.</td></tr>';
    tbPemutihan.innerHTML = htmlPem || '<tr><td colspan="7" class="text-center py-3">Tidak ada data pemutihan.</td></tr>';
}

function renderDosenCharts(data) {
    const ctxPie = document.getElementById('pieChart');
    const ctxBar = document.getElementById('barChart');

    // SAFETY CHECK: Jika canvas chart tidak ada di layar, hentikan fungsi
    if (!ctxPie || !ctxBar) return;

    // Hanya hitung yang statusnya "Pelanggaran"
    const pelanggaranAktif = data.filter(d => d.status === "Pelanggaran");
    
    // Hitung frekuensi per jenis
    const counts = {};
    pelanggaranAktif.forEach(item => {
        counts[item.jenis] = (counts[item.jenis] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    // Render Pie Chart
    if (pieChartInstance) pieChartInstance.destroy(); 
    pieChartInstance = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0dcaf0', '#6f42c1', '#d63384']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12 } }
            }
        }
    });

    // Render Bar Chart
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Pelanggar',
                data: values,
                backgroundColor: '#0d6efd',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

// --- LOGIKA FILTER FRONTEND ---
document.getElementById('filterTanggal')?.addEventListener('change', filterDosenData);
document.getElementById('filterJenis')?.addEventListener('change', filterDosenData);
document.getElementById('filterSearch')?.addEventListener('input', filterDosenData);

function filterDosenData() {
    const tgl = document.getElementById('filterTanggal').value; 
    const jenis = document.getElementById('filterJenis').value;
    const search = document.getElementById('filterSearch').value.toLowerCase();

    // Konversi tgl (YYYY-MM-DD) ke format Spreadsheet (DD/MM/YYYY) untuk pencocokan
    let searchTgl = "";
    if (tgl) {
        const [y, m, d] = tgl.split("-");
        searchTgl = `${d}/${m}/${y}`;
    }

    const filtered = globalDosenData.filter(item => {
        const matchTgl = searchTgl === "" || item.tanggal === searchTgl;
        const matchJenis = jenis === "Semua" || item.jenis.includes(jenis);
        const matchSearch = search === "" || item.nama.toLowerCase().includes(search) || item.niu.toLowerCase().includes(search);
        return matchTgl && matchJenis && matchSearch;
    });

    renderDosenTables(filtered); 
    // Opsional: renderDosenCharts(filtered) jika ingin chart ikut berubah saat di-filter
}

function resetFilter() {
    document.getElementById('filterTanggal').value = '';
    document.getElementById('filterJenis').value = 'Semua';
    document.getElementById('filterSearch').value = '';
    processDosenDashboard(globalDosenData);
}

// --- LOGIKA EDIT PEMUTIHAN (SWEETALERT) ---
async function promptPemutihan() {
    const aktif = globalDosenData.filter(d => d.status === "Pelanggaran");
    if(aktif.length === 0) return Swal.fire("Info", "Tidak ada data pelanggaran aktif untuk diputihkan.", "info");

    let optionsHtml = '<select id="swal-putih-select" class="form-select border-warning">';
    aktif.forEach(item => {
        optionsHtml += `<option value="${item.no}">#${item.no} - ${item.nama} (${item.jenis})</option>`;
    });
    optionsHtml += '</select>';

    const { isConfirmed } = await Swal.fire({
        title: 'Putihkan Pelanggaran',
        html: `Pilih data pelanggaran yang telah diselesaikan:<br><br>${optionsHtml}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-check-circle text-dark"></i> Ya, Putihkan',
        cancelButtonText: 'Batal'
    });

    if (isConfirmed) {
        const noToPutihkan = document.getElementById('swal-putih-select').value;
        
        // Ambil tanggal hari ini untuk Tgl Pemutihan
        const today = new Date();
        const tglHariIni = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

        Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        fetch(GAS_PELANGGARAN, {
            method: 'POST',
            body: JSON.stringify({
                action: "update_pemutihan",
                no: noToPutihkan,
                tgl_pemutihan: tglHariIni
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok") {
                Swal.fire("Berhasil", "Data pelanggaran telah diputihkan.", "success").then(() => {
                    loadDosenData(); // Refresh data dari server
                });
            } else {
                Swal.fire("Gagal", data.message, "error");
            }
        });
    }
}