import { privateServices } from './index.js';

let mobile = window.innerWidth < 768 ? true : false;

$('#option1').attr('checked', true);
function renderServices() {
    const servicesContainer = $('#services');
    servicesContainer.empty();

    const serviceCards = privateServices.map(service => {
        let card;
        const imgURL = '.' + service.ImgURL.slice(5);
        if (mobile) {
            card = `
                <div class="serviceCard my-3 col-10 d-flex flex-column fade-top">
                    <img class="col-12" src="${imgURL}" alt="yoga">
                    <h3 class="mt-3 align-self-center text-center">${service.Name}</h3>
                    <p class="m-2 fs-5 align-self-center">${service.Description}</p>
                    <div class="d-flex align-items-center justify-content-between col-12">
                        <p class="col-8 m-0 text-center">$${service.Price} | ${service.Duration} min</p>
                        <button class="serviceCard-button col-4">View Calendar</button>
                    </div>
                </div>`;
        } else {
            card = `
                <div class="serviceCard my-3 col-10 col-lg-5 d-flex fade-top">
                    <img class="col-5" src="${imgURL}" alt="yoga">
                    <div class="col-7 d-flex flex-column align-items-center justify-content-between">
                        <h3 class="mt-3 align-self-center text-center">${service.Name}</h3>
                        <p class="col-6 m-0 text-center">$${service.Price} | ${service.Duration} min</p>
                        <p class="serviceDescription mx-2 fs-5 align-self-center">${service.Description}</p>
                        <button class="serviceCard-button col-12">View Calendar</button>                        
                    </div>
                </div>`;
        }
        return card;
    }).join(''); // Join all cards into a single string

    servicesContainer.append(serviceCards); // Append all cards at once

    // Add event listeners to all buttons
    $('.serviceCard-button').on('click', function () {
        console.log('View Calendar button clicked');
        window.location.assign('./calendar');
    });

    $('.serviceDescription').on('click', function (event) {
        $('#descriptionDisplay').remove();
        const descDisplay = `<div id="descriptionDisplay">${this.innerText}</div>`
        $(this).append(descDisplay);
        event.stopPropagation();
    });

    $(document).on('click', function () {
        $('#descriptionDisplay').remove();
    });
};

$('.view-calendar').on('click', function () {
    console.log('View Calendar button clicked');
    window.location.assign('./calendar');
});

renderServices();

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderServices();
    }
});