import auth from './auth.js';

let loggedIn = auth.loggedIn();

function checkLoggedIn() {
    if (!loggedIn && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
    }
}

checkLoggedIn();

let mobile = window.innerWidth < 768 ? true : false;

$('input[name="navOptions"]').change(
    function () {
        var pageToLoad = $(this).val();
        window.location.assign('/admin/' + pageToLoad);
    });

$('#logout-btn').click(() => {
    auth.logout();
});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
    }
});

export default loggedIn;