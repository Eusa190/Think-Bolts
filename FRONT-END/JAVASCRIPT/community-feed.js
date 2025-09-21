document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 600,
        once: true,
    });

    const feedContainer = document.getElementById('community-feed-container');

    const dummyUsers = [
        { name: 'Alex R.', avatar: 'https://i.pravatar.cc/150?img=1' },
        { name: 'Maria G.', avatar: 'https://i.pravatar.cc/150?img=5' },
        { name: 'Sam K.', avatar: 'https://i.pravatar.cc/150?img=8' },
        { name: 'Anonymous', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    ];

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
    function renderComplaints(sortBy = 'trending') {
        let complaints = getComplaints();

        // Sorting logic
        if (sortBy === 'newest') {
            complaints.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else { // Default to trending (by upvotes)
            complaints.sort((a, b) => b.upvotes - a.upvotes);
        }

        feedContainer.innerHTML = ''; // Clear previous content
        if (complaints.length === 0) {
            feedContainer.innerHTML = '<p style="text-align:center; color:#888;">No issues have been reported yet.</p>';
            return;
        }

        complaints.forEach((complaint, index) => {
            const statusClass = complaint.status.toLowerCase().replace(/\s/g, '-');
            const user = dummyUsers[index % dummyUsers.length];
            const card = document.createElement('div');
            card.className = 'complaint-card';
            card.setAttribute('data-aos', 'fade-up');
            card.setAttribute('data-aos-delay', (index % 2) * 100);

            card.innerHTML = `
                <div class="card-header">
                    <img src="${user.avatar}" alt="User Avatar" class="user-avatar">
                    <div class="user-info">
                        <span class="user-name">${user.name}</span>
                        <span class="card-timestamp">${complaint.timestamp}</span>
                    </div>
                </div>
                ${complaint.image ? `<img src="${complaint.image}" alt="Issue image" class="complaint-image">` : ''}
                <div class="card-content">
                    <h4 class="complaint-title">${complaint.title}</h4>
                    <p class="complaint-description">${complaint.description}</p>
                    <div class="card-meta">
                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${complaint.location}</span>
                    </div>
                    <div class="card-footer">
                        <button class="upvote-btn" data-id="${complaint.id}">
                            <i class="fas fa-arrow-up"></i>
                            <span class="upvote-count">${complaint.upvotes}</span>
                        </button>
                        <div class="card-actions-right">
                            <span class="comments-btn"><i class="fas fa-comment"></i> ${Math.floor(Math.random() * 20)}</span>
                            <button class="delete-btn" data-id="${complaint.id}" title="Delete this post">
                                <i class="fas fa-trash"></i>
                            </button>
                            <div class="status-badge ${statusClass}">${complaint.status}</div>
                        </div>
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

                const countSpan = upvoteBtn.querySelector('.upvote-count');
                countSpan.textContent = complaint.upvotes;
                upvoteBtn.classList.add('upvoted');
                setTimeout(() => {
                    upvoteBtn.classList.remove('upvoted');
                }, 500);
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

    // Add event listeners for filters
    const filterButtons = document.querySelectorAll('.feed-filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const sortBy = button.dataset.sort;
            renderComplaints(sortBy);
        });
    });

    // Initial render
    renderComplaints('trending');
});