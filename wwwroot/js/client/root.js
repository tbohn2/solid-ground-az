import checkApptsAndRender from "./calendar.js";
import addEventListeners from "./index.js";

let mobile = window.innerWidth < 768 ? true : false;

let injectedCssLinks = [];
let injectedScripts = [];
let loadedPages = {
    home: false,
    calendar: false,
    about: false,
    contact: true
}

function setLoading(loading, url) {
    const page = url === '/' ? 'home' : url

    if (!loadedPages[page]) {
        if (loading) {
            $('header').after(`<div class='col-12 loading text-center'><img class='spinning' src="./assets/flower.svg" alt="flower-logo"></div>`);
        } else {
            setTimeout(() => {
                $('.loading').remove();
                loadedPages[page] = true;
            }, 1000);
        }
    }
}

function checkNav() {
    $('#option1').prop('checked', false);
    $('#option2').prop('checked', false);
    $('#option3').prop('checked', false);
    if (window.location.pathname === '/calendar') {
        $('#option1').prop('checked', true);
    }
    else if (window.location.pathname === '/about') {
        $('#option2').prop('checked', true);
    }
    else if (window.location.pathname === '/contact') {
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
    setLoading(true, url);

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

        var firstImg = $('img:first');

        if (!firstImg) {
            setLoading(false, url);
        } else {
            $(firstImg).on('load', function () {
                setLoading(false, url);
                $('#content').addClass('loaded');
            })

            $('img').on('load', function () {
                $(this).addClass('loaded');
            }).each(function () {
                if (this.complete) {
                    $(this).trigger('load');
                }
            });
        }

        checkNav();
    });
}

function handleNavChange(url) {
    $('#content').removeClass('loaded');

    let fileName = url;
    let cssUrl = '';
    let jsUrls = [];
    let callback = null;

    if (url === '') { url = '/'; fileName = 'index'; callback = addEventListeners; }
    if (url !== 'contact') { cssUrl = `css/client/${fileName}.css` }
    if (url !== 'about') { jsUrls = [`js/client/${fileName}.js`]; }
    if (url === 'calendar') { callback = checkApptsAndRender; }

    loadContentWithAssets(url, cssUrl, jsUrls, callback);
}

function renderNav() {
    $('.navbar').empty();
    const nav = mobile ? `
        <div id="mobile-nav" class="dropdown-center">
            <span class="text-purple" data-bs-toggle="dropdown" aria-expanded="false">&#9776;</span>
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

    $('#logo').off('click').on('click', () => handleNavChange(''));
    if (mobile) { $('.nav-btn').off('click').on('click', (e) => handleNavChange(e.target.dataset.page)) }
    else { $('input[name="navOptions"]').off('change').on('change', (e) => handleNavChange(e.target.dataset.page)) }
}

window.addEventListener('popstate', function () {
    handleNavChange(window.location.pathname.substring(1));
});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderNav();
    }
});

renderNav();
handleNavChange(window.location.pathname.substring(1));

async function getServices() {
    function setServiceError() {
        $('body').append('<div id="failed-services" class="alert alert-danger" role="alert">Failed to retrieve services, try again later</div>')
        setTimeout(() => {
            $('#failed-services').remove();
        }, 5000);
    }

    try {
        const response = await fetch(`https://solidgroundaz.com/api/services`);
        if (response.ok) {
            const services = await response.json();
            return services;
        } else {
            setServiceError();
            console.error('Server request failed');
            return [];
        }
    } catch (error) {
        setServiceError();
        console.error(error);
        return [];
    }
};

export { getServices, handleNavChange };