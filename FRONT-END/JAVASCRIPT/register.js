document.addEventListener('DOMContentLoaded', function() {
  const registrationForm = document.getElementById('citizen-registration-form');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const usernameInput = document.getElementById('username');
  const termsCheckbox = document.getElementById('terms-agreement');

  // Real-time password validation
  function validatePassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Password strength requirements
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let isValid = password.length >= minLength;
    let message = '';
    
    if (!isValid) {
      message = `Password must be at least ${minLength} characters long`;
    } else if (!hasUpperCase) {
      message = 'Password must contain at least one uppercase letter';
      isValid = false;
    } else if (!hasLowerCase) {
      message = 'Password must contain at least one lowercase letter';
      isValid = false;
    } else if (!hasNumbers) {
      message = 'Password must contain at least one number';
      isValid = false;
    } else if (!hasSpecialChar) {
      message = 'Password must contain at least one special character';
      isValid = false;
    } else if (confirmPassword && password !== confirmPassword) {
      message = 'Passwords do not match';
      isValid = false;
    } else if (confirmPassword && password === confirmPassword) {
      message = 'Passwords match ✓';
      isValid = true;
    }
    
    // Update helper text
    const helperText = passwordInput.parentNode.querySelector('.helper-text');
    if (helperText) {
      helperText.textContent = message;
      helperText.style.color = isValid ? '#009688' : '#e53935';
    }
    
    return isValid;
  }

  // Real-time confirm password validation
  function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword) {
      const isValid = password === confirmPassword;
      const helperText = confirmPasswordInput.parentNode.querySelector('.helper-text') || 
                        createHelperText(confirmPasswordInput.parentNode);
      
      helperText.textContent = isValid ? 'Passwords match ✓' : 'Passwords do not match';
      helperText.style.color = isValid ? '#009688' : '#e53935';
      
      return isValid;
    }
    return true;
  }

  // Create helper text element if it doesn't exist
  function createHelperText(parent) {
    const helperText = document.createElement('small');
    helperText.className = 'helper-text';
    parent.appendChild(helperText);
    return helperText;
  }

  // Email validation
  function validateEmail() {
    const email = emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    const helperText = emailInput.parentNode.querySelector('.helper-text') || 
                      createHelperText(emailInput.parentNode);
    
    if (email && !isValid) {
      helperText.textContent = 'Please enter a valid email address';
      helperText.style.color = '#e53935';
    } else if (email && isValid) {
      helperText.textContent = 'Valid email address ✓';
      helperText.style.color = '#009688';
    } else {
      helperText.textContent = '';
    }
    
    return isValid;
  }

  // Phone validation
  function validatePhone() {
    const phone = phoneInput.value;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const isValid = phoneRegex.test(phone.replace(/\s/g, ''));
    
    const helperText = phoneInput.parentNode.querySelector('.helper-text') || 
                      createHelperText(phoneInput.parentNode);
    
    if (phone && !isValid) {
      helperText.textContent = 'Please enter a valid phone number';
      helperText.style.color = '#e53935';
    } else if (phone && isValid) {
      helperText.textContent = 'Valid phone number ✓';
      helperText.style.color = '#009688';
    } else {
      helperText.textContent = '';
    }
    
    return isValid;
  }

  // Username validation
  function validateUsername() {
    const username = usernameInput.value;
    const isValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
    
    const helperText = usernameInput.parentNode.querySelector('.helper-text');
    if (helperText) {
      if (username && !isValid) {
        helperText.textContent = 'Username must be at least 3 characters and contain only letters, numbers, and underscores';
        helperText.style.color = '#e53935';
      } else if (username && isValid) {
        helperText.textContent = 'Username is available ✓';
        helperText.style.color = '#009688';
      }
    }
    
    return isValid;
  }

  // Age validation
  function validateAge() {
    const dobInput = document.getElementById('date-of-birth');
    const dob = new Date(dobInput.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
    const isValid = actualAge >= 13 && actualAge <= 120;
    
    const helperText = dobInput.parentNode.querySelector('.helper-text') || 
                      createHelperText(dobInput.parentNode);
    
    if (dobInput.value && !isValid) {
      helperText.textContent = 'You must be at least 13 years old to register';
      helperText.style.color = '#e53935';
    } else if (dobInput.value && isValid) {
      helperText.textContent = `Age: ${actualAge} years ✓`;
      helperText.style.color = '#009688';
    } else {
      helperText.textContent = '';
    }
    
    return isValid;
  }

  // Event listeners for real-time validation
  passwordInput.addEventListener('input', validatePassword);
  confirmPasswordInput.addEventListener('input', validateConfirmPassword);
  emailInput.addEventListener('input', validateEmail);
  phoneInput.addEventListener('input', validatePhone);
  usernameInput.addEventListener('input', validateUsername);
  document.getElementById('date-of-birth').addEventListener('change', validateAge);

  // Form submission
  registrationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate all fields
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isUsernameValid = validateUsername();
    const isAgeValid = validateAge();
    const isTermsAccepted = termsCheckbox.checked;
    
    // Check if all validations pass
    if (!isPasswordValid || !isConfirmPasswordValid || !isEmailValid || 
        !isPhoneValid || !isUsernameValid || !isAgeValid || !isTermsAccepted) {
      
      // Show error message
      showNotification('Please fix all validation errors before submitting.', 'error');
      return;
    }
    
    // Collect form data
    const formData = new FormData(registrationForm);
    const userData = {
      firstName: formData.get('first-name'),
      lastName: formData.get('last-name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      dateOfBirth: formData.get('date-of-birth'),
      address: formData.get('address'),
      city: formData.get('city'),
      pincode: formData.get('pincode'),
      username: formData.get('username'),
      password: formData.get('password'),
      emailNotifications: formData.has('email-notifications'),
      smsNotifications: formData.has('sms-notifications'),
      issueUpdates: formData.has('issue-updates'),
      interests: formData.getAll('interests'),
      registrationDate: new Date().toISOString()
    };
    
    // Store user data in localStorage (in a real app, this would be sent to a server)
    try {
      // Check if username already exists
      const existingUsers = JSON.parse(localStorage.getItem('citizenUsers') || '[]');
      const usernameExists = existingUsers.some(user => user.username === userData.username);
      
      if (usernameExists) {
        showNotification('Username already exists. Please choose a different username.', 'error');
        return;
      }
      
      // Add new user
      existingUsers.push(userData);
      localStorage.setItem('citizenUsers', JSON.stringify(existingUsers));
      
      // Show success message
      showNotification('Registration successful! Redirecting to login...', 'success');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = 'fixity.html';
      }, 2000);
      
    } catch (error) {
      console.error('Error saving user data:', error);
      showNotification('Registration failed. Please try again.', 'error');
    }
  });

  // Notification system
  function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  // Add input focus effects
  const inputs = document.querySelectorAll('.registration-form input, .registration-form textarea');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentNode.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentNode.classList.remove('focused');
    });
  });
});
