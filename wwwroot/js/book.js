const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const currentDate = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
let displayedYear = currentYear;
let displayedMonth = currentMonth;

$('#option2').attr('checked', true);

let mobile = false

function checkScreenWidth() {
    var width = window.innerWidth;
    if (width < 768) {
        mobile = true;
    }
}

async function getAppointments() {
    $('#month-year').after(`<div class="spinner-border" role="status"></div>`)
    try {
        // const response = await fetch(`https://tbohn2-001-site1.ctempurl.com/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
        const response = await fetch(`http://localhost:5062/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
        const data = await response.json();
        const appointments = data;
        return appointments;
    } catch (error) {
        console.error(error);
        $('.spinner-border').remove();
        $('#month-year').after(`
        <div class="alert alert-danger text-center m-2 p-2" role="alert">
            Server request failed. Please try again later.
        </div>
    `);
        return null;
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
    $('#serviceSelectionLabel').text('Select Service');
    $('#modal-body').empty();
    const apptId = event.target.id;
    // Appt.Status will either be 0 (available) or 4 (fixed)
    const selectedAppt = availableApptsInDay.find(appt => appt.Id === apptId);

    $('#modal-body').append(`<div id=dateDisplay class="fs-3 m-1 text-center">${time} | ${dateDisplay}</div>`);


    let selectedService
    const dropdown = $(` 
    <div class="dropdown">
        <button class="btn btn-secondary dropdown-toggle fs-3" type="button" data-bs-toggle="dropdown"
            aria-expanded="false">
            Select Type
        </button>
        <ul class="dropdown-menu m-0 p-0">
            <li class="dropdown-item fs-3">$50 Private Yoga 60 min</li>
            <li class="dropdown-item fs-3">$20 Assisted Stretch 25 min</li>
            <li class="dropdown-item fs-3">$20 Assisted Stretch 50 min</li>
            <li class="dropdown-item fs-3">$50 Blended Service 60 min</li>
        </ul>
    </div>`);
    $('#modal-body').append(dropdown);
    $('.dropdown-item').on('click', (event) => {
        selectedService = event.target.innerText;
        $('.dropdown-toggle').text(selectedService);
    });
    $('#modal-body').append(`<button id=RequestBtn class="monthNavBtn mt-3">Request Appointment</button>`);
    $('#RequestBtn').on('click', () => {
        $('#serviceSelectionLabel').text('Enter Information');
        $('#modal-body').empty();
        $('#modal-body').append(`<div id=dateDisplay class="fs-3 m-1 text-center">${time} | ${dateDisplay}</div>`);
        $('#modal-body').append(`<div id=dateDisplay class="fs-3 m-1 text-center">${selectedService}</div>`);

        const form = $(
            `<form class="d-flex flex-column justify-content-between">
                <label for="nameInput" class="form-label">Name</label>
                <input type="text" class="form-control mb-3" id="nameInput" required>
                <label for="emailInput" class="form-label">Email address</label>
                <input type="email" class="form-control mb-3" id="emailInput" required>
                <label for="phoneInput" class="form-label">Phone Number (10 digits)</label>
                <input type="text" class="form-control mb-3" id="phoneInput"
                    pattern="[0-9]{10}|[0-9]{3}-[0-9]{3}-[0-9]{4}" required>
                <button type="submit" class="monthNavBtn">Confirm Request</button>
           </form>`
        )
        $('#modal-body').append(form);
        form.on('submit', submitForm);
    });
};

async function displayModal(event) {
    const date = event.target.dataset.date;

    let clickedElement = $(event.target).closest('.availableDate');
    const apptsString = clickedElement.attr('data-appts');
    const appointments = JSON.parse(apptsString);

    const dateDisplay = displayedMonth + '/' + date + '/' + displayedYear

    $('#serviceSelectionLabel').text(dateDisplay);

    // Sorting does not need to happen if the appointments are already sorted by date by server
    const availableApptsInDay = appointments.sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));

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
    $('.time-option').on('click', displayApptDetails);
};

async function renderCalendar() {
    $('#calendar-dates').empty();
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);

    const appointments = await getAppointments();
    if (appointments === null) { return; }
    if (appointments.length === 0) {
        $('#month-year').after(`
        <div class="alert alert-info text-center m-2 p-2" role="alert">
            No appointments available this month.
        </div>
    `);
    }
    $('.spinner-border').remove();

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
                const availableApptsInDay = appointments.filter(appt => new Date(appt.DateTime).getDate() === date)
                if (date < currentDate && displayedMonth === currentMonth && displayedYear === currentYear || displayedMonth < currentMonth && displayedYear === currentYear || displayedYear < currentYear) {
                    dateDisplay.addClass('pastDate');
                    pastDate = true;
                }
                if (availableApptsInDay.length != 0 && !pastDate) {
                    if (mobile === true) {
                        dateDisplay.attr('data-bs-toggle', 'modal');
                        dateDisplay.attr('data-bs-target', '#serviceSelection');
                        dateDisplay.attr('data-appts', JSON.stringify(availableApptsInDay));
                        dateDisplay.addClass('availableDate');
                        appointmentsDisplay = $('<div class="d-flex justify-content-center align-items-center"></div>');
                        availableApptsInDay.forEach(appt => {
                            appointmentsDisplay.append(`<div data-date=${date} class='fs-1'>.</div>`)
                        });
                        dateDisplay.append(appointmentsDisplay);
                    } else {
                        appointmentsDisplay = $(`<div data-date=${date} class="col-12"></div>`);

                        availableApptsInDay.forEach(appt => {
                            const apptName = appt.apptType ? appt.apptType.Name : 'Available';
                            const apptTime = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                            appointmentsDisplay.append(`<div id=${appt.Id} data-bs-toggle='modal' data-bs-target='#serviceSelection' class='appt-time'>${apptTime} ${apptName}</div>`)
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
    else { $('.appt-time').on('click', displayApptDetails); }
}

$('#serviceSelection').on('hidden.bs.modal', () => {
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
    renderCalendar(displayedMonth, displayedYear);
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
    renderCalendar(displayedMonth, displayedYear);
});

checkScreenWidth();
renderCalendar();