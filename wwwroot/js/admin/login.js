import auth from './auth.js';

function attachSubmitListener() {
    $('#loginForm').submit(async function (e) {
        e.preventDefault();

        $('#loginBtn').remove();
        $('#loginForm').append('<div class="spinner-border" role="status"></div>');
        $('.alert').remove();

        const username = $('#username').val();
        const password = $('#password').val();

        try {
            const response = await fetch(`https://solidgroundaz.com/api/login/`, {
                method: 'POST',
                body: JSON.stringify({ Username: username, Password: password }),
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok && data.token && data.id) {
                auth.login(data)
                window.location.assign('/admin/calendar');
            }
            if (!response.ok) {
                let resError = data;
                $('.spinner-border').remove();
                $('#loginForm').prepend(`<div class="fs-4 alert alert-danger">${resError}</div>`);
                $('#loginForm').append('<button type="submit" id="loginBtn" class="custom-btn col-6">Login</button>');
            }
        } catch (error) {
            $('.spinner-border').remove();
            $('#loginForm').prepend(`<div class="fs-4 alert alert-danger">An error occurred while making request. Please try again later.</div>`);
            console.error(error);
        }
    })
}

export default attachSubmitListener;