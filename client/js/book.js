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
        $('#serviceSelectionLabel').text('Available Times');
        const day = parseInt(event.target.id);
        const availableApptsInDay = appointments.filter(appt => appt.Date === day && appt.Requested === false);

        availableApptsInDay.forEach(appt => {
            const timeDisplay = $(`<div class="col-5 m-1 text-center time-option">${appt.Time}</div>`);
            $('#modal-body').append(timeDisplay);
        });
        $('.time-option').on('click', (event) => {
            $('#serviceSelectionLabel').text('Select Service');
            $('#modal-body').empty();

            const time = event.target.innerText;
            const selectedAppt = availableApptsInDay.find(appt => appt.Time === time);
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
                $('.dropdown-toggle').text(event.target.innerText);
            });
            $('#modal-body').append(`<button class="monthNavBtn mt-3">Request Appointment</button>`);
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