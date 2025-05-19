document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registration-form');
    const messageDiv = document.getElementById('message');

    if (!registrationForm || !messageDiv) {
        console.error("Required DOM elements (form or messageDiv) not found for registration.");
        if (messageDiv) {
            messageDiv.textContent = 'Page setup error. Please contact support.';
            messageDiv.className = 'error';
        }
        return;
    }

    registrationForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = '';

        const password = registrationForm.password.value;
        const confirmPass = registrationForm.confirm_pass.value;

        if (password !== confirmPass) {
            messageDiv.textContent = 'Error: Passwords do not match.';
            messageDiv.className = 'error';
            return;
        }

        const formData = new FormData(registrationForm);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                messageDiv.textContent = `Error: ${errorData.error || 'An unknown error occurred.'}`;
                messageDiv.className = 'error';
                return;
            }

            window.location.href = '/main_page';

        } catch (networkError) {
            console.error('Network error during registration:', networkError);
            messageDiv.textContent = 'A network error occurred. Please try again.';
            messageDiv.className = 'error';
        }
    });
});