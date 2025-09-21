document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const issueListView = document.getElementById('issue-list-view');
    const issueDetailView = document.getElementById('issue-detail-view');
    const issueListContainer = document.getElementById('issue-list-container');
    const searchInput = document.getElementById('search-issues');

    // --- Map Initialization ---
    const map = L.map('map-container').setView([20.2736, 85.8436], 12); // Centered on Bhubaneswar
    const markers = L.markerClusterGroup();
    let issueMarkers = {}; // To store markers by issue ID

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const issueDescriptions = [
        "Pothole near school", "Garbage not collected", "Broken streetlight",
        "Water leakage", "Illegal parking", "Blocked road",
        "Damaged footpath", "Fallen tree on road", "Missing manhole cover",
        "Public fountain not working", "Damaged bus stop", "Graffiti on public wall",
        "Sewer overflow", "Stagnant water in street", "Park equipment broken",
        "Loud construction noise", "Abandoned vehicle", "Power outage in sector",
        "Broken traffic light", "Faded road markings"
    ];
    const statuses = ["Pending", "In Progress", "Resolved"];
    const wards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4"];

    // Latitude and Longitude bounds for Khordha district, Odisha
    const minLat = 19.666;
    const maxLat = 20.416;
    const minLng = 84.933;
    const maxLng = 86.083;

    function generateDummyIssues(count, lat, lng, latOffset, lngOffset) {
        const generatedIssues = [];
        for (let i = 0; i < count; i++) {
            const randomLat = lat + (Math.random() - 0.5) * latOffset;
            const randomLng = lng + (Math.random() - 0.5) * lngOffset;
            const randomDesc = issueDescriptions[Math.floor(Math.random() * issueDescriptions.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const randomWard = wards[Math.floor(Math.random() * wards.length)];
            const randomVotes = Math.floor(Math.random() * 100) + 1;
            const randomTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString();

            generatedIssues.push({
                "id": `FIX-${1000 + i}`,
                "desc": randomDesc,
                "status": randomStatus,
                "votes": randomVotes,
                "lat": randomLat,
                "lng": randomLng,
                "time": randomTime,
                "ward": randomWard
            });
        }
        return generatedIssues;
    }

    let allIssues = generateDummyIssues(200, (minLat + maxLat) / 2, (minLng + maxLng) / 2, maxLat - minLat, maxLng - minLng);

    const statusColors = {
        'Pending': '#e53935', // Red
        'In Progress': '#ffa000', // Orange
        'Resolved': '#43a047' // Green
    };

    // --- View Rendering Functions ---

    function renderIssueList(issuesToRender) {
        issueListContainer.innerHTML = '';
        if (issuesToRender.length === 0) {
            issueListContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #888;">No issues found.</p>';
            return;
        }

        const list = document.createElement('ul');
        list.id = 'issue-list';
        issuesToRender.forEach(issue => {
            const item = document.createElement('li');
            item.className = 'issue-list-item';
            item.dataset.issueId = issue.id;
            item.innerHTML = `
                <h4>${issue.desc}</h4>
                <p>
                    <span><i class="fas fa-tag"></i> ${issue.status}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${issue.ward}</span>
                </p>
            `;
            list.appendChild(item);
        });
        issueListContainer.appendChild(list);
    }

    function showIssueDetails(issue) {
        issueDetailView.innerHTML = `
            <div class="sidebar-header">
                <button class="detail-back-btn" id="back-to-list-btn"><i class="fas fa-arrow-left"></i> Back to List</button>
            </div>
            <div class="issue-detail-content">
                <h3>${issue.desc}</h3>
                <div class="detail-group">
                    <label>Issue ID</label>
                    <p>${issue.id}</p>
                </div>
                <div class="detail-group">
                    <label>Location</label>
                    <p>${issue.ward} (Lat: ${issue.lat.toFixed(4)}, Lng: ${issue.lng.toFixed(4)})</p>
                </div>
                <div class="detail-group">
                    <label>Reported On</label>
                    <p>${issue.time}</p>
                </div>
                <div class="detail-group">
                    <label>Votes</label>
                    <p><i class="fas fa-thumbs-up"></i> ${issue.votes}</p>
                </div>
                <div class="detail-group">
                    <label for="status-updater">Update Status</label>
                    <select id="status-updater" data-issue-id="${issue.id}">
                        <option value="Pending" ${issue.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
            </div>
        `;
        issueListView.style.display = 'none';
        issueDetailView.style.display = 'block';
    }

    function showListView() {
        issueDetailView.style.display = 'none';
        issueListView.style.display = 'block';
        // De-select any active list items
        const activeItem = document.querySelector('.issue-list-item.active');
        if (activeItem) activeItem.classList.remove('active');
    }

    function renderMarkers(issuesToRender) {
        markers.clearLayers();
        issueMarkers = {};
        const markersToAdd = [];

        issuesToRender.forEach(issue => {
            const marker = L.circleMarker([issue.lat, issue.lng], {
                radius: 8,
                fillColor: statusColors[issue.status],
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.on('click', () => {
                handleIssueSelection(issue.id);
            });

            marker.bindPopup(`
                <b>Issue ID:</b> ${issue.id}<br>
                <b>Description:</b> ${issue.desc}<br>
                <b>Status:</b> ${issue.status}<br>
                <b>Votes:</b> ${issue.votes}<br>
                <b>Timestamp:</b> ${issue.time}
            `);
            markersToAdd.push(marker);
            issueMarkers[issue.id] = marker;
        });
        markers.addLayers(markersToAdd);
        map.addLayer(markers);
    }

    // --- Event Handling ---

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = allIssues.filter(issue => {
            const searchMatch = issue.desc.toLowerCase().includes(searchTerm);
            return searchMatch;
        });
        renderIssueList(filtered);
        renderMarkers(filtered);
    }

    function handleIssueSelection(issueId) {
        const issue = allIssues.find(i => i.id === issueId);
        if (!issue) return;

        // Show details in sidebar
        showIssueDetails(issue);

        // Highlight in list
        const activeItem = document.querySelector('.issue-list-item.active');
        if (activeItem) activeItem.classList.remove('active');
        const listItem = document.querySelector(`.issue-list-item[data-issue-id="${issueId}"]`);
        if (listItem) {
            listItem.classList.add('active');
            listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Pan map and open popup
        const marker = issueMarkers[issueId];
        if (marker) {
            map.setView(marker.getLatLng(), 15);
            marker.openPopup();
        }
    }

    // Event Listeners
    searchInput.addEventListener('input', applyFilters);

    document.getElementById('map-sidebar').addEventListener('click', (e) => {
        const listItem = e.target.closest('.issue-list-item');
        const backBtn = e.target.closest('#back-to-list-btn');

        if (listItem) {
            handleIssueSelection(listItem.dataset.issueId);
        }
        if (backBtn) {
            showListView();
        }
    });

    document.getElementById('map-sidebar').addEventListener('change', (e) => {
        if (e.target.id === 'status-updater') {
            const issueId = e.target.dataset.issueId;
            const newStatus = e.target.value;
            const issue = allIssues.find(i => i.id === issueId);
            if (issue) {
                issue.status = newStatus;
                applyFilters(); // Re-render everything to reflect the change
                // Keep the detail view open
                showIssueDetails(issue);
            }
        }
    });

    const showLocationBtn = document.getElementById('show-my-district-btn');
    if (showLocationBtn) {
        showLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                showLocationBtn.classList.add('loading');
                showLocationBtn.textContent = 'Locating...';
                
                navigator.geolocation.getCurrentPosition(position => {
                    const { latitude, longitude } = position.coords;
                    
                    // Generate new issues around current location
                    const newIssuesAroundMe = generateDummyIssues(50, latitude, longitude, 0.02, 0.02);
                    allIssues = allIssues.concat(newIssuesAroundMe);
                    
                    // Re-render all markers including the new ones
                    applyFilters();

                    // Center the map on the user's location
                    map.setView([latitude, longitude], 13);
                    
                    const userMarker = L.marker([latitude, longitude], {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    }).addTo(map);

                    userMarker.bindPopup("Reports near you").openPopup();
                    
                    showLocationBtn.classList.remove('loading');
                    showLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Civic Issues Near Me';
                    
                }, () => {
                    alert('Geolocation is not supported by this browser or permission denied.');
                    showLocationBtn.classList.remove('loading');
                    showLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Civic Issues Near Me';
                });
            } else {
                alert('Geolocation is not supported by this browser or permission denied.');
            }
        });
    }
    
    // --- Initial Load ---
    setTimeout(function() {
        map.invalidateSize();
    }, 100);

    applyFilters();
    showListView();
});