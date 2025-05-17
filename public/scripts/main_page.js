document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                });

                if (response.ok) {
                    window.location.href = '/login';
                } else {
                    let errorMessage = `Logout failed (status ${response.status}).`;
                    try {
                        const errorData = await response.json();
                        if (errorData && errorData.error) {
                            errorMessage = errorData.error;
                        }
                    } catch (e) {
                        console.warn("Could not parse logout error response as JSON. Status:", response.status, e);
                    }
                    alert(`Logout failed: ${errorMessage}`);
                    console.error('Logout failed:', errorMessage, 'Status:', response.status);
                }
            } catch (networkError) {
                console.error('Network error during logout:', networkError);
                alert('A network error occurred during logout. Please try again.');
            }
        });
    } else {
        console.warn('Logout button not found on the main page.');
    }
});