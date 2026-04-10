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

    // (Catatan: Pastikan nama variabel GAS_PELANGGARAN sesuai dengan yang ada di config.js Anda)
    fetch(GAS_PELANGGARAN, {
        method: 'POST',
        body: JSON.stringify({ action: "get_riwayat_mahasiswa", niu: niu })
    })
    .then(res => res.json())
    .then(response => {
        const btn = document.getElementById("btnRefresh");
        if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh Data';

        if (response.status === "ok") {
            // 1. REVERSE DATA: Balik urutan array agar data terbaru (paling bawah di sheet) berada di atas
            const data = response.data.reverse(); 
            
            const tbPelanggaran = document.getElementById("tabelPelanggaranBody");
            const tbPemutihan = document.getElementById("tabelPemutihanBody");
            
            let htmlPelanggaran = "";
            let htmlPemutihan = "";
            let countPelanggaran = 0;
            let countPemutihan = 0;
            
            // 2. COUNTER DINAMIS: Mulai dari angka 1 untuk masing-masing tabel
            let noPel = 1;
            let noPem = 1;

            data.forEach(item => {
                if (item.status === "Pelanggaran") {
                    htmlPelanggaran += `
                        <tr>
                            <td class="ps-4 fw-bold text-muted">${noPel++}</td> 
                            <td>${item.tanggal}</td>
                            <td class="fw-semibold text-danger">${item.jenis}</td>
                            <td class="text-muted small">${item.keterangan}</td>
                        </tr>
                    `;
                    countPelanggaran++;
                } else if (item.status === "Pemutihan") {
                    htmlPemutihan += `
                        <tr>
                            <td class="ps-4 fw-bold text-muted">${noPem++}</td> 
                            <td>${item.tanggal}</td>
                            <td class="fw-semibold text-success">${item.jenis}</td>
                            <td class="text-muted small">${item.keterangan}</td>
                        </tr>
                    `;
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

// ==========================================
// DASHBOARD DOSEN & ADMIN LOGIC
// ==========================================
let globalDosenData = [];
let displayedDosenData = []; // Data yang sedang tampil (setelah filter/sort)
let pieChartInstance = null;
let barChartInstance = null;
let lineChartInstance = null;

let currentSortColumn = 'no';
let currentSortAsc = false; // Default false (Descending = Data terbaru di atas)

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
            setDefaultFilterValues();
            filterAndRenderCharts(); 
            // Render Table (Sort descending by default agar terbaru di atas)
            sortData(currentSortColumn, currentSortAsc);
            filterDosenData();
        } else {
            Swal.fire("Gagal", "Gagal mengambil data dari server.", "error");
        }
    })
    .catch(err => {
        if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh';
        console.error("Error:", err);
    });
}

// --- LOGIKA FILTER & RENDER CHART (PIE, BAR, LINE, LEADERBOARD) ---
function filterAndRenderCharts() {
    const bln = document.getElementById('chartBulan').value;
    const thn = document.getElementById('chartTahun').value;
    
    let filteredForChart = globalDosenData.filter(d => d.status === "Pelanggaran");
    
    if (bln !== "Semua" || thn !== "Semua") {
        filteredForChart = filteredForChart.filter(item => {
            if(!item.tanggal) return false;
            const parts = item.tanggal.split('/');
            if(parts.length !== 3) return false;
            const [d, m, y] = parts;
            
            const matchBln = bln === "Semua" || m === bln;
            const matchThn = thn === "Semua" || y === thn;
            return matchBln && matchThn;
        });
    }

    renderDosenCharts(filteredForChart);
    renderLeaderboard(filteredForChart);
}

function renderDosenCharts(data) {
    const ctxPie = document.getElementById('pieChart');
    const ctxBar = document.getElementById('barChart');
    const ctxLine = document.getElementById('lineChart');
    if (!ctxPie || !ctxBar || !ctxLine) return;

    // --- Hitung Data Pie & Bar ---
    const counts = {};
    const dateCounts = {};

    data.forEach(item => {
        // Untuk Pie & Bar
        counts[item.jenis] = (counts[item.jenis] || 0) + 1;
        // Untuk Line Chart
        dateCounts[item.tanggal] = (dateCounts[item.tanggal] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    // --- Render Pie Chart ---
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
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }
    });

    // --- Render Bar Chart ---
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Jumlah', data: values, backgroundColor: '#0d6efd', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
    });

    // --- Render Line Chart (Sort Tanggal Secara Kronologis) ---
    const sortedDates = Object.keys(dateCounts).sort((a, b) => {
        const [d1, m1, y1] = a.split('/');
        const [d2, m2, y2] = b.split('/');
        return new Date(y1, m1-1, d1) - new Date(y2, m2-1, d2);
    });
    
    const lineValues = sortedDates.map(date => dateCounts[date]);

    if (lineChartInstance) lineChartInstance.destroy();
    lineChartInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Total Pelanggaran',
                data: lineValues,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#dc3545'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function renderLeaderboard(data) {
    const tbody = document.getElementById("leaderboardBody");
    if(!tbody) return;

    // Hitung frekuensi per NIU
    const lbMap = {};
    data.forEach(item => {
        const key = `${item.niu}|${item.nama}`;
        lbMap[key] = (lbMap[key] || 0) + 1;
    });

    // Konversi ke array, sort descending, potong top 5
    const lbArray = Object.keys(lbMap).map(key => {
        const [niu, nama] = key.split('|');
        return { niu, nama, count: lbMap[key] };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    if (lbArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-muted py-3">Belum ada data.</td></tr>';
        return;
    }

    let html = "";
    lbArray.forEach((user, index) => {
        let badgeClass = "bg-secondary";
        if(index === 0) badgeClass = "bg-danger";
        else if(index === 1) badgeClass = "bg-warning text-dark";
        else if(index === 2) badgeClass = "bg-primary";

        html += `
            <tr>
                <td class="fw-bold text-muted">${index + 1}</td>
                <td>${user.niu}</td>
                <td class="text-start fw-semibold">${user.nama}</td>
                <td><span class="badge ${badgeClass} rounded-pill">${user.count}x</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// --- LOGIKA FILTER TABEL (RENTANG TANGGAL) ---
document.getElementById('filterTglMulai')?.addEventListener('change', filterDosenData);
document.getElementById('filterTglSelesai')?.addEventListener('change', filterDosenData);
document.getElementById('filterJenisTabel')?.addEventListener('change', filterDosenData);
document.getElementById('filterSearch')?.addEventListener('input', filterDosenData);

function filterDosenData() {
    const start = document.getElementById('filterTglMulai').value; 
    const end = document.getElementById('filterTglSelesai').value;
    const jenis = document.getElementById('filterJenisTabel').value;
    const search = document.getElementById('filterSearch').value.toLowerCase();

    let startDate = start ? new Date(start) : null;
    let endDate = end ? new Date(end) : null;
    if (startDate) startDate.setHours(0,0,0,0);
    if (endDate) endDate.setHours(23,59,59,999);

    displayedDosenData = globalDosenData.filter(item => {
        // Parsing Tanggal (DD/MM/YYYY)
        const parts = item.tanggal.split('/');
        const itemDate = parts.length === 3 ? new Date(parts[2], parts[1]-1, parts[0]) : null;

        const matchTgl = (!startDate || (itemDate && itemDate >= startDate)) && 
                         (!endDate || (itemDate && itemDate <= endDate));
        const matchJenis = jenis === "Semua" || item.jenis.includes(jenis);
        const matchSearch = search === "" || item.nama.toLowerCase().includes(search) || item.niu.toLowerCase().includes(search);
        
        return matchTgl && matchJenis && matchSearch;
    });

    sortData(currentSortColumn, currentSortAsc); // Render ada di dalam sortData
}

function resetFilter() {
    setDefaultFilterValues();
    const fj = document.getElementById('filterJenisTabel');
    const fs = document.getElementById('filterSearch');
    if(fj) fj.value = 'Semua';
    if(fs) fs.value = '';
    filterAndRenderCharts();
    filterDosenData();
}

// --- LOGIKA SORTING & RENDER TABEL ---
function sortTable(column) {
    if (currentSortColumn === column) {
        currentSortAsc = !currentSortAsc; // Balik urutan jika klik kolom yang sama
    } else {
        currentSortColumn = column;
        currentSortAsc = true; // Default ascending untuk kolom baru
    }
    sortData(currentSortColumn, currentSortAsc);
}

function sortData(column, asc) {
    displayedDosenData.sort((a, b) => {
        let valA = a[column] || "";
        let valB = b[column] || "";

        // Handling khusus untuk tipe data Nomor & Tanggal
        if (column === 'no') {
            valA = parseInt(valA) || 0;
            valB = parseInt(valB) || 0;
        } else if (column === 'tanggal' || column === 'tgl_pemutihan') {
            const pA = String(valA).split('/');
            const pB = String(valB).split('/');
            valA = pA.length === 3 ? new Date(pA[2], pA[1]-1, pA[0]).getTime() : 0;
            valB = pB.length === 3 ? new Date(pB[2], pB[1]-1, pB[0]).getTime() : 0;
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
    });
    
    renderDosenTables(displayedDosenData);
}

function renderDosenTables(data) {
    const tbPelanggaran = document.getElementById("tabelDosenPelanggaran");
    const tbPemutihan = document.getElementById("tabelDosenPemutihan");
    if (!tbPelanggaran || !tbPemutihan) return; 

    let htmlPel = "", htmlPem = "";
    let countPel = 0, countPem = 0;
    
    // Variabel penghitung dinamis agar selalu mulai dari 1
    let indexPel = 1; 
    let indexPem = 1;

    data.forEach(item => {
        const buktiHtml = (item.link === "-" || item.link.trim() === "") 
            ? '<span class="badge bg-light text-muted border">Tidak ada</span>' 
            : `<a href="${item.link}" target="_blank" class="btn btn-sm btn-outline-primary py-0"><i class="bi bi-link-45deg"></i> Bukti</a>`;

        if (item.status === "Pelanggaran") {
            countPel++;
            htmlPel += `
                <tr>
                    <td class="ps-3 fw-bold text-muted">${indexPel++}</td>
                    <td>${item.tanggal}</td>
                    <td class="fw-semibold text-danger">${item.jenis}</td>
                    <td>${item.niu}</td>
                    <td class="fw-bold">${item.nama}</td>
                    <td class="text-muted">${item.keterangan}</td>
                    <td>${buktiHtml}</td>
                </tr>`;
        } else if (item.status === "Pemutihan") {
            countPem++;
            htmlPem += `
                <tr>
                    <td class="ps-3 fw-bold text-muted">${indexPem++}</td>
                    <td>${item.tanggal}</td>
                    <td class="fw-semibold text-success">${item.jenis}</td>
                    <td>${item.niu}</td>
                    <td class="fw-bold">${item.nama}</td>
                    <td class="text-muted">${item.keterangan}</td>
                    <td class="fw-bold text-success">${item.tgl_pemutihan}</td>
                </tr>`;
        }
    });

    tbPelanggaran.innerHTML = htmlPel || '<tr><td colspan="7" class="text-center py-3">Tidak ada data.</td></tr>';
    tbPemutihan.innerHTML = htmlPem || '<tr><td colspan="7" class="text-center py-3">Tidak ada data.</td></tr>';

    const infoPel = document.getElementById("infoPelanggaranAktif");
    const infoPem = document.getElementById("infoPemutihan");
    if(infoPel) infoPel.textContent = `Menampilkan: ${countPel} data pelanggaran`;
    if(infoPem) infoPem.textContent = `Menampilkan: ${countPem} data pemutihan`;
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
                    loadDosenData(); // Auto-refresh data terbaru
                });
            } else {
                Swal.fire("Gagal", data.message, "error");
            }
        });
    }
}

async function promptHapus() {
    const aktif = globalDosenData.filter(d => d.status === "Pelanggaran");
    if(aktif.length === 0) return Swal.fire("Info", "Tidak ada data untuk dihapus.", "info");

    let optionsHtml = '<select id="swal-hapus-select" class="form-select border-danger">';
    aktif.forEach(item => {
        optionsHtml += `<option value="${item.no}">#${item.no} - ${item.nama} (${item.jenis})</option>`;
    });
    optionsHtml += '</select>';

    const { isConfirmed } = await Swal.fire({
        title: 'Hapus Laporan Invalid?',
        html: `Pilih laporan palsu/invalid yang ingin <b>dihapus permanen</b>:<br><br>${optionsHtml}<br><br>
               <div class="alert alert-danger p-2 mt-3 small text-start">
                   <i class="bi bi-exclamation-triangle-fill me-1"></i> <b>Peringatan:</b> Tindakan ini akan menghapus baris dari Spreadsheet dan data tidak dapat dikembalikan!
               </div>`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc3545', // Merah
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-trash3-fill"></i> Ya, Hapus Permanen',
        cancelButtonText: 'Batal',
        reverseButtons: true
    });

    if (isConfirmed) {
        const noToHapus = document.getElementById('swal-hapus-select').value;
        Swal.fire({ title: 'Menghapus Data...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        fetch(GAS_PELANGGARAN, { 
            method: 'POST',
            body: JSON.stringify({
                action: "delete_pelanggaran",
                no: noToHapus
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok") {
                Swal.fire("Terhapus!", "Laporan invalid telah dihapus permanen dari sistem.", "success").then(() => {
                    loadDosenData(); // Refresh UI setelah baris di spreadsheet terhapus
                });
            } else {
                Swal.fire("Gagal", data.message, "error");
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
        });
    }
}

function setDefaultFilterValues() {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // Format: "04"
    const currentYear = String(now.getFullYear()); // Format: "2026"

    // 1. Set Filter untuk Chart (Semua Bulan, Tahun Berjalan)
    const cb = document.getElementById('chartBulan');
    const ct = document.getElementById('chartTahun');
    if (cb) cb.value = "Semua";
    if (ct) ct.value = currentYear;

    // 2. Set Filter Rentang Tanggal untuk Tabel (Awal bulan s/d Akhir bulan)
    const firstDay = `${currentYear}-${currentMonth}-01`;
    const lastDayDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const lastDay = `${currentYear}-${currentMonth}-${String(lastDayDate).padStart(2, '0')}`;

    const ftMulai = document.getElementById('filterTglMulai');
    const ftSelesai = document.getElementById('filterTglSelesai');
    
    if (ftMulai) ftMulai.value = firstDay;
    if (ftSelesai) ftSelesai.value = lastDay;
    
}

// ==========================================
// LOGIKA BATCH INSERT PELANGGARAN (MODAL)
// ==========================================
let batchRowCount = 0;
let listMahasiswaUtuh = []; // Cache list mahasiswa agar datalist cepat

// Fungsi untuk membuka Modal & Load List Mahasiswa (jika belum diload)
function bukaModalBatch() {
    // Kosongkan form sebelumnya
    document.getElementById("batchRowsContainer").innerHTML = "";
    batchRowCount = 0;
    
    // Tambah 1 baris default
    tambahBarisBatch();

    // Tampilkan Modal (Menggunakan Bootstrap Modal API)
    const modal = new bootstrap.Modal(document.getElementById('modalBatchPelanggaran'));
    modal.show();

    // Fetch list mahasiswa (sekali saja) jika array masih kosong
    if (listMahasiswaUtuh.length === 0) {
        fetch(GAS_LOGIN, {
            method: 'POST',
            body: JSON.stringify({ action: "get_mahasiswa" })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok") {
                listMahasiswaUtuh = data.user;
                const datalist = document.getElementById("listMahasiswaBatch");
                datalist.innerHTML = "";
                listMahasiswaUtuh.forEach(mhs => {
                    const option = document.createElement("option");
                    // Format: NIM - Nama (Memudahkan search text)
                    option.value = `${mhs.nim} - ${mhs.nama}`;
                    datalist.appendChild(option);
                });
            }
        }).catch(err => console.error("Gagal load datalist mahasiswa:", err));
    }
}

// Fungsi menambah baris HTML ke dalam Modal
function tambahBarisBatch() {
    batchRowCount++;
    const container = document.getElementById("batchRowsContainer");
    
    // Tanggal default hari ini (Format HTML Date: YYYY-MM-DD)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    const rowHtml = `
        <div class="card shadow-sm border-0 mb-3 batch-row" id="batchRow-${batchRowCount}">
            <div class="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between">
                <h6 class="fw-bold text-secondary mb-0">Baris #${batchRowCount}</h6>
                ${batchRowCount > 1 ? `<button type="button" class="btn btn-sm btn-outline-danger py-0" onclick="hapusBarisBatch(${batchRowCount})"><i class="bi bi-x-lg"></i> Hapus</button>` : ''}
            </div>
            <div class="card-body row g-2">
                <div class="col-md-2">
                    <label class="form-label small fw-bold text-muted mb-1">Tanggal</label>
                    <input type="date" class="form-control form-control-sm b-tanggal" value="${todayStr}" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label small fw-bold text-muted mb-1">Pilih Mahasiswa (NIM/Nama)</label>
                    <input class="form-control form-control-sm b-mahasiswa" list="listMahasiswaBatch" placeholder="Ketik NIM / Nama..." required>
                </div>
                <div class="col-md-3">
                    <label class="form-label small fw-bold text-muted mb-1">Jenis Pelanggaran</label>
                    <select class="form-select form-select-sm b-jenis" required onchange="cekTipeUjian(this)">
                        <option value="" disabled selected>Pilih jenis...</option>
                        <option value="Terlambat mengikuti ujian">Terlambat mengikuti ujian</option>
                        <option value="Titip absen">Titip absen</option>
                        <option value="Pemalsuan (dokumen/ TTD)">Pemalsuan (dokumen/ TTD)</option>
                        <option value="Melakukan kekerasan (verbal/non-verbal)">Melakukan kekerasan</option>
                        <option value="Mencontek">Mencontek</option>
                        <option value="Lain lain">Lain-lain</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold text-muted mb-1">Keterangan Singkat</label>
                    <input type="text" class="form-control form-control-sm b-keterangan" placeholder="Keterangan..." required>
                </div>
                <div class="col-md-3 d-none b-ujian-container mt-2">
                    <label class="form-label small fw-bold text-danger mb-1">Ujian Apa?</label>
                    <select class="form-select form-select-sm border-danger b-ujian">
                        <option value="" disabled selected>Pilih Ujian...</option>
                        <option value="UTS Genap 25/26">UTS Genap 25/26</option>
                        <option value="UAS Genap 25/26">UAS Genap 25/26</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function hapusBarisBatch(id) {
    const row = document.getElementById(`batchRow-${id}`);
    if (row) row.remove();
}

// Munculkan opsi Ujian HANYA di baris yang memilih "Terlambat Ujian"
function cekTipeUjian(selectElement) {
    const rowBody = selectElement.closest('.card-body');
    const ujianContainer = rowBody.querySelector('.b-ujian-container');
    const ujianSelect = rowBody.querySelector('.b-ujian');

    if (selectElement.value === "Terlambat mengikuti ujian") {
        ujianContainer.classList.remove('d-none');
        ujianSelect.required = true;
    } else {
        ujianContainer.classList.add('d-none');
        ujianSelect.required = false;
        ujianSelect.value = "";
    }
}

// Eksekusi Submit Batch
function submitBatchPelanggaran() {
    const rows = document.querySelectorAll('.batch-row');
    if (rows.length === 0) return Swal.fire("Info", "Minimal harus ada 1 baris data.", "info");

    let isFormValid = true;
    const payloads = [];

    rows.forEach(row => {
        const inputTgl = row.querySelector('.b-tanggal').value;
        const inputMhs = row.querySelector('.b-mahasiswa').value;
        const inputJenis = row.querySelector('.b-jenis').value;
        let inputKet = row.querySelector('.b-keterangan').value;
        const inputUjian = row.querySelector('.b-ujian').value;

        // Validasi HTML
        if (!inputTgl || !inputMhs || !inputJenis || !inputKet) {
            isFormValid = false;
        }
        if (inputJenis === "Terlambat mengikuti ujian" && !inputUjian) {
            isFormValid = false;
        }

        // 1. Format Tanggal (YYYY-MM-DD ke DD/MM/YYYY)
        const [y, m, d] = inputTgl.split("-");
        const formattedDate = `${d}/${m}/${y}`;

        // 2. Pemisahan NIM dan Nama
        let finalNim = "-";
        let finalNama = inputMhs;
        let finalNiu = "-";

        if (inputMhs.includes(" - ")) {
            const parts = inputMhs.split(" - ");
            finalNim = parts[0].trim(); // cth: 18/431127/TK/47720
            finalNama = parts.slice(1).join(" - ").trim();
            
            // 3. Potong NIU dari NIM (Ambil bagian index ke-1 setelah di-split garis miring)
            const nimParts = finalNim.split('/');
            if (nimParts.length > 1) {
                finalNiu = nimParts[1].trim(); // cth: 431127
            }
        }

        // 4. Gabung Keterangan Ujian
        if (inputJenis === "Terlambat mengikuti ujian") {
            inputKet = `${inputUjian} - ${inputKet}`;
        }

        payloads.push({
            tanggal: formattedDate,
            jenis: inputJenis,
            nim: finalNim,
            niu: finalNiu,
            nama: finalNama,
            keterangan: inputKet
        });
    });

    if (!isFormValid) {
        return Swal.fire("Perhatian", "Mohon lengkapi semua kolom yang wajib diisi pada setiap baris.", "warning");
    }

    // Konfirmasi Simpan
    Swal.fire({
        title: 'Simpan Batch?',
        text: `Anda akan menyimpan ${payloads.length} data pelanggaran ke sistem.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Simpan',
        confirmButtonColor: '#0d6efd'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            // Post ke Spreadsheet Pelanggaran (Action baru: batch_add_pelanggaran)
            fetch(GAS_PELANGGARAN, {
                method: 'POST',
                body: JSON.stringify({
                    action: "batch_add_pelanggaran",
                    payloads: payloads
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    Swal.fire("Berhasil", `${payloads.length} data telah ditambahkan.`, "success").then(() => {
                        // Tutup Modal
                        bootstrap.Modal.getInstance(document.getElementById('modalBatchPelanggaran')).hide();
                        loadDosenData(); // Refresh Tabel Dosen
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
}