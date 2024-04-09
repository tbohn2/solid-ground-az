const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const currentDay = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
let displayedYear = currentYear;
let displayedMonth = currentMonth;
let availableAppts = [];

async function getAppointments() {
    try {
        const response = await fetch(`http://localhost:5062/api/apptsInMonth/${displayedMonth}/${displayedYear}`);
        const data = await response.json();
        availableAppts = data;
    } catch (error) {
        console.error(error);
    }
}

// Array of arrays of weeks
let displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);

async function renderCalendar() {
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);
    await getAppointments();
    console.log(availableAppts);

    displayedDates.forEach(week => {
        let weekDisplay = $('<div class="d-flex"></div>');
        week.forEach(day => {
            let dayDisplay = $('<div class="date"></div>');
            let blockedOut = $('<span class="unavailableDate"></span>')
            if (day === 0) {
                dayDisplay.text('');
            }
            else {
                if (day === currentDay && displayedMonth === currentMonth && displayedYear === currentYear) {
                    dayDisplay.addClass('currentDay');
                }
                if (availableAppts.find(appt => appt.Date === day && appt.Requested === false && day >= currentDay)) {
                    console.log("yo");
                    dayDisplay = $('<div class="date availableDate" data-bs-toggle="modal" data-bs-target="#serviceSelection"></div>');
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
}

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