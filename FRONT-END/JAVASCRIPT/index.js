document.addEventListener('DOMContentLoaded', function() {
  // Show modal when Citizen Login is clicked (navbar only)
  document.querySelectorAll('.login-options .login-btn.citizen').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('citizen-login-modal').classList.add('show');
      document.body.classList.add('modal-open');
    });
  });

  // Close modal
  var closeBtn = document.getElementById('close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      document.getElementById('citizen-login-modal').classList.remove('show');
      document.body.classList.remove('modal-open');
    });
  }

  // Login form submit
  var loginForm = document.getElementById('citizen-login-form');
  if (loginForm) {
    loginForm.onsubmit = function(e) {
      e.preventDefault();
      localStorage.setItem('citizenLoggedIn', 'true');
      document.getElementById('citizen-login-modal').classList.remove('show');
      document.body.classList.remove('modal-open');
      window.location.href = 'issues.html'; // Redirect to issues page
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