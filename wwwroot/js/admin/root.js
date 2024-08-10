import auth from './auth.js';

let loggedIn = auth.loggedIn();

if (!loggedIn) {
    console.log('Not logged in');
    // window.location.assign('/login');
}

let mobile = window.innerWidth < 768 ? true : false;

$('input[name="navOptions"]').change(
    function () {
        var pageToLoad = $(this).val();
        window.location.assign(pageToLoad);
    });
if (window.location.pathname === '/calendar') {
    $('#option1').attr('checked', true);
}
else if (window.location.pathname === '/clients') {
    $('#option2').attr('checked', true);
}

$('#logout-btn').click(() => {
    // auth.logout();
    console.log('Logged out');

});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
    }
});

export default loggedIn;