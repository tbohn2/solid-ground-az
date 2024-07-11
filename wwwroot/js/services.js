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
                <div class="serviceCard my-3 d-flex fade-top">
                    <img class="col-4" src="${imgURL}" alt="yoga">
                    <div class="position-relative d-flex flex-column align-items-center justify-content-between">
                        <h3 class="mt-3 align-self-center text-center">${service.Name}</h3>
                        <p class="m-0 text-center">$${service.Price} | ${service.Duration} min</p>
                        <p class="serviceDescription ms-4 mb-0 fs-5 align-self-start">${service.Description}</p>
                        <p id=${service.Id + 'desc'} class="service-read-more my-0 ms-4 fs-5 align-self-start">Read More</p>
                        <p id=${service.Id + 'descDisplay'} class="displayDescription ms-4 fs-5 align-self-start">${service.Description}</p>
                        <button class="serviceCard-button">View Calendar</button>                        
                    </div>
                </div>`;
        return card;
    }).join(''); // Join all cards into a single string

    servicesContainer.append(serviceCards); // Append all cards at once

    // Add event listeners to all buttons
    $('.serviceCard-button').on('click', function () {
        console.log('View Calendar button clicked');
        window.location.assign('./calendar');
    });

    $('.service-read-more').on('click', function (event) {
        let id = event.target.id;
        $('#' + id + 'Display').toggleClass('show');
        $('#overlay').toggleClass('show');
        event.stopPropagation();
    });

    $('.displayDescription').on('click', function (event) {
        let id = event.target.id;
        $('#' + id).toggleClass('show');
        $('#overlay').toggleClass('show');
        event.stopPropagation();
    }
    );
};

$('#overlay').on('click', function () {
    $('.displayDescription.show').removeClass('show');
    $('.displayRollModel.show').removeClass('show');
    $('#overlay').removeClass('show');
});

$('.view-calendar').on('click', function () {
    console.log('View Calendar button clicked');
    window.location.assign('./calendar');
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