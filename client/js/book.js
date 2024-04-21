const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const currentDay = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
let displayedYear = currentYear;
let displayedMonth = currentMonth;
let appointments = [];

async function getAppointments() {
    try {
        const response = await fetch(`http://localhost:5062/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
        const data = await response.json();
        appointments = data;
    } catch (error) {
        console.error(error);
    }
}

// Array of arrays of weeks
let displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);

async function renderCalendar() {
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);
    await getAppointments();

    displayedDates.forEach(week => {
        let weekDisplay = $('<div class="d-flex"></div>');
        week.forEach(day => {
            let dayDisplay = $('<div class="date"></div>');
            let blockedOut = $('<span class="unavailableDate"></span>')
            if (day === 0) {
                dayDisplay.text('');
            }
            else {
                const availableApptsInMonth = appointments.filter(appt => appt.Date === day && appt.Requested === false && day >= currentDay);
                if (day === currentDay && displayedMonth === currentMonth && displayedYear === currentYear) {
                    dayDisplay.addClass('currentDay');
                }
                if (availableApptsInMonth.length != 0) {
                    dayDisplay = $(`<div id=${day} class="date availableDate" data-bs-toggle="modal" data-bs-target="#serviceSelection"></div>`);
                    dayDisplay.text(day);
                } else {
                    dayDisplay.text(day);
                    dayDisplay.append(blockedOut);
                }
            }
            weekDisplay.append(dayDisplay);
        });
        $('#calendar-dates').append(weekDisplay);
    });

    $('.availableDate').on('click', (event) => {
        const day = parseInt(event.target.id);
        const dateDisplay = displayedMonth + '/' + day + '/' + displayedYear
        $('#serviceSelectionLabel').text('Available on' + ' ' + displayedMonth + '/' + day + '/' + displayedYear);
        const availableApptsInDay = appointments.filter(appt => appt.Date === day && appt.Requested === false);

        availableApptsInDay.forEach(appt => {
            const timeDisplay = $(`<div id=${appt.Id} class="col-5 m-1 text-center time-option">${appt.Time}</div>`);
            $('#modal-body').append(timeDisplay);
        });
        $('.time-option').on('click', (event) => {
            $('#serviceSelectionLabel').text('Select Service');
            $('#modal-body').empty();
            const time = event.target.innerText;
            $('#modal-body').append(`<div id=dateDisplay class="fs-3 m-1 text-center">${time} | ${dateDisplay}</div>`);

            const selectedAppt = availableApptsInDay.find(appt => appt.Time === time);
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
                form.on('submit', async (event) => {
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
                    $('#modal-body').append(`
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>`)

                    try {
                        const response = await fetch('http://localhost:5062/api/requestAppt', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(apptToRequest)
                        })
                        if (response.status === 200) {
                            console.log('Success:', response);
                            $('#serviceSelectionLabel').text('Appointment Requested');
                            $('#modal-body').empty();
                            $('#modal-body').append(`<div class="fs-3 m-1 text-center">Thank you for your request! Expect a response within 24 hours</div>`);
                            getAppointments();
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        $('#serviceSelectionLabel').text('Appointment Request Failed');
                        $('#modal-body').empty();
                        $('#modal-body').append(`<div class="fs-3 m-1 text-center">An error occured. Please try again later.</div>`);
                    }
                });
            });
        });
    });
}

$('[data-bs-dismiss="modal"]').on('click', () => {
    $('#serviceSelectionLabel').empty();
    $('#modal-body').empty();
});

$('#prev').on('click', () => {
    displayedMonth -= 1;
    if (displayedMonth === 0) {
        displayedMonth = 12;
        displayedYear -= 1;
    }
    $('#calendar-dates').empty();
    displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);
    renderCalendar(displayedMonth, displayedYear);
});

$('#next').on('click', () => {
    displayedMonth += 1;
    if (displayedMonth === 13) {
        displayedMonth = 1;
        displayedYear += 1;
    }
    $('#calendar-dates').empty();
    displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);
    renderCalendar(displayedMonth, displayedYear);
});

renderCalendar();