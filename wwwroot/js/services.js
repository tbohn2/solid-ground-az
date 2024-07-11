import { privateServices } from './index.js';

let mobile = window.innerWidth < 768 ? true : false;

$('#option1').attr('checked', true);

function renderServices() {
    const servicesContainer = $('#services');
    servicesContainer.empty();

    const serviceCards = privateServices.map(service => {
        let card;
        const imgURL = '.' + service.ImgURL.slice(5);
        card = `
                <div class="serviceCard league my-3 d-flex fade-top">
                    <img class="col-2" src="${imgURL}" alt="yoga">
                    <div class="col-10 position-relative d-flex flex-column align-items-center justify-content-between">
                        <h3 class="mt-3 align-self-center text-center">${service.Name}</h3>
                        <p class="m-0 text-center">$${service.Price} | ${service.Duration} min</p>
                        <p id=${service.Id + 'desc'} class="serviceDescription ms-4 mb-0 fs-5 align-self-start">${service.Description}</p>
                        <p id=${service.Id + 'descDisplay'} class="displayDescription ms-4 fs-5 align-self-start">${service.Description}</p>
                        <p id=${service.Id + 'book'} class="serviceCard-button align-self-end mx-5 my-3 fs-5">Book</p>                        
                    </div>
                </div>`;
        return card;
    }).join(''); // Join all cards into a single string

    servicesContainer.append(serviceCards); // Append all cards at once

    // Add event listeners to all buttons
    $('.serviceCard-button').on('click', function () {
        const serviceId = $(this).attr('id').slice(0, -4);
        localStorage.setItem('bookServiceId', serviceId);
        window.location.assign('./calendar');
    });

    $('.serviceDescription').on("mouseenter",
        function (event) {
            let id = event.target.id;
            $('#' + id + 'Display').addClass('show');
            $('#overlay').addClass('show');
            event.stopPropagation();
        },
    )
    $('#overlay').on("mouseenter",
        function (event) {
            $('.displayDescription.show').removeClass('show');
            $('.displayRollModel.show').removeClass('show');
            $('#overlay').removeClass('show');
            event.stopPropagation();
        }
    );

    $('.serviceDescription').on('click', function (event) {
        $(this).addClass('text-decoration-underline');
        let id = event.target.id;
        $('#' + id + 'Display').addClass('show');
        $('#overlay').addClass('show');
        event.stopPropagation();
    });

    $('.displayDescription').on('click', function (event) {
        let id = event.target.id;
        $('#' + id).removeClass('show');
        $('#overlay').removeClass('show');
        $('.serviceDescription.text-decoration-underline').removeClass('text-decoration-underline');
        event.stopPropagation();
    }
    );
};

$('#overlay').on('click', function () {
    $('.displayDescription.show').removeClass('show');
    $('.displayRollModel.show').removeClass('show');
    $('#overlay').removeClass('show');
    $('.serviceDescription.text-decoration-underline').removeClass('text-decoration-underline');
});

renderServices();

$('#roll-read-more').on('click', function () {
    $('#overlay').toggleClass('show');
    $('.displayRollModel').toggleClass('show');
});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderServices();
    }
});