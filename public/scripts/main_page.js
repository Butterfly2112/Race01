document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const currentProfilePic = document.getElementById('current-profile-pic');
    const userLoginDisplay = document.getElementById('user-login-display');
    const selectableAvatars = document.querySelectorAll('.selectable-avatar');

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

        const savedAvatar = localStorage.getItem('selectedAvatar');
        if (savedAvatar) {
            currentProfilePic.src = savedAvatar;
        } else {
            currentProfilePic.src = '/images/default-avatar.jpg';
        }

        selectableAvatars.forEach(avatarImg => {
            const currentAvatarFullSrc = new URL(currentProfilePic.src, window.location.origin).pathname;
            avatarImg.classList.toggle('selected', avatarImg.dataset.avatar === currentAvatarFullSrc || avatarImg.dataset.avatar === currentProfilePic.src);
        });
    }

    fetchAndDisplayUserLogin();

    selectableAvatars.forEach(avatar => {
        avatar.addEventListener('click', () => {
            const newAvatarSrc = avatar.dataset.avatar;
            currentProfilePic.src = newAvatarSrc;
            localStorage.setItem('selectedAvatar', newAvatarSrc);
            selectableAvatars.forEach(av => av.classList.remove('selected'));
            avatar.classList.add('selected');
        });
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