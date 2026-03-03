const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const loginForm = document.querySelector('.form-box.login form');
const registerForm = document.querySelector('.form-box.register form');

// Default state = Login
wrapper?.classList.remove('active');

// Switch to Register form
registerLink?.addEventListener('click', (e) => {
  e.preventDefault();
  wrapper?.classList.add('active');
});

// Switch back to Login form
loginLink?.addEventListener('click', (e) => {
  e.preventDefault();
  wrapper?.classList.remove('active');
});

// Handle Login Form Submission
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;
    
    try {
      const result = await loginUser(email, password);
      alert('Login successful!');
      // Redirect to profile page
      window.location.href = 'profile.html';
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  });
}

// Handle Register Form Submission
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = registerForm.querySelector('input[type="text"]').value;
    const email = registerForm.querySelector('input[type="email"]').value;
    const role = registerForm.querySelector('select').value;
    const password = registerForm.querySelector('input[type="password"]').value;
    const termsCheckbox = registerForm.querySelector('input[type="checkbox"]').checked;
    
    if (!termsCheckbox) {
      alert('Please agree to the terms & conditions');
      return;
    }
    
    try {
      const result = await registerUser(fullName, email, password, role);
      alert('Registration successful!');
      // Redirect to profile page
      window.location.href = 'profile.html';
    } catch (error) {
      alert('Registration failed: ' + error.message);
    }
  });
}
