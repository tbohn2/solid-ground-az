import checkApptsAndRender from "./calendar.js";

let mobile = window.innerWidth < 768 ? true : false;

let injectedCssLinks = [];
let injectedScripts = [];

function checkNav() {
    if (window.location.pathname === '/calendar') {
        $('#option1').attr('checked', true);
    }
    else if (window.location.pathname === '/about') {
        $('#option2').attr('checked', true);
    }
    else if (window.location.pathname === '/contact') {
        $('#option3').attr('checked', true);
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
    });
}

function renderNav() {
    $('.navbar').empty();
    const nav = mobile ? `
        <div class="dropdown-center">
            <span class="fs-2 text-purple" data-bs-toggle="dropdown" aria-expanded="false">&#9776;</span>
            <ul class="dropdown-menu dropdown-menu-end m-0 p-0">
                <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="about">About</li>
                <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="calendar">Calendar</li>
                <li class='nav-btn text-center bg-white text-purple text-decoration-none fs-4' data-page="contact">Contact</li>
            </ul>
        </div>
    ` : `
        <input type="radio" name="navOptions" id="option1" data-page="calendar" autocomplete="off">
        <label for="option1" class="text-purple fs-4">CALENDAR</label>
        <input type="radio" name="navOptions" id="option2" data-page="about" autocomplete="off">
        <label for="option2" class="text-purple fs-4">ABOUT</label>
        <input type="radio" name="navOptions" id="option3" data-page="contact" autocomplete="off">
        <label for="option3" class="text-purple fs-4">CONTACT</label>
    `
    $('.navbar').append(nav);

    function handleNavClick() {
        const url = $(this).data('page');
        let cssUrl = ''
        let jsUrls = []
        let callback = null;

        if (url !== 'contact') { cssUrl = `css/client/${url}.css` }
        if (url !== 'about') { jsUrls = [`js/client/${url}.js`]; }
        if (url === 'calendar') { callback = checkApptsAndRender; }

        loadContentWithAssets(url, cssUrl, jsUrls, callback);
        checkNav();
    }

    // Remove event listeners before adding new ones
    $('#logo').click(() => loadContentWithAssets('', '', [], null));
    if (mobile) { $('.nav-btn').click(handleNavClick) }
    else { $('input[name="navOptions"]').change(handleNavClick) }
}



window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderNav();
    }
});

renderNav();
checkNav();

async function getServices() {
    try {
        // const response = await fetch(`https://tbohn2-001-site1.ctempurl.com/api/services`);
        const response = await fetch(`http://localhost:5062/api/services`);
        if (response.ok) {
            const services = await response.json();
            return services;
        } else {
            // Need to display an error message to the user
            console.error('Server request failed');
            return [];
        }
    } catch (error) {
        // Need to display an error message to the user
        console.error(error);
        return [];
    }
};

const privateServices = await getServices();
export { privateServices };