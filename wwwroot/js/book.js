const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const currentDate = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
let displayedYear = currentYear;
let displayedMonth = currentMonth;
let dateDisplay = '';
let apptsByDate = {};
let apptsToDisplay = [];
let currentApptId = 0;
let mobile = window.innerWidth < 768 ? true : false;

$('#option2').attr('checked', true);

async function getAppointments() {
    apptsByDate = {};
    $('#month-year').after(`<div class="spinner-border" role="status"></div>`)
    try {
        // const response = await fetch(`https://tbohn2-001-site1.ctempurl.com/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
        const response = await fetch(`http://localhost:5062/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
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
            $('.spinner-border').remove();
            $('#month-year').after(`
            <div class="alert alert-danger text-center m-2 p-2" role="alert">
                Server request failed. Please try again later.
            </div>
            `);
            return false;
        }
    } catch (error) {
        console.error(error);
        $('.spinner-border').remove();
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
    const name = $('#nameInput').val();
    const email = $('#emailInput').val();
    const phone = $('#phoneInput').val();
    selectedService = selectedService.split(' ');
    const price = parseInt(selectedService[0].slice(1))
    const duration = parseInt(selectedService[selectedService.length - 2] + ' ' + selectedService[selectedService.length - 1]);
    let type = '';
    for (let i = 0; i < selectedService.length; i++) {
        if (!selectedService[i].includes('min') && !selectedService[i].match(/[0 - 9]/)) {
            type += ' ' + selectedService[i];
        }
    }

    const apptToRequest = {
        Id: selectedAppt.Id,
        Name: name,
        Email: email,
        Phone: phone,
        Type: type,
        Price: price,
        Duration: duration,
    }

    $('#modal-body').empty()
    $('#modal-body').append(`<div class="spinner-border" role="status"></div>`)

    try {
        // const response = await fetch('https://tbohn2-001-site1.ctempurl.com/api/requestAppt', {
        const response = await fetch('http://localhost:5062/api/requestAppt', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apptToRequest)
        })
        if (response.ok) {
            $('#serviceSelectionLabel').text('Appointment Requested');
            $('#modal-body').empty();
            $('#modal-body').append(`<div class="fs-3 m-1 text-center">Thank you for your request! Expect a response within 24 hours</div>`);
            renderCalendar();
        }
    } catch (error) {
        console.error('Error:', error);
        $('#serviceSelectionLabel').text('Appointment Request Failed');
        $('#modal-body').empty();
        $('#modal-body').append(`<div class="fs-3 m-1 text-center">An error occured. Please try again later.</div>`);
    }
};

async function displayApptDetails(event) {
    $('#modal-body').empty();
    const apptId = currentApptId;

    // selectedAppt.Status will either be 0 (available) or 4 (fixed)
    const selectedAppt = availableApptsInDay.find(appt => appt.Id == parseInt(apptId));
    const time = new Date(selectedAppt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    $('#serviceSelectionLabel').text(`${selectedAppt.apptType ? selectedAppt.apptType.Name : 'Available To Book'}`);

    // Layout needs additional information for fixed appointments
    if (selectedAppt.Status === 4) {
        $('#modal-body').append(`<div class="col-12 px-1 fs-4 text-center text-darkgray">${time} | ${dateDisplay}</div>`);
        return;
    } else {
        $('#modal-body').append(`<div class="col-12 px-1 fs-4 text-center text-darkgray">${dateDisplay} | ${time}</div>`);

        let selectedService
        // Need to populate with available services from server
        const dropdown = $(` 
    <div class="dropdown-center col-12 text-center my-2">
        <button class="px-1 col-10 btn dropdown-toggle fs-4" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            Select Session
        </button>
        <ul class="dropdown-menu m-0 p-0">
            <li class="dropdown-item fs-4">$50 Private Yoga 60 min</li>
            <li class="dropdown-item fs-4">$20 Assisted Stretch 25 min</li>
            <li class="dropdown-item fs-4">$20 Assisted Stretch 50 min</li>
            <li class="dropdown-item fs-4">$50 Blended Service 60 min</li>
        </ul>
    </div>`);
        $('#modal-body').append(dropdown);
        $('.dropdown-item').on('click', (event) => {
            selectedService = event.target.innerText;
            $('.dropdown-toggle').text(selectedService);
        });

        $('#modal-footer').prepend(`<button id="book-next" class="btn request-btn m-1">Next</button>`);

        $('#book-next').on('click', () => {
            $('#book-next').remove();
            $('#modal-footer').prepend(`<button type="submit" id="send-request" class="btn request-btn m-1">Request Appointment</button>`);
            $('.dropdown-center').remove();
            $('#modal-body').append(`<div class="col-12 px-1 fs-4 text-center text-darkgray">${selectedService}</div>`);

            const form = $(
                `<form class="d-flex col-12 px-1 fs-5 text-darkgray flex-column justify-content-between">
                    <label for="nameInput" class="form-label">Name</label>
                    <input type="text" class="form-control mb-1" id="nameInput" required>
                    <label for="emailInput" class="form-label">Email address</label>
                    <input type="email" class="form-control mb-1" id="emailInput" required>
                    <label for="phoneInput" class="form-label">Phone Number (10 digits)</label>
                    <input type="text" class="form-control mb-1" id="phoneInput"
                        pattern="[0-9]{10}|[0-9]{3}-[0-9]{3}-[0-9]{4}" required>
                </form>`
            )
            $('#modal-body').append(form);
            form.on('submit', submitForm);
        });
    }
};

async function displayModal(event) {
    const date = event.target.dataset.date;
    availableApptsInDay = apptsByDate[date];
    dateDisplay = new Date(displayedYear, displayedMonth - 1, date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    $('#serviceSelectionLabel').text(dateDisplay);

    availableApptsInDay.forEach(appt => {
        const apptTime = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const timeDisplay = $(
            `<div id=${appt.Id} class="col-12 p-1 time-option">
                <h3 class="m-0">${appt.apptType ? appt.apptType.Name : 'Available To Book Private Session'}</h3>
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
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);

    displayedDates.forEach(week => {
        let weekDisplay = $('<div class="d-flex fade-in"></div>');
        week.forEach(date => {
            let dateDisplay = $(`<div data-date=${date} class="px-1 d-flex flex-column align-items-center date"></div>`);
            let pastDate = false;
            if (date === 0) {
                dateDisplay.text('');
            }
            else {
                dateDisplay.append(`<div id=${date} data-date=${date} class='date-display'>${date}</div>`)
                const availableApptsInDay = apptsByDate[date] || [];
                if (date < currentDate && displayedMonth === currentMonth && displayedYear === currentYear || displayedMonth < currentMonth && displayedYear === currentYear || displayedYear < currentYear) {
                    dateDisplay.addClass('pastDate');
                    pastDate = true;
                }
                if (availableApptsInDay.length != 0 && !pastDate) {
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
                            const apptName = appt.apptType ? appt.apptType.Name : 'Available';
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
            displayApptDetails(event);
        });
    }
}

async function checkApptsAndRender() {
    const appointmentsExist = await getAppointments();
    if (appointmentsExist === false) { return; }
    if (JSON.stringify(apptsByDate) === "{}") {
        $('#month-year').after(`
            <div class="alert alert-info text-center m-2 p-2" role="alert">
            No appointments available this month.
            </div>
            `);
    }
    $('.spinner-border').remove();
    renderCalendar();
}

$('#serviceSelection').on('hidden.bs.modal', () => {
    $('#book-next').remove();
    $('#send-request').remove();
    $('#serviceSelectionLabel').empty();
    $('#modal-body').empty();
});

$('#prev').on('click', () => {
    displayedMonth -= 1;
    if (displayedMonth === 0) {
        displayedMonth = 12;
        displayedYear -= 1;
    }
    $('.alert').remove();
    $('.spinner-border').remove();
    displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);
    checkApptsAndRender();
});

$('#next').on('click', () => {
    displayedMonth += 1;
    if (displayedMonth === 13) {
        displayedMonth = 1;
        displayedYear += 1;
    }
    $('.alert').remove();
    $('.spinner-border').remove();
    displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);
    checkApptsAndRender();
});

checkApptsAndRender();

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderCalendar();
    }
});