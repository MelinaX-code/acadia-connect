function showProfileLinkIfLoggedIn() {
  const profileLink = document.getElementById('profileLink');
  if (!profileLink) return;
  profileLink.style.display = isUserLoggedIn() ? 'inline-block' : 'none';
}

function validatePassword(password) {
  // At least 6 chars, at least one lowercase and one uppercase
  return /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(String(password || ''));
}

function validateEmail(email) {
  const value = String(email || '').trim();
  // Simple, practical email validation (avoids overly-strict RFC rules)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getFormValue(form, selector) {
  return form.querySelector(selector)?.value?.trim() ?? '';
}

function getFormAnyValueByName(form, name) {
  const el = form.querySelector(`[name="${name}"]`);
  return el ? String(el.value || '').trim() : '';
}

function getFormSelectValue(form, name) {
  const el = form.querySelector(`[name="${name}"]`);
  return el ? String(el.value).trim() : '';
}

function parseCommaList(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0);
}

// Login page
const loginForm = document.getElementById('loginForm') || document.querySelector('.form-box.login form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = getFormValue(loginForm, 'input[name="email"]');
    const password = getFormValue(loginForm, 'input[name="password"]');

    try {
      await loginUser(email, password);
      alert('Login successful!');
      window.location.href = 'messages.html';
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  });
}

// Forgot password page
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = getFormValue(forgotPasswordForm, 'input[name="email"]');

    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      await requestPasswordReset(email);
      alert('If an account exists for that email, a reset link has been sent.');
      window.location.href = 'login.html';
    } catch (error) {
      alert('Request failed: ' + error.message);
    }
  });
}

// Reset password page
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
  const params = new URLSearchParams(window.location.search || '');
  const tokenFromUrl = params.get('token') || '';
  const tokenField = resetPasswordForm.querySelector('input[name="token"]');
  if (tokenField) tokenField.value = tokenFromUrl;

  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = getFormAnyValueByName(resetPasswordForm, 'token');
    const password = getFormValue(resetPasswordForm, 'input[name="password"]');
    const confirmPassword = getFormValue(resetPasswordForm, 'input[name="confirmPassword"]');

    if (!token) {
      alert('Missing reset token. Please use the link from your email.');
      return;
    }

    if (!validatePassword(password)) {
      alert('Password must be at least 6 characters and include at least one uppercase and one lowercase letter.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      await resetPassword(token, password, confirmPassword);
      logoutUser();
      alert('Password updated successfully. Please log in.');
      window.location.href = 'login.html';
    } catch (error) {
      alert('Reset failed: ' + error.message);
    }
  });
}

// Change password page (requires being logged in)
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  // If not logged in, bounce to login
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
  }

  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = getFormValue(changePasswordForm, 'input[name="currentPassword"]');
    const newPassword = getFormValue(changePasswordForm, 'input[name="newPassword"]');
    const confirmNewPassword = getFormValue(changePasswordForm, 'input[name="confirmNewPassword"]');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!validatePassword(newPassword)) {
      alert('New password must be at least 6 characters and include at least one uppercase and one lowercase letter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('New passwords do not match.');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword, confirmNewPassword);
      // Force re-login for safety/clarity
      logoutUser();
      alert('Password updated successfully. Please log in again.');
      window.location.href = 'login.html';
    } catch (error) {
      alert('Change password failed: ' + error.message);
    }
  });
}

