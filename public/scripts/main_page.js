document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const currentProfilePic = document.getElementById('current-profile-pic');
    const userLoginDisplay = document.getElementById('user-login-display');
    const avatarImageInput = document.getElementById('avatar-file-input');

    async function fetchAndDisplayUserLogin() {
        try {
            const response = await fetch('/api/user/me');
            if (response.ok) {
                const userData = await response.json();
                if (userData.login) {
                    userLoginDisplay.textContent = userData.login;
                } else {
                    userLoginDisplay.textContent = "User";
                    console.error('Login not found in user data:', userData);
                }
            } else {
                console.error('Failed to fetch user data, status:', response.status);
                userLoginDisplay.textContent = "Guest";
                if (response.status === 401 || response.status === 403) {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            userLoginDisplay.textContent = "Error";
        }
    }

    fetchAndDisplayUserLogin();

    async function fetchAndDisplayUserAvatar() {
      const cached = localStorage.getItem('avatarURL');
      if (cached) currentProfilePic.src = cached;
      try {
        const res = await fetch('/api/profile_picture')

        if (res.ok) {
            const res_json = await res.json(); // Convert to json

          if (res_json) {
            currentProfilePic.src = res_json.pfpUrl; // get pfpURL field from an object { pfpUrl }
            localStorage.setItem('avatarURL', res_json.pfpUrl); // save it to the local storage
          }
        } else if (res.status !== 404) console.warn('Avatar GET status', res.status);
      } catch (err) {
        console.error('Failed to fetch avatar: ', err);
      }
    }

    fetchAndDisplayUserAvatar();

    avatarImageInput.addEventListener('change', async () => {
      const file = avatarImageInput.files[0];
      if (!file) return;

      try {
        if (!file.type.startsWith('image/')) {
          alert('Wrong image type');
          return;
        }
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/profile_picture', {
          method: 'POST',
          body: fd,
          credentials: 'include'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let url;
        if (res.headers.get('content-type')?.includes('application/json')) {
          ({ url_pfp: url } = await res.json());
        } else url = URL.createObjectURL(file);
        
        currentProfilePic.src = url;
        localStorage.setItem('avatarURL', url);
      } catch (err) {
        console.error('Failed to upload avatar: ', err);
        alert('Failed to upload avatar. Try again');
      } finally {
        avatarImageInput.value = '';
      }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    localStorage.removeItem('selectedAvatar');
                    window.location.href = '/login';
                } else {
                    let errorMessage = `Logout failed (status ${response.status}).`;
                    try {
                        const errorData = await response.json();
                        if (errorData && (errorData.message || errorData.error)) {
                            errorMessage = `Logout failed: ${errorData.message || errorData.error}`;
                        }
                    } catch (e) {
                        console.warn("Could not parse logout error response as JSON. Status:", response.status, e);
                    }
                    alert(errorMessage);
                    console.error('Logout failed:', errorMessage, 'Status:', response.status);
                }
            } catch (networkError) {
                console.error('Network error during logout:', networkError);
                alert('A network error occurred during logout. Please try again.');
            }
        });
    }
});