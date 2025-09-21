document.addEventListener('DOMContentLoaded', function () {
    // 1. Auth check
    if (localStorage.getItem('authorityLoggedIn') !== 'true') {
        // window.location.href = 'fixity.html'; // Uncomment to enforce login
    }

    // 2. Dummy Data (same as dashboard for consistency)
    const categories = ["Sanitation", "Roads", "Water & Drainage", "Public Safety", "Utilities"];
    const statuses = ["Pending", "In Progress", "Resolved"];
    const wards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4"];
    const descriptions = [
        "Overflowing garbage bin on main street", "Deep pothole causing traffic issues",
        "Sewer line blocked, causing overflow", "Streetlight out for 3 days",
        "Illegal parking blocking fire hydrant", "Damaged footpath near city park",
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
                dateTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Data up to 90 days old
                status: statuses[Math.floor(Math.random() * statuses.length)],
                votes: Math.floor(Math.random() * 50)
            });
        }
        return complaints;
    }

    const allComplaints = generateDummyComplaints(250);

    // 3. DOM References
    const generateBtn = document.getElementById('generate-report-btn');
    const exportBtn = document.getElementById('export-csv-btn');
    const printBtn = document.getElementById('print-report-btn');
    const reportSection = document.getElementById('report-results-section');
    const summarySection = document.getElementById('report-summary-section');
    const reportTableBody = document.getElementById('report-table-body');
    const noDataMessage = document.getElementById('no-report-data');

    // 4. Event Listeners
    generateBtn.addEventListener('click', generateReport);
    exportBtn.addEventListener('click', exportToCSV);
    printBtn.addEventListener('click', () => window.print());

    document.getElementById('auth-logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authorityLoggedIn');
        localStorage.removeItem('authorityUsername');
        window.location.href = 'fixity.html';
    });

    // 5. Functions
    function generateReport() {
        // Add loading state
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner"></i> Generating...';

        // Simulate network delay for visual feedback
        setTimeout(() => {
            const dateRange = document.getElementById('date-range-filter').value;
            const status = document.getElementById('status-filter').value;
            const category = document.getElementById('category-filter').value;
            const location = document.getElementById('location-filter').value;

            const now = Date.now();
            const filteredComplaints = allComplaints.filter(c => {
                const dateMatch = dateRange === 'all' || (now - new Date(c.dateTime).getTime()) / (1000 * 3600 * 24) <= parseInt(dateRange);
                const statusMatch = status === 'all' || c.status === status;
                const categoryMatch = category === 'all' || c.category === category;
                const locationMatch = location === 'all' || c.location === location;
                return dateMatch && statusMatch && categoryMatch && locationMatch;
            });

            renderReportSummary(filteredComplaints);
            renderReportTable(filteredComplaints);

            // Restore button state
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-cogs"></i> Generate Report';
        }, 500); // 0.5 second delay
    }

    function renderReportSummary(complaints) {
        const total = complaints.length;
        const pending = complaints.filter(c => c.status === 'Pending').length;
        const inProgress = complaints.filter(c => c.status === 'In Progress').length;
        const resolved = complaints.filter(c => c.status === 'Resolved').length;

        document.getElementById('report-total-count').textContent = total;
        document.getElementById('report-pending-count').textContent = pending;
        document.getElementById('report-inprogress-count').textContent = inProgress;
        document.getElementById('report-resolved-count').textContent = resolved;

        summarySection.style.display = total > 0 ? 'block' : 'none';
    }

    function renderReportTable(complaints) {
        reportTableBody.innerHTML = '';
        reportSection.style.display = 'block';

        if (complaints.length === 0) {
            noDataMessage.style.display = 'block';
            reportTableBody.style.display = 'none';
            reportSection.style.display = 'block'; // Show section to display message
            summarySection.style.display = 'none'; // Hide summary if no results
            return;
        }

        noDataMessage.style.display = 'none';
        reportTableBody.style.display = '';

        complaints.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.id}</td>
                <td>${c.description}</td>
                <td>${c.category}</td>
                <td>${c.location}</td>
                <td>${new Date(c.dateTime).toLocaleString()}</td>
                <td><span class="status-badge ${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span></td>
                <td>${c.votes}</td>
            `;
            reportTableBody.appendChild(row);
        });
    }

    function exportToCSV() {
        const rows = reportTableBody.querySelectorAll('tr');
        if (rows.length === 0) {
            alert("No data to export!");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Description,Category,Location,Date/Time,Status,Votes\n";

        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            const rowData = Array.from(cols).map(col => `"${col.innerText.replace(/"/g, '""')}"`);
            csvContent += rowData.join(',') + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "fixity_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});