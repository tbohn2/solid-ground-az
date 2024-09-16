import auth from './auth.js';
import checkApptsAndRender from './calendar.js';
import fetchAndRenderClients from './clients.js';
import attachSubmitListener from './login.js';

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
    else if (window.location.pathname === '/admin/login') {
        $('#option3').prop('checked', true);
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
    const loggedIn = auth.loggedIn();

    if (!loggedIn && url !== 'login') {
        $('#content').append('<div class="col-6 mt-5 position-absolute top-0 start-50 translate-middle alert alert-info">Please log in to view admin pages</div>');
        checkNav();
        if (window.location.pathname !== '/admin/login') {
            window.location.assign('/admin/login');
        }
        return;
    }

    $('#content').remove('.alert');

    let cssUrl = null;
    let jsUrls = null;

    if (url !== 'login') {
        cssUrl = `../css/admin/${url}.css`;
    }
    jsUrls = [`../js/admin/${url}.js`, '../js/admin/calendarModal.js'];

    if (url === 'calendar') {
        jsUrls.push('../js/admin/newApptsModal.js');
        jsUrls.push('../js/admin/servicesModal.js');
    }

    let callback
    if (url === 'login') {
        callback = attachSubmitListener;
    } else if (url === 'calendar') {
        callback = checkApptsAndRender;
    } else if (url === 'clients') {
        callback = fetchAndRenderClients;
    }

    loadContentWithAssets(url, cssUrl, jsUrls, callback);
}

const mobileNavEl = `
    <div class="dropdown-end">
        <span data-bs-toggle="dropdown" aria-expanded="false">&#9776;</span>
        <ul class="dropdown-menu m-0 p-0">
            <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="calendar">calendar</li>
            <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="clients">clients</li>
            ${auth.loggedIn() ?
        `<li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4'>logout</li>`
        :
        `<li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="login">login</li>`
    }
        </ul>
    </div>
    `

const navEl = `
    <a href='/calendar'>
      <input type="radio" name="navOptions" id="option1" data-page="calendar" />
      <label for="option1">calendar</label>
    </a>
    <a href='/clients'>
      <input type="radio" name="navOptions" id="option2" data-page="clients" />
      <label for="option2">clients</label>
    </a>
    ${auth.loggedIn() ?
        `<button id='logout-btn'>logout</button>`
        :
        `<a href='/clients'>
            <input type="radio" name="navOptions" id="option3" data-page="login" />
            <label for="option3">login</label>
        </a>`
    }   
    `

function renderNav() {
    $('#admin-nav').empty();
    const nav = mobile ? mobileNavEl : navEl;

    $('#admin-nav').append(nav);

    if (mobile) {
        $('.nav-btn').off('click').on('click', (e) => handleNavChange(e.target.dataset.page))
    }
    else {
        $('input[name="navOptions"]').off('click').on('click', (e) => handleNavChange(e.target.dataset.page));
        checkNav();
    }
    $('#logout-btn').off('click').on('click', () => { auth.logout(); });
}



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