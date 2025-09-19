document.addEventListener('DOMContentLoaded', function() {
    const feedContainer = document.getElementById('community-feed-container');

    // Load complaints from localStorage
    function getComplaints() {
        const issues = localStorage.getItem('issues');
        return issues ? JSON.parse(issues) : [];
    }

    // Save complaints to localStorage
    function saveComplaints(complaints) {
        localStorage.setItem('issues', JSON.stringify(complaints));
    }

    // Function to render the complaints
    function renderComplaints() {
        let complaints = getComplaints();

        // Sort complaints by upvote count in descending order
        complaints.sort((a, b) => b.upvotes - a.upvotes);

        feedContainer.innerHTML = ''; // Clear previous content
        if (complaints.length === 0) {
            feedContainer.innerHTML = '<p style="text-align:center; color:#888;">No issues have been reported yet.</p>';
            return;
        }

        complaints.forEach(complaint => {
            const statusClass = complaint.status.toLowerCase().replace(/\s/g, '-');
            const card = document.createElement('div');
            card.className = 'complaint-card';
            card.innerHTML = `
                <img src="${complaint.image}" alt="Issue image" class="complaint-image">
                <div class="card-content">
                    <h3 class="complaint-description">${complaint.description}</h3>
                    <div class="card-meta">
                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${complaint.location}</span>
                        <span class="timestamp"><i class="fas fa-clock"></i> ${complaint.timestamp}</span>
                    </div>
                    <div class="card-footer">
                        <div class="status-badge ${statusClass}">${complaint.status}</div>
                        <button class="upvote-btn" data-id="${complaint.id}">
                            <i class="fas fa-arrow-up"></i>
                            <span class="upvote-count">${complaint.upvotes}</span> Upvotes
                        </button>
                        <button class="delete-btn" data-id="${complaint.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            feedContainer.appendChild(card);
        });
    }

    // Function to handle upvote and delete clicks
    feedContainer.addEventListener('click', function(event) {
        const upvoteBtn = event.target.closest('.upvote-btn');
        const deleteBtn = event.target.closest('.delete-btn');
        
        if (upvoteBtn) {
            const complaintId = parseInt(upvoteBtn.dataset.id);
            let complaints = getComplaints();
            const complaint = complaints.find(c => c.id === complaintId);
            if (complaint) {
                complaint.upvotes++;
                saveComplaints(complaints);
                renderComplaints();
            }
        } else if (deleteBtn) {
            const issueId = parseInt(deleteBtn.dataset.id);
            let complaints = getComplaints();
            
            const issueIndex = complaints.findIndex(issue => issue.id === issueId);
            if (issueIndex > -1) {
                complaints.splice(issueIndex, 1);
                saveComplaints(complaints);
                renderComplaints();
            }
        }
    });

    // Initial render
    renderComplaints();
});