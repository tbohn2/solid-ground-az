let mobile = window.innerWidth < 768 ? true : false;

function renderNav() {
    $('.navbar').empty();
    const nav = mobile ? `
        <div class="dropdown-center">
            <span class="navbar-toggler-icon fs-5" data-bs-toggle="dropdown" aria-expanded="false"></span>
            <ul class="dropdown-menu dropdown-menu-end m-0 p-0">
            <li class='text-center bg-white'><a class="text-purple text-decoration-none fs-4" href="/">Home</a>
            </li>
            <li class='text-center bg-white'><a class="text-purple text-decoration-none fs-4"
            href="/calendar">Calendar</a></li>
            <li class='text-center bg-white'><a class="text-purple text-decoration-none fs-4"
            href="/contact">Contact</a></li>
            </ul>
        </div>
    ` : `
        <input type="radio" name="navOptions" id="option1" value="/" autocomplete="off">
        <label for="option1" class="text-purple fs-4">HOME</label>
        <input type="radio" name="navOptions" id="option2" value="calendar" autocomplete="off">
        <label for="option2" class="text-purple fs-4">CALENDAR</label>
        <input type="radio" name="navOptions" id="option3" value="contact" autocomplete="off">
        <label for="option3" class="text-purple fs-4">CONTACT</label>
    `
    $('.navbar').append(nav);

    $(document).ready(function () {
        $('input[name="navOptions"]').change(
            function () {
                var pageToLoad = $(this).val();
                window.location.assign(pageToLoad);
            });
        if (window.location.pathname === '/contact') {
            $('#option3').attr('checked', true);
        }
        else if (window.location.pathname === '/calendar') {
            $('#option2').attr('checked', true);
        }
        else {
            $('#option1').attr('checked', true);
        }
    });
}

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderNav();
    }
});

renderNav();

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