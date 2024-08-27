import auth from './auth.js';

let loggedIn = auth.loggedIn();

function checkLoggedIn() {
    if (!loggedIn && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
    }
}

checkLoggedIn();

let mobile = window.innerWidth < 768 ? true : false;

function checkNav() {
    if (window.location.pathname === '/admin/calendar') {
        $('#option1').attr('checked', true);
    }
    else if (window.location.pathname === '/admin/clients') {
        $('#option2').attr('checked', true);
    }
}

$('input[name="navOptions"]').change(
    function () {
        var pageToLoad = $(this).val();
        window.location.assign('/admin/' + pageToLoad);
        checkNav();
    }
);


$('#logout-btn').click(() => {
    auth.logout();
});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
    }
});

checkNav();

export default loggedIn;