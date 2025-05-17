document.addEventListener('DOMContentLoaded', () => {
    const remindForm = document.getElementById('remind-password-form');
    const messageDiv = document.getElementById('message');

    if (!remindForm) {
        console.error('Remind password form not found!');
        if (messageDiv) {
            messageDiv.textContent = 'Error: Form element is missing.';
            messageDiv.className = 'error';
        }
        return;
    }
    if (!messageDiv) {
        console.error('Message div for remind password not found!');
    }

    remindForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (messageDiv) {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }

        const formData = new FormData(remindForm);
        const emailValue = formData.get('email');

        if (!emailValue || emailValue.trim() === '') {
            if (messageDiv) {
                messageDiv.textContent = 'Error: Email address cannot be empty.';
                messageDiv.className = 'error';
            }
            console.error('Password reset aborted: Email field is empty.');
            return;
        }
        console.log('Sending password reminder for email:', emailValue);

        try {
            const response = await fetch('/api/remind', {
                method: 'POST',
                body: formData,
            });

            console.log('Remind password response status:', response.status);
            console.log('Remind password response ok:', response.ok);

            const contentType = response.headers.get("content-type");
            const contentLength = response.headers.get("content-length");

            if (response.ok) {
                let successMessage = 'A new password has been sent to your email';
                if (contentType && contentType.includes("application/json") && contentLength && parseInt(contentLength) > 0) {
                    try {
                        const successData = await response.json();
                        successMessage = successData.message || successMessage;
                    } catch (e) {
                        console.warn('Successfully processed (2xx) but could not parse success response as JSON:', e);
                    }
                } else {
                    console.log('Successfully processed (2xx) but response was not JSON or was empty.');
                }
                if (messageDiv) {
                    messageDiv.textContent = successMessage;
                    messageDiv.className = 'info';
                }
                console.log('Password reset request processed successfully.');

            } else {
                let errorMessage = `Server responded with status ${response.status}.`;
                if (contentType && contentType.includes("application/json") && contentLength && parseInt(contentLength) > 0) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        console.warn(`Error status ${response.status} but could not parse error response as JSON:`, e);
                    }
                } else {
                     console.warn(`Error status ${response.status} but response was not JSON or was empty.`);
                }
                if (messageDiv) {
                    messageDiv.textContent = `Error: ${errorMessage}`;
                    messageDiv.className = 'error';
                }
                console.error('Password reset failed:', response.status, errorMessage);
            }
        } catch (error) {
            if (messageDiv) {
                messageDiv.textContent = 'An error occurred while requesting password reset. Check network connection.';
                messageDiv.className = 'error';
            }
            console.error('Fetch error for password reset:', error);
        }
    });
});