document.addEventListener('DOMContentLoaded', function() {
  // Show Citizen Login Modal
  const citizenBtn = document.getElementById('citizen-login-btn');
  if (citizenBtn) {
    citizenBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = document.getElementById('citizen-login-modal');
      if (modal) {
        modal.classList.add('show');
        document.body.classList.add('modal-open');
      }
    });
  }

  // Show Authority Login Modal
  const authorityBtn = document.getElementById('authority-login-btn');
  if (authorityBtn) {
    authorityBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = document.getElementById('authority-login-modal');
      if (modal) {
        modal.classList.add('show');
        document.body.classList.add('modal-open');
      }
    });
  }

  // Close Citizen Modal
  const closeCitizenBtn = document.getElementById('close-citizen-modal');
  if (closeCitizenBtn) {
    closeCitizenBtn.addEventListener('click', function() {
      document.getElementById('citizen-login-modal').classList.remove('show');
      document.body.classList.remove('modal-open');
    });
  }

  // Close Authority Modal
  const closeAuthorityBtn = document.getElementById('close-authority-modal');
  if (closeAuthorityBtn) {
    closeAuthorityBtn.addEventListener('click', function() {
      document.getElementById('authority-login-modal').classList.remove('show');
      document.body.classList.remove('modal-open');
    });
  }

  // Citizen Login form submit
  var citizenLoginForm = document.getElementById('citizen-login-form');
  if (citizenLoginForm) {
    citizenLoginForm.onsubmit = function(e) {
      e.preventDefault();
      
      const username = document.getElementById('citizen-username').value;
      const password = document.getElementById('citizen-password').value;
      
      // Simple validation
      if (username && password) {
        localStorage.setItem('citizenLoggedIn', 'true');
        localStorage.setItem('citizenUsername', username);
        document.getElementById('citizen-login-modal').classList.remove('show');
        document.body.classList.remove('modal-open');
        window.location.href = 'Citizen.html'; // Redirect to Citizen.html
      } else {
        alert('Please fill in all fields');
      }
    };
  }

  // Authority Login form submit
  var authorityLoginForm = document.getElementById('authority-login-form');
  if (authorityLoginForm) {
    authorityLoginForm.onsubmit = function(e) {
      e.preventDefault();
      
      const username = document.getElementById('authority-username').value;
      const password = document.getElementById('authority-password').value;
      
      // Simple validation
      if (username && password) {
        localStorage.setItem('authorityLoggedIn', 'true');
        localStorage.setItem('authorityUsername', username);
        document.getElementById('authority-login-modal').classList.remove('show');
        document.body.classList.remove('modal-open');
        window.location.href = 'login-authority.html'; // Redirect to login-authority.html
      } else {
        alert('Please fill in all fields');
      }
    };
  }

  // Show logged-in status and logout option
  function updateCitizenStatus() {
    const loggedIn = localStorage.getItem('citizenLoggedIn') === 'true';
    const loginOptions = document.querySelector('.login-options');
    if (loggedIn && loginOptions) {
      loginOptions.innerHTML = `
        <span class="citizen-status"><i class="fas fa-user"></i> Citizen Logged In</span>
        <a href="#" class="login-btn citizen" id="citizen-logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;
      document.getElementById('citizen-logout').onclick = function(e) {
        e.preventDefault();
        localStorage.removeItem('citizenLoggedIn');
        window.location.reload();
      };
    }
  }
  updateCitizenStatus();

  const fileInput = document.getElementById('issue-media');
  const fileNameSpan = document.getElementById('upload-filename');
  const uploadBtn = document.querySelector('.upload-btn');
  if (fileInput && fileNameSpan && uploadBtn) {
    uploadBtn.addEventListener('click', function() {
      fileInput.click();
    });
    fileInput.addEventListener('change', function() {
      fileNameSpan.textContent = fileInput.files.length ? fileInput.files[0].name : '';
    });
  }

  const locationBtn = document.getElementById('get-location');
  const zoneInput = document.getElementById('issue-zone');
  if (locationBtn && zoneInput) {
    locationBtn.onclick = function() {
      if (navigator.geolocation) {
        locationBtn.textContent = "Locating...";
        navigator.geolocation.getCurrentPosition(function(pos) {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          zoneInput.value = `Lat: ${lat}, Lng: ${lng}`;
          locationBtn.textContent = "Use Current Location";
        }, function() {
          zoneInput.value = "Unable to get location";
          locationBtn.textContent = "Use Current Location";
        });
      } else {
        zoneInput.value = "Geolocation not supported";
      }
    };
  }
});