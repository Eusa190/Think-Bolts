document.addEventListener('DOMContentLoaded', function () {
    // 1. Auth check
    if (localStorage.getItem('authorityLoggedIn') !== 'true') {
        // window.location.href = 'fixity.html'; // Uncomment to enforce login
        // return;
    }

    // 2. Dummy Data
    const categories = ["Sanitation", "Roads", "Water & Drainage", "Public Safety", "Utilities"];
    const statuses = ["Pending", "In Progress", "Resolved"];
    const wards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4"];
    const descriptions = [
        "Overflowing garbage bin on main street",
        "Deep pothole causing traffic issues",
        "Sewer line blocked, causing overflow",
        "Streetlight out for 3 days",
        "Illegal parking blocking fire hydrant",
        "Damaged footpath near city park",
        "Water leakage from main pipeline"
    ];

    function generateDummyComplaints(count) {
        const complaints = [];
        for (let i = 0; i < count; i++) {
            complaints.push({
                id: `FIX-${1000 + i}`,
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                location: wards[Math.floor(Math.random() * wards.length)],
                dateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString(),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                votes: Math.floor(Math.random() * 50),
                lat: 20.2736 + (Math.random() - 0.5) * 0.1, // Bhubaneswar area
                lng: 85.8436 + (Math.random() - 0.5) * 0.1
            });
        }
        return complaints;
    }

    let allComplaints = generateDummyComplaints(150);
    let filteredComplaints = [...allComplaints];

    // Pagination state
    let currentPage = 1;
    const rowsPerPage = 5;

    // --- Update Functions ---

    function updateStats() {
        const total = filteredComplaints.length;
        const pending = filteredComplaints.filter(c => c.status === 'Pending').length;
        const inProgress = filteredComplaints.filter(c => c.status === 'In Progress').length;
        const resolved = filteredComplaints.filter(c => c.status === 'Resolved').length;

        document.getElementById('total-issues-count').textContent = total;
        document.getElementById('pending-issues-count').textContent = pending;
        document.getElementById('in-progress-issues-count').textContent = inProgress;
        const totalEl = document.getElementById('total-issues-count');
        if (totalEl) totalEl.textContent = total;

        const resolvedCountEl = document.getElementById('resolved-issues-count');
        if (resolvedCountEl) {
            // This element might not exist in the new layout, so check for it.
            // The new layout uses span elements inside stat-info divs.
            resolvedCountEl.textContent = resolved; 
        }
        const pendingEl = document.getElementById('pending-issues-count');
        if (pendingEl) pendingEl.textContent = pending;

        const inProgressEl = document.getElementById('in-progress-issues-count');
        if (inProgressEl) inProgressEl.textContent = inProgress;

        const resolvedEl = document.getElementById('resolved-issues-count');
        if (resolvedEl) resolvedEl.textContent = resolved;
    }

    function renderTable() {
        const tableBody = document.getElementById('complaints-table-body');
        tableBody.innerHTML = '';
        
        const paginatedComplaints = filteredComplaints.slice(
            (currentPage - 1) * rowsPerPage,
            currentPage * rowsPerPage
        );

        if (paginatedComplaints.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No complaints match the current filters.</td></tr>`;
            renderPagination();
            return;
        }

        paginatedComplaints.forEach((c, index) => {
            const row = document.createElement('tr');
            row.style.animationDelay = `${index * 0.05}s`;
            row.innerHTML = `
                <td>${c.id}</td>
                <td>${c.description}</td>
                <td>${c.category}</td>
                <td>${c.location}</td>
                <td>${c.dateTime}</td>
                <td>
                    <select class="status-dropdown ${c.status.toLowerCase().replace(' ', '-')}" data-id="${c.id}">
                        <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
                <td>${c.votes}</td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.status-dropdown').forEach(dropdown => {
            dropdown.addEventListener('change', (e) => {
                const complaintId = e.target.dataset.id;
                const newStatus = e.target.value;
                const complaint = allComplaints.find(c => c.id === complaintId);
                if (complaint) {
                    complaint.status = newStatus;
                }
                applyFilters();
            });
        });

        renderPagination();
    }

    function renderPagination() {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredComplaints.length / rowsPerPage);

        if (pageCount <= 1) return;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo; Prev';
        prevButton.classList.add('pagination-btn');
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
        paginationContainer.appendChild(prevButton);

        // Page numbers (simplified for now)
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentPage} of ${pageCount}`;
        pageInfo.style.padding = '0 1rem';
        paginationContainer.appendChild(pageInfo);

        // Next button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = 'Next &raquo;';
        nextButton.classList.add('pagination-btn');
        nextButton.disabled = currentPage === pageCount;
        nextButton.addEventListener('click', () => {
            currentPage++;
            renderTable();
        });
        paginationContainer.appendChild(nextButton);
    }

    function updateAllVisuals() {
        updateStats();
        renderTable();
    }

    // --- Filters and Initial Load ---

    const locationFilter = document.getElementById('location-filter');
    const categoryFilter = document.getElementById('category-filter');

    function applyFilters() {
        currentPage = 1; // Reset to first page on filter change
        const selectedLocation = locationFilter.value;
        const selectedCategory = categoryFilter.value;

        filteredComplaints = allComplaints.filter(c => {
            const locationMatch = selectedLocation === 'all' || c.location === selectedLocation;
            const categoryMatch = selectedCategory === 'all' || c.category === selectedCategory;
            return locationMatch && categoryMatch;
        });
        updateAllVisuals();
    }

    locationFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);

    document.getElementById('auth-logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authorityLoggedIn');
        localStorage.removeItem('authorityUsername');
        window.location.href = 'fixity.html';
    });

    applyFilters();
});