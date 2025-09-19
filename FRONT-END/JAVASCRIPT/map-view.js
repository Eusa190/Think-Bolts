document.addEventListener('DOMContentLoaded', function() {
    const map = L.map('map-container').setView([20.2736, 85.8436], 12); // Centered on Bhubaneswar

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
            const randomVotes = Math.floor(Math.random() * 100) + 1;
            const randomTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString();

            generatedIssues.push({
                "id": Date.now() + Math.random(),
                "desc": randomDesc,
                "status": randomStatus,
                "votes": randomVotes,
                "lat": randomLat,
                "lng": randomLng,
                "time": randomTime
            });
        }
        return generatedIssues;
    }

    let issues = generateDummyIssues(200, (minLat + maxLat) / 2, (minLng + maxLng) / 2, maxLat - minLat, maxLng - minLng);

    const statusColors = {
        'Pending': '#e53935', // Red
        'In Progress': '#ffa000', // Orange
        'Resolved': '#43a047' // Green
    };

    const markers = L.markerClusterGroup();

    function renderMarkers(filter = 'all', issuesToRender = issues) {
        markers.clearLayers();
        const filteredIssues = issuesToRender.filter(issue => filter === 'all' || issue.status === filter);
        const markersToAdd = [];

        filteredIssues.forEach(issue => {
            const marker = L.circleMarker([issue.lat, issue.lng], {
                radius: 8,
                fillColor: statusColors[issue.status],
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(`
                <b>Issue ID:</b> ${issue.id}<br>
                <b>Description:</b> ${issue.desc}<br>
                <b>Status:</b> ${issue.status}<br>
                <b>Votes:</b> ${issue.votes}<br>
                <b>Timestamp:</b> ${issue.time}
            `);
            markersToAdd.push(marker);
        });
        markers.addLayers(markersToAdd);
        map.addLayer(markers);
    }

    renderMarkers();

    document.getElementById('filter-all').addEventListener('click', () => renderMarkers('all'));
    document.getElementById('filter-pending').addEventListener('click', () => renderMarkers('Pending'));
    document.getElementById('filter-in-progress').addEventListener('click', () => renderMarkers('In Progress'));
    document.getElementById('filter-resolved').addEventListener('click', () => renderMarkers('Resolved'));

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
                    issues = issues.concat(newIssuesAroundMe);
                    
                    // Re-render all markers including the new ones
                    renderMarkers('all');

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
    
    setTimeout(function() {
        map.invalidateSize();
    }, 100);
});