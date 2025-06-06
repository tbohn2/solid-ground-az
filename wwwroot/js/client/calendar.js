import { getServices } from './root.js';
const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const currentDate = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

let services = [];
let privateServices = [];
let displayedYear = currentYear;
let displayedMonth = currentMonth;
let dateDisplay = '';
let apptsByDate = {};
let availableApptsInDay = [];
let currentApptId = 0;
let selectedServiceId = 0;
let selectedService = 'Select Service';
let mobile = window.innerWidth < 768 ? true : false;

async function getAppointments() {
    apptsByDate = {};
    $('#month-year').after(`<div class='loading text-center'><img class='spinning' src="./assets/flower.svg" alt="flower-logo"></div>`)
    try {
        const response = await fetch(`/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
        if (response.ok) {
            const appointments = await response.json();
            // Add to global object for quick access; allows for one loop through appointments instead of every time a date is clicked
            appointments.forEach(appt => {
                const date = new Date(appt.DateTime).getDate();

                if (!apptsByDate[date]) {
                    apptsByDate[date] = [];
                }
                apptsByDate[date].push(appt);
            });
            return true;
        } else {
            console.error('Server request failed');
            $('.loading').remove();
            $('#month-year').after(`
            <div class="alert alert-danger text-center m-2 p-2" role="alert">
                Server request failed. Please try again later.
            </div>
            `);
            return false;
        }
    } catch (error) {
        console.error(error);
        $('.loading').remove();
        $('#month-year').after(`
        <div class="alert alert-danger text-center m-2 p-2" role="alert">
            Server request failed. Please try again later.
        </div>
    `);
        return false;
    }
}

// Array of arrays of weeks
let displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);

async function submitForm(event) {
    event.preventDefault();
    $('#send-request').remove();
    const Id = parseInt(currentApptId);
    const Name = $('#nameInput').val();
    const Email = $('#emailInput').val();
    const Phone = $('#phoneInput').val();
    const ApptTypeId = parseInt(selectedServiceId);
    const data = { Id, Name, Email, Phone, ApptTypeId }

    $('#modal-body').empty()
    $('#modal-body').append(`<div class='loading text-center'><img class='spinning' src="./assets/flower.svg" alt="flower-logo"></div>`)

    try {
        const response = await fetch('/api/requestAppt', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        if (response.ok) {
            $('#serviceSelectionLabel').text('Appointment Requested');
            $('#modal-body').empty();
            $('#modal-body').append(`<div class="fs-3 m-1 text-center">Thank you for your request! Expect a response within 24 hours</div>`);
            checkApptsAndRender();
        }
    } catch (error) {
        console.error('Error:', error);
        $('#serviceSelectionLabel').text('Appointment Request Failed');
        $('#modal-body').empty();
        $('#modal-body').append(`<div class="fs-3 m-1 text-center">An error occured. Please try again later.</div>`);
    }
};

async function displayApptDetails() {
    $('#modal-body').empty();
    const apptId = currentApptId;

    // selectedAppt.Status will either be 0 (available) or 4 (fixed)
    const selectedAppt = availableApptsInDay.find(appt => appt.Id == parseInt(apptId));
    const startTime = new Date(selectedAppt.DateTime)
    const endTime = new Date(selectedAppt.DateTime)
    endTime.setHours(endTime.getHours() + 1);

    const timeDisplay = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

    $('#serviceSelectionLabel').text(`${selectedAppt.ApptType ? selectedAppt.ApptType.Name : 'Available To Book'}`);

    if (selectedAppt.Status === 4) {

        const detailsArray = [
            { icon: '<i class="bi bi-calendar"></i>', text: dateDisplay },
            { icon: '<i class="bi bi-clock"></i>', text: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) },
            { icon: '<i class="bi bi-geo-alt"></i>', text: selectedAppt.ApptType.LocationName || 'Location Name TBD' },
            { icon: '<i class="bi bi-map"></i>', text: selectedAppt.ApptType.LocationAddress || 'Address TBD' },
        ];

        $('#modal-body').append(`
        ${detailsArray.map(detail =>
            `<div class="col-12 d-flex px-3 fs-4 text-darkgray">
                ${detail.icon}
                <p class="px-1 my-0 text-wrap">${detail.text}</p>            
            </div>`).join('')
            }
             <div class="p-3 fs-4 text-darkgray">${selectedAppt.ApptType.Description}</div>
            `);
        return;
    } else {
        function renderServiceDetails(serviceId) {
            $('#service-details').remove();
            const service = privateServices.find(service => service.Id == serviceId);
            const imgURL = service.ImgURL;
            const serviceDetails = $(`
                <div id="service-details" class="col-12 d-flex flex-column align-items-center fade-in">
                    <img class="col-2 loaded" src="${imgURL}" alt="yoga">
                    <div class="mx-5 fs-4 text-darkgray">${service.Description}</div>
                </div>
                `);
            $('#modal-body').append(serviceDetails);
        }

        $('#modal-body').append(`
            <div class="col-12 d-flex align-items-center ms-5 fs-4 text-darkgray">
                <i class="bi bi-calendar"></i>
                <div class="px-1 text-center">${dateDisplay}</div>            
            </div>
            <div id="service-time" class="col-12 d-flex align-items-center ms-5 fs-4 text-darkgray">
                <i class="bi bi-clock"></i>
                <div class="px-1 text-center">${timeDisplay}</div>            
            </div>
            `);

        const serviceIdToBook = localStorage.getItem('bookServiceId');
        if (serviceIdToBook) {
            renderServiceDetails(serviceIdToBook);
            selectedServiceId = serviceIdToBook;
            selectedService = privateServices.find(service => service.Id == selectedServiceId).Name;
        }

        const dropdown = $(` 
        <div id="service-dropdown" class="dropdown-center col-12 text-center my-2">
            <button class="px-1 col-10 btn dropdown-toggle fs-4" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                ${selectedService}
            </button>
            <ul class="cal-dropdown-menu dropdown-menu m-0 p-0">
                ${privateServices.map(service => `<li key=${service.Id} class="dropdown-item fs-4">${service.Name}</li>`).join('')}
            </ul>
        </div>`);

        $('#service-time').after(dropdown);

        $('.dropdown-item').on('click', (event) => {
            selectedServiceId = event.target.getAttribute('key');
            selectedService = event.target.innerText;
            $('.dropdown-toggle').text(selectedService);
            renderServiceDetails(selectedServiceId);
        });

        $('#modal-footer').prepend(`<button id="book-next" class="btn request-btn m-1">Next</button>`);

        $('#book-next').on('click', () => {
            if (selectedService === 'Select Service') {
                $('.alert').remove();
                $('#service-dropdown').after('<div class="alert alert-info col-10 fs-5 text-center m-2 p-2" role="alert">Please select a service</div>');
                return;
            }

            $('#close-btn').hide();
            $('.alert').remove();
            localStorage.removeItem('bookServiceId');
            $('#book-next').remove();
            $('#service-dropdown').remove();
            $('#service-time').after(`<div class="col-12 px-1 fs-4 text-center text-darkgray">${selectedService}</div>`);

            const form = $(
                `<form id="request-form" class="d-flex col-12 px-1 fs-5 text-darkgray flex-column justify-content-between">
                    <label for="nameInput" class="form-label">Name</label>
                    <input type="text" class="form-control mb-1" id="nameInput" required>
                    <label for="emailInput" class="form-label">Email address</label>
                    <input type="email" class="form-control mb-1" id="emailInput" required>
                    <label for="phoneInput" class="form-label">Phone Number (10 digits)</label>
                    <input type="text" class="form-control mb-1" id="phoneInput"
                        pattern="[0-9]{10}|[0-9]{3}-[0-9]{3}-[0-9]{4}" required>
                    <div class="text-center">
                        By using this service, you agree to our <span class="footer-link" data-bs-toggle="modal" data-bs-target="#footerModal">Terms and Privacy</p>
                    </div>
                    <button type="submit" id="send-request" class="btn request-btn m-1">Request Appointment</button>
                    <button type="button" class="btn btn-secondary mt-2 mx-1" data-bs-dismiss="modal">Cancel</button>
                </form>`
            )
            $('#modal-body').append(form);
            $('#request-form').on('submit', submitForm);
        });
    }
};

async function displayModal(event) {
    const date = event.target.dataset.date;
    availableApptsInDay = apptsByDate[date];
    dateDisplay = new Date(displayedYear, displayedMonth - 1, date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    $('#serviceSelectionLabel').text(dateDisplay);

    availableApptsInDay.forEach((appt, index) => {
        const apptTime = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const timeDisplay = $(
            `<div id=${appt.Id} class="col-12 p-1 time-option ${index === 0 ? 'first-time-option' : ''}">
                <h3 class="m-0">${appt.ApptType ? appt.ApptType.Name : 'Available To Book Private Session'}</h3>
                <p class="m-0">${apptTime}</p>
            </div>`
        );
        $('#modal-body').append(timeDisplay);
    });
    $('.time-option').on('click', (event) => {
        const parent = $(event.target).closest('.time-option');
        currentApptId = parent.attr('id');
        displayApptDetails();
    });
};

async function renderCalendar() {
    $('#calendar-dates').empty();
    mobile ? $('#calendar-header').addClass('flex-column-reverse') : $('#calendar-header').removeClass('flex-column-reverse');
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);

    displayedDates.forEach(week => {
        let weekDisplay = $('<div class="d-flex fade-in"></div>');
        week.forEach(date => {
            let dateDisplay = $(`<div data-date=${date} class="px-1 d-flex flex-column align-items-center date"></div>`);
            if (date === 0) {
                dateDisplay.text('');
            }
            else {
                dateDisplay.append(`<div id=${date} data-date=${date} class='date-display'>${date}</div>`)
                const availableApptsInDay = apptsByDate[date] || [];

                let appointmentsDisplay;

                if (availableApptsInDay.length != 0) {
                    if (mobile === true) {
                        dateDisplay.attr('data-bs-toggle', 'modal');
                        dateDisplay.attr('data-bs-target', '#serviceSelection');
                        dateDisplay.addClass('availableDate');
                        appointmentsDisplay = $('<div class="d-flex"></div>');
                        availableApptsInDay.forEach(appt => {
                            appointmentsDisplay.append(`<div data-date=${date} class='appt-dot'>.</div>`)
                        });
                        dateDisplay.append(appointmentsDisplay);
                    } else {
                        appointmentsDisplay = $(`<div class="col-12 appts-container"></div>`);

                        availableApptsInDay.forEach(appt => {
                            const apptName = appt.ApptType ? appt.ApptType.Name : 'Available';
                            const apptTime = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                            appointmentsDisplay.append(`<div id=${appt.Id} data-date=${date} data-bs-toggle='modal' data-bs-target='#serviceSelection' class='appt-time'>${apptTime} ${apptName}</div>`)
                        });
                        dateDisplay.append(appointmentsDisplay);
                    }
                }
            }
            weekDisplay.append(dateDisplay);
        });
        $('#calendar-dates').append(weekDisplay);
    });
    if (mobile === true) { $('.availableDate').on('click', displayModal) }
    else {
        $('.appt-time').on('click', (event) => {
            currentApptId = event.target.id;
            const date = event.target.dataset.date;
            availableApptsInDay = apptsByDate[date];
            dateDisplay = new Date(displayedYear, displayedMonth - 1, date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            displayApptDetails();
        });
    }
}

async function renderServices() {
    const servicesContainer = $('#services');
    servicesContainer.append('<div class="loading text-center"><img class="spinning" src="./assets/flower.svg" alt="flower-logo"></div>');
    await getServices().then(allServices => {
        services = allServices;
        privateServices = services.filter(service => service.Private === true);
    });

    servicesContainer.empty();

    const serviceCards = services.map(service => {
        const card = `
                <div class="league my-3 col-lg-5 col-11 d-flex flex-column align-items-center justify-content-between fade-top">                    
                    <div class="col-12 position-relative d-flex flex-column align-items-center">
                        <h3 class="mt-3 align-self-center text-center">${service.Name}</h3>
                        <p class="m-0 text-center">${service.Duration} min</p>                        
                        <p id=${service.Id + 'descDisplay'} class="col-10 fs-4">${service.Description}</p>
                    </div>                        
                </div>`;
        return card;
    }).join(''); // Join all cards into a single string

    $('.loading').remove();
    servicesContainer.append(serviceCards); // Append all cards at once   
};

async function checkApptsAndRender() {
    renderServices();

    const appointmentsExist = await getAppointments();
    if (appointmentsExist === false) { return; }
    if (JSON.stringify(apptsByDate) === "{}") {
        $('#month-year').after(`
            <div class="alert alert-info text-center m-2 p-2" role="alert">
            No appointments available this month.
            </div>
            `);
    }
    $('.loading').remove();
    renderCalendar();

    function setDates() {
        $('.alert').remove();
        displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);
        checkApptsAndRender();
    }

    $('#prev').off('click').on('click', () => {
        displayedMonth -= 1;
        if (displayedMonth === 0) {
            displayedMonth = 12;
            displayedYear -= 1;
        }
        setDates();
    });

    $('#next').off('click').on('click', () => {
        displayedMonth += 1;
        if (displayedMonth === 13) {
            displayedMonth = 1;
            displayedYear += 1;
        }
        setDates();
    });

    $('#serviceSelection').off('hidden.bs.modal').on('hidden.bs.modal', () => {
        $('#book-next').remove();
        $('#send-request').remove();
        $('#serviceSelectionLabel').empty();
        $('#modal-body').empty();
        selectedService = 'Select Service'
        $('#close-btn').show();
    });
}

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderCalendar();
    }
});

export default checkApptsAndRender;