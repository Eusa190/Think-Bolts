document.addEventListener('DOMContentLoaded', function () {
    // 1. Auth check
    if (localStorage.getItem('authorityLoggedIn') !== 'true') {
        // window.location.href = 'fixity.html'; // Uncomment to enforce login
    }

    // Set professional defaults for all charts
    Chart.defaults.font.family = "'Inter', 'Poppins', sans-serif";
    Chart.defaults.font.size = 13;
    Chart.defaults.color = '#555';
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.plugins.tooltip.backgroundColor = '#222';
    Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;

    // 2. Dummy Data
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
            const reportedDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            let resolvedDate = null;
            if (randomStatus === 'Resolved') {
                resolvedDate = new Date(reportedDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000); // Resolved within 14 days
            }

            complaints.push({
                id: `FIX-${1000 + i}`,
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                location: wards[Math.floor(Math.random() * wards.length)],
                dateTime: reportedDate,
                status: randomStatus,
                votes: Math.floor(Math.random() * 50),
                resolvedAt: resolvedDate
            });
        }
        return complaints;
    }

    const allComplaints = generateDummyComplaints(250);
    let filteredComplaints = [...allComplaints];

    // Chart instances
    let categoryChartInstance;
    let statusTrendChartInstance;
    let wardChartInstance;
    let issuesTimeChartInstance;
    let topVotedChartInstance;
    let resolutionTimeChartInstance;
    let peakHoursChartInstance;

    // --- Update Functions ---

    function updateCharts() {
        // Category Chart (Doughnut)
        const categoryCtx = document.getElementById('category-chart').getContext('2d');
        const categoryCounts = categories.reduce((acc, category) => {
            acc[category] = filteredComplaints.filter(c => c.category === category).length;
            return acc;
        }, {});

        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    label: 'Complaints by Category',
                    data: Object.values(categoryCounts),
                    backgroundColor: ['#1976d2', '#43a047', '#ffa000', '#e53935', '#673ab7'],
                    borderColor: '#fff',
                    borderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });

        // Status Trend Chart (Bar)
        const statusCtx = document.getElementById('status-trend-chart').getContext('2d');
        const statusCounts = {
            'Pending': filteredComplaints.filter(c => c.status === 'Pending').length,
            'In Progress': filteredComplaints.filter(c => c.status === 'In Progress').length,
            'Resolved': filteredComplaints.filter(c => c.status === 'Resolved').length,
        };

        if (statusTrendChartInstance) statusTrendChartInstance.destroy();
        statusTrendChartInstance = new Chart(statusCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    label: 'Complaint Status Overview',
                    data: Object.values(statusCounts),
                    backgroundColor: ['#e53935', '#ffa000', '#43a047'],
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#eee'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: { legend: { display: false } },
            }
        });

        // Ward Chart (Horizontal Bar)
        const wardCtx = document.getElementById('ward-chart').getContext('2d');
        const wardCounts = wards.reduce((acc, ward) => {
            acc[ward] = filteredComplaints.filter(c => c.location === ward).length;
            return acc;
        }, {});

        if (wardChartInstance) wardChartInstance.destroy();
        wardChartInstance = new Chart(wardCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(wardCounts),
                datasets: [{
                    label: 'Issues by Ward',
                    data: Object.values(wardCounts),
                    backgroundColor: ['#26a69a', '#8d6e63', '#29b6f6', '#ec407a'],
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: '#eee'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: { legend: { display: false } },
            }
        });

        // Issues Over Time Chart (Line)
        const timeCtx = document.getElementById('issues-time-chart').getContext('2d');
        const timeRange = parseInt(document.getElementById('time-range-filter').value, 10);
        const reportedByDay = {};
        const resolvedByDay = {};
        const labels = [];

        for (let i = timeRange - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            reportedByDay[dateString] = 0;
            resolvedByDay[dateString] = 0;
        }

        filteredComplaints.forEach(c => {
            const reportedDateString = c.dateTime.toISOString().split('T')[0];
            if (reportedByDay.hasOwnProperty(reportedDateString)) {
                reportedByDay[reportedDateString]++;
            }
            if (c.resolvedAt) {
                const resolvedDateString = c.resolvedAt.toISOString().split('T')[0];
                if (resolvedByDay.hasOwnProperty(resolvedDateString)) {
                    resolvedByDay[resolvedDateString]++;
                }
            }
        });

        if (issuesTimeChartInstance) issuesTimeChartInstance.destroy();
        issuesTimeChartInstance = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Issues Reported',
                        data: Object.values(reportedByDay),
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Issues Resolved',
                        data: Object.values(resolvedByDay),
                        borderColor: '#43a047',
                        backgroundColor: 'rgba(67, 160, 71, 0.1)',
                        fill: true,
                        tension: 0.4,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });

        // Top Voted Issues Chart (Horizontal Bar)
        const topVotedCtx = document.getElementById('top-voted-chart').getContext('2d');
        const topIssues = [...filteredComplaints]
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5);

        if (topVotedChartInstance) topVotedChartInstance.destroy();
        topVotedChartInstance = new Chart(topVotedCtx, {
            type: 'bar',
            data: {
                labels: topIssues.map(c => `${c.id}`),
                datasets: [{
                    label: 'Votes',
                    data: topIssues.map(c => c.votes),
                    backgroundColor: '#ff7043',
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { beginAtZero: true, grid: { color: '#eee' } },
                    y: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const issue = topIssues[context[0].dataIndex];
                                return `${issue.id}: ${issue.description}`;
                            }
                        }
                    }
                }
            }
        });

        // Average Resolution Time Chart (Bar)
        const resolutionCtx = document.getElementById('resolution-time-chart').getContext('2d');
        const resolutionData = categories.reduce((acc, category) => {
            const resolvedInCategory = filteredComplaints.filter(c => c.category === category && c.status === 'Resolved' && c.resolvedAt);
            if (resolvedInCategory.length > 0) {
                const totalMillis = resolvedInCategory.reduce((sum, c) => sum + (c.resolvedAt.getTime() - c.dateTime.getTime()), 0);
                acc.labels.push(category);
                acc.data.push(totalMillis / resolvedInCategory.length / (1000 * 3600 * 24)); // Average in days
            }
            return acc;
        }, { labels: [], data: [] });

        if (resolutionTimeChartInstance) resolutionTimeChartInstance.destroy();
        resolutionTimeChartInstance = new Chart(resolutionCtx, {
            type: 'bar',
            data: {
                labels: resolutionData.labels,
                datasets: [{
                    label: 'Avg. Resolution Time (Days)',
                    data: resolutionData.data,
                    backgroundColor: '#673ab7',
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Days' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

        // Peak Reporting Hours Chart (Polar Area)
        const peakHoursCtx = document.getElementById('peak-hours-chart').getContext('2d');
        const hours = Array(24).fill(0);
        filteredComplaints.forEach(c => {
            const hour = c.dateTime.getHours();
            hours[hour]++;
        });

        if (peakHoursChartInstance) peakHoursChartInstance.destroy();
        peakHoursChartInstance = new Chart(peakHoursCtx, {
            type: 'polarArea',
            data: {
                labels: [
                    '12-1AM', '1-2AM', '2-3AM', '3-4AM', '4-5AM', '5-6AM',
                    '6-7AM', '7-8AM', '8-9AM', '9-10AM', '10-11AM', '11-12PM',
                    '12-1PM', '1-2PM', '2-3PM', '3-4PM', '4-5PM', '5-6PM',
                    '6-7PM', '7-8PM', '8-9PM', '9-10PM', '10-11PM', '11-12AM'
                ],
                datasets: [{
                    label: 'Issues by Hour',
                    data: hours,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 205, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(201, 203, 207, 0.7)'
                    ],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        ticks: {
                            backdropColor: 'transparent',
                            stepSize: 2
                        },
                        grid: {
                            color: '#eee'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // --- Export Chart Functionality ---
    document.querySelector('.charts-container').addEventListener('click', function(e) {
        const exportBtn = e.target.closest('.export-chart-btn');
        if (!exportBtn) return;

        const chartId = exportBtn.dataset.chartId;
        let chartInstance;
        let fileName = `${chartId}.png`;

        switch (chartId) {
            case 'category-chart':
                chartInstance = categoryChartInstance;
                fileName = 'complaints_by_category.png';
                break;
            case 'status-trend-chart':
                chartInstance = statusTrendChartInstance;
                fileName = 'complaint_status_trend.png';
                break;
            case 'ward-chart':
                chartInstance = wardChartInstance;
                fileName = 'issues_by_ward.png';
                break;
            case 'issues-time-chart':
                chartInstance = issuesTimeChartInstance;
                fileName = 'issues_over_time.png';
                break;
            case 'top-voted-chart':
                chartInstance = topVotedChartInstance;
                fileName = 'top_voted_issues.png';
                break;
            case 'resolution-time-chart':
                chartInstance = resolutionTimeChartInstance;
                fileName = 'avg_resolution_time.png';
                break;
            case 'peak-hours-chart':
                chartInstance = peakHoursChartInstance;
                fileName = 'peak_reporting_hours.png';
                break;
        }

        if (chartInstance) {
            const imageLink = document.createElement('a');
            imageLink.href = chartInstance.toBase64Image();
            imageLink.download = fileName;
            imageLink.click();
        }
    });

    // --- Filters and Initial Load ---

    const locationFilter = document.getElementById('location-filter');
    const categoryFilter = document.getElementById('category-filter');
    const timeRangeFilter = document.getElementById('time-range-filter');

    function applyFilters() {
        const selectedLocation = locationFilter.value;
        const selectedCategory = categoryFilter.value;

        filteredComplaints = allComplaints.filter(c => {
            const locationMatch = selectedLocation === 'all' || c.location === selectedLocation;
            const categoryMatch = selectedCategory === 'all' || c.category === selectedCategory;
            return locationMatch && categoryMatch;
        });
        updateCharts();
    }

    locationFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    timeRangeFilter.addEventListener('change', applyFilters);

    const logoutBtn = document.getElementById('auth-logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authorityLoggedIn');
            localStorage.removeItem('authorityUsername');
            window.location.href = 'fixity.html';
        });
    }

    // Initial load
    applyFilters();
});