const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const currentDate = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
let displayedYear = currentYear;
let displayedMonth = currentMonth;

$('#option2').attr('checked', true);

async function getAppointments() {
    $('#calendar-header').after(`
    <div class="spinner-border" role="status"></div>`)
    try {
        const response = await fetch(`https://tbohn2-001-site1.ctempurl.com/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
        const data = await response.json();
        const appointments = data;
        return appointments;
    } catch (error) {
        console.error(error);
        $('.spinner-border').remove();
        $('#calendar-header').after(`
        <div class="alert alert-danger text-center mt-2" role="alert">
            Server request failed. Please try again later.
        </div>
    `);
        return null;
    }
}

// Array of arrays of weeks
let displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);

async function renderCalendar() {
    $('#calendar-dates').empty();
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);

    const appointments = await getAppointments();
    if (appointments === null) {
        return;
    }
    if (appointments.length === 0) {
        $('#calendar-header').after(`
        <div class="alert alert-info text-center mt-2" role="alert">
            No appointments available this month.
        </div>
    `);
    }
    $('.spinner-border').remove();

    displayedDates.forEach(week => {
        let weekDisplay = $('<div class="d-flex fade-in"></div>');
        week.forEach(date => {
            let dateDisplay = $('<div class="px-1 d-flex flex-column align-items-center date"></div>');
            let pastDate = false;
            if (date === 0) {
                dateDisplay.text('');
            }
            else {
                dateDisplay.append(`<div id=${date}  class='date-display'>${date}</div>`)
                const availableApptsInDay = appointments.filter(appt => new Date(appt.DateTime).getDate() === date)
                if (date < currentDate && displayedMonth === currentMonth && displayedYear === currentYear || displayedMonth < currentMonth && displayedYear === currentYear || displayedYear < currentYear) {
                    dateDisplay.addClass('pastDate');
                    pastDate = true;
                }
                if (availableApptsInDay.length != 0 && !pastDate) {
                    dateDisplay.attr('data-bs-toggle', 'modal');
                    dateDisplay.attr('data-bs-target', '#serviceSelection');
                    dateDisplay.attr('id', date);
                    dateDisplay.addClass('availableDate');
                    const numberOfAppts = availableApptsInDay.length;
                    dateDisplay.append(`<div id=${date} class='fs-3 d-flex justify-content-center align-items-center number-of-appts'>${numberOfAppts}</div>`)
                }
            }
            weekDisplay.append(dateDisplay);
        });
        $('#calendar-dates').append(weekDisplay);
    });

    $('.availableDate').on('click', (event) => {
        const date = parseInt(event.target.id);
        const dateDisplay = displayedMonth + '/' + date + '/' + displayedYear
        $('#serviceSelectionLabel').text('Available on' + ' ' + dateDisplay);
        const availableApptsInDay = appointments.filter(appt => new Date(appt.DateTime).getDate() === date && appt.Status === 0)
            .sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));

        availableApptsInDay.forEach(appt => {
            const apptTime = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const timeDisplay = $(`<div id=${appt.Id} class="col-5 m-1 text-center time-option">${apptTime}</div>`);
            $('#modal-body').append(timeDisplay);
        });
        $('.time-option').on('click', (event) => {
            $('#serviceSelectionLabel').text('Select Service');
            $('#modal-body').empty();
            const time = event.target.innerText;
            $('#modal-body').append(`<div id=dateDisplay class="fs-3 m-1 text-center">${time} | ${dateDisplay}</div>`);

            const selectedAppt = availableApptsInDay.find(appt => new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) === time);

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
                    $('#modal-body').append(`<div class="spinner-border" role="status"></div>`)

                    try {
                        const response = await fetch('https://tbohn2-001-site1.ctempurl.com/api/requestAppt', {
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
                });
            });
        });
    });
}

$('#serviceSelection').on('hidden.bs.modal', function () {
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

renderCalendar();