// Register page
const registerForm = document.getElementById('registerForm') || document.querySelector('.form-box.register form');
if (registerForm) {
  const step1 = document.getElementById('registerStep1');
  const step2 = document.getElementById('registerStep2');
  const nextBtn = document.getElementById('registerNextBtn');
  const backBtn = document.getElementById('registerBackBtn');

  function showStep(step) {
    if (!step1 || !step2) return;
    const isStep1 = step === 1;
    step1.style.display = isStep1 ? 'block' : 'none';
    step2.style.display = isStep1 ? 'none' : 'block';
  }

  function isOnStep1() {
    return step1 && step1.style.display !== 'none';
  }

  const selfieInput = registerForm.querySelector('input[name="selfiePhoto"]');
  const selfiePreview = document.getElementById('selfiePreview');
  selfieInput?.addEventListener('change', async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !selfiePreview) return;
    if (!String(file.type || '').startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      selfiePreview.src = dataUrl;
    } catch {
      // ignore
    }
  });

  nextBtn?.addEventListener('click', () => {
    // Step 1 validation before moving forward
    const firstName = getFormValue(registerForm, 'input[name="firstName"]');
    const lastName = getFormValue(registerForm, 'input[name="lastName"]');
    const email = getFormValue(registerForm, 'input[name="email"]');
    const gender = getFormSelectValue(registerForm, 'gender');
    const role = getFormSelectValue(registerForm, 'role');
    const country = getFormAnyValueByName(registerForm, 'country') || 'Canada';
    const department = getFormAnyValueByName(registerForm, 'department');
    const password = getFormValue(registerForm, 'input[name="password"]');
    const confirmPassword = getFormValue(registerForm, 'input[name="confirmPassword"]');

    if (!firstName || !lastName || !email || !gender || !role || !country || !department) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      alert('Password must be at least 6 characters and include at least one uppercase and one lowercase letter.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    showStep(2);
  });

  backBtn?.addEventListener('click', () => showStep(1));

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // If user hits Enter on step 1, treat as Next.
    if (step1 && step2 && isOnStep1()) {
      nextBtn?.click();
      return;
    }

    const firstName = getFormValue(registerForm, 'input[name="firstName"]');
    const lastName = getFormValue(registerForm, 'input[name="lastName"]');
    const email = getFormValue(registerForm, 'input[name="email"]');
    const gender = getFormSelectValue(registerForm, 'gender');
    const role = getFormSelectValue(registerForm, 'role');
    const country = getFormAnyValueByName(registerForm, 'country') || 'Canada';
    const department = getFormAnyValueByName(registerForm, 'department');
    const password = getFormValue(registerForm, 'input[name="password"]');
    const confirmPassword = getFormValue(registerForm, 'input[name="confirmPassword"]');

    const bio = getFormAnyValueByName(registerForm, 'bio');
    const hobbies = parseCommaList(getFormAnyValueByName(registerForm, 'hobbies'));
    const interests = parseCommaList(getFormAnyValueByName(registerForm, 'interests'));
    const year = getFormAnyValueByName(registerForm, 'year');
    const languages = parseCommaList(getFormAnyValueByName(registerForm, 'languages'));

    const selfieFile = registerForm.querySelector('input[name="selfiePhoto"]')?.files?.[0] ?? null;
    let selfiePhotoDataUrl = '';
    if (selfieFile) {
      if (!String(selfieFile.type || '').startsWith('image/')) {
        alert('Selfie photo must be an image file.');
        return;
      }

      // Keep payloads reasonable (2MB max)
      const maxBytes = 2 * 1024 * 1024;
      if (selfieFile.size > maxBytes) {
        alert('Selfie photo is too large. Please choose an image under 2MB.');
        return;
      }

      try {
        selfiePhotoDataUrl = await readFileAsDataUrl(selfieFile);
      } catch (err) {
        alert('Failed to read selfie photo.');
        return;
      }
    }

    if (!firstName || !lastName || !email || !gender || !role || !country || !department) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      alert('Password must be at least 6 characters and include at least one uppercase and one lowercase letter.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      await registerUser({
        firstName,
        lastName,
        email,
        gender,
        role,
        country,
        department,
        password,
        confirmPassword,
        photo: selfiePhotoDataUrl || undefined,
        bio: bio || undefined,
        hobbies: hobbies.length ? hobbies : undefined,
        interests: interests.length ? interests : undefined,
        year: year || undefined,
        languages: languages.length ? languages : undefined,
      });
      alert('Registration successful!');
      window.location.href = 'messages.html';
    } catch (error) {
      alert('Registration failed: ' + error.message);
    }
  });

  // Default to step 1
  if (step1 && step2) showStep(1);
}

showProfileLinkIfLoggedIn();
