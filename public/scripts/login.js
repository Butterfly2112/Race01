document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    if (!loginForm) {
        console.error('Login form not found!');
        if (messageDiv) {
            messageDiv.textContent = 'Critical Error: Login form is missing from the page.';
            messageDiv.className = 'error';
        }
        return;
    }
    if (!messageDiv) {
        console.warn('Message div for login not found. Status messages will not be displayed.');
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (messageDiv) {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }

        const formData = new FormData(loginForm);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                body: formData,
            });

            console.log('Login Fetch status:', response.status, 'ok:', response.ok, 'redirected:', response.redirected, 'final URL:', response.url);

            if (!response.ok && response.url.includes('/api/login')) {
                let errorMessage = `Login failed (status ${response.status}).`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    console.warn("Could not parse login error response as JSON. Status:", response.status, e);
                }
                if (messageDiv) {
                    messageDiv.textContent = `Error: ${errorMessage}`;
                    messageDiv.className = 'error';
                }
                console.error('Login failed:', errorMessage, 'Status:', response.status);
                return;
            }

            if (response.url && !response.url.includes('/api/login')) {
                console.log('Login successful, redirecting to:', response.url);
                window.location.href = response.url;
            } else if (response.ok) {
                console.log('Login successful (200 OK from API), redirecting to /main_page');
                window.location.href = '/main_page';
            } else {
                console.warn('Login: Unhandled response scenario.', response);
                if (messageDiv) {
                    messageDiv.textContent = 'An unexpected issue occurred during login.';
                    messageDiv.className = 'error';
                }
            }

        } catch (networkError) {
            console.error('Network error during login:', networkError);
            if (messageDiv) {
                messageDiv.textContent = 'A network error occurred. Please try again.';
                messageDiv.className = 'error';
            }
        }
    });
});