import { privateServices } from './index.js';

let mobile = window.innerWidth < 768 ? true : false;

$('#option1').attr('checked', true);
function renderServices() {
    const servicesContainer = $('#services');
    servicesContainer.empty();

    const serviceCards = privateServices.map(service => {
        let card;
        if (mobile) {
            card = `
                <div class="serviceCard my-3 col-10 d-flex flex-column fade-top">
                    <img class="col-12" src="${service.ImgURL}" alt="yoga">
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
                    <img class="col-5" src="${service.ImgURL}" alt="yoga">
                    <div class="col-7 d-flex flex-column align-items-start justify-content-between">
                        <h3 class="mt-3 align-self-center text-center">${service.Name}</h3>
                        <p class="m-2 fs-5 align-self-center">${service.Description}</p>
                        <div class="d-flex align-items-center justify-content-between col-12">
                            <p class="col-6 m-0 text-center">$${service.Price} | ${service.Duration} min</p>
                            <button class="serviceCard-button col-6">View Calendar</button>
                        </div>
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
};

renderServices();

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderServices();
    }
});