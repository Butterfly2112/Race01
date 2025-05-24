const form = document.querySelector('form');
const p = document.querySelector('p');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const response = await fetch('/api/guest-login', {
            method: 'POST',
            body: new FormData(form)
        });

        const login = await response.json();

        if (!login.success) {
            p.textContent = 'This account already exists';
            p.style.visibility = 'visible';
        }
        else {
            window.location.href = '/main_page';
        }
    }
    catch (e) {
        console.error(e);
    }
});