import auth from './auth.js';
import checkApptsAndRender from './calendar.js';
import fetchAndRenderClients from './clients.js';

let loggedIn = auth.loggedIn();

function checkLoggedIn() {
    if (!loggedIn && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
    }
}

checkLoggedIn();

let mobile = window.innerWidth < 768 ? true : false;

let injectedCssLinks = [];
let injectedScripts = [];

function checkNav() {
    $('#option1').prop('checked', false);
    $('#option2').prop('checked', false);

    if (window.location.pathname === '/admin/calendar') {
        $('#option1').prop('checked', true);
    }
    else if (window.location.pathname === '/admin/clients') {
        $('#option2').prop('checked', true);
    }
}

function removeInjectedAssets() {
    injectedCssLinks.forEach(function (link) {
        link.remove();
    });
    injectedCssLinks = [];
    injectedScripts.forEach(function (script) {
        script.remove();
    });
    injectedScripts = [];
}

function loadContentWithAssets(url, cssUrl, jsUrls, callback) {
    $('#content').load(url + ' #content > *', function () {
        removeInjectedAssets();

        if (cssUrl) {
            var link = $('<link>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: cssUrl
            });
            $('head').append(link);
            injectedCssLinks.push(link);
        }

        if (jsUrls && jsUrls.length) {
            jsUrls.forEach(function (jsUrl) {
                var script = $('<script>', { type: 'module', src: jsUrl });
                $('body').append(script);
                injectedScripts.push(script);
            });
        }

        if (callback) {
            callback();
        }

        history.pushState(null, '', url);
        checkNav();
    });
}

function handleNavChange(url) {
    const cssUrl = `../css/admin/${url}.css`;
    let jsUrls = [`../js/admin/${url}.js`, '../js/admin/calendarModal.js'];

    if (url === 'calendar') {
        jsUrls.push('../js/admin/newApptsModal.js');
        jsUrls.push('../js/admin/servicesModal.js');
    }

    let callback = url === 'calendar' ? checkApptsAndRender : fetchAndRenderClients;

    loadContentWithAssets(url, cssUrl, jsUrls, callback);
}

const mobileNavEl = `
    <div class="dropdown-center">
        <span data-bs-toggle="dropdown" aria-expanded="false">&#9776;</span>
        <ul class="dropdown-menu dropdown-menu-end m-0 p-0">
            <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="calendar">calendar</li>
            <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="clients">clients</li>
            <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4'>logout</li>
        </ul>
    </div>
    `

const navEl = `
    <a href='/calendar'>
      <input type="radio" class="" name="navOptions" id="option1" data-page="calendar" />
      <label for="option1">calendar</label>
    </a>
    <a href='/clients'>
      <input type="radio" class="" name="navOptions" id="option2" data-page="clients" />
      <label for="option2">clients</label>
    </a>
    <button id='logout-btn'>logout</button>
    `

function renderNav() {
    $('#admin-nav').empty();
    const nav = mobile ? mobileNavEl : navEl;

    $('#admin-nav').append(nav);

    if (mobile) { $('.nav-btn').off('click').on('click', (e) => handleNavChange(e.target.dataset.page)) }
    else { $('input[name="navOptions"]').off('click').on('click', (e) => handleNavChange(e.target.dataset.page)) }
}


$('#logout-btn').click(() => {
    auth.logout();
});

window.addEventListener('popstate', function () {
    handleNavChange(window.location.pathname.substring(7));
});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderNav();
    }
});

renderNav();
handleNavChange(window.location.pathname.substring(7));

export default loggedIn;