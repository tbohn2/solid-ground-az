const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

// Will fetch available appointments from the server by month and year
const availableAppts = [
    {
        year: 2024,
        months: [
            {
                month: 3,
                dates: [
                    { date: 1, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 2, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 5, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 6, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 7, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 8, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 9, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 29, times: [{ time: '10:00 AM', booked: false }], }
                ]
            },
            {
                month: 4,
                dates: [
                    { date: 2, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 5, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 6, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 7, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 8, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 9, times: [{ time: '10:00 AM', booked: false }], },
                    { date: 29, times: [{ time: '10:00 AM', booked: false }], },
                ]
            },
        ],
    },
];

const currentDay = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
let displayedYear = currentYear;
let displayedMonth = currentMonth;

// Array of arrays of weeks
let displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);

function renderCalendar() {
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);

    let availableDates = [];
    // Optional chaining to check if the date, month, and year are available
    if (availableAppts.find(appt => appt.year === displayedYear)?.months?.find(month => month.month === displayedMonth)?.dates) {
        availableDates = availableAppts.find(appt => appt.year === displayedYear).months.find(month => month.month === displayedMonth).dates;
    }

    displayedDates.forEach(week => {
        let weekDisplay = $('<div class="d-flex"></div>');
        week.forEach(day => {
            let dayDisplay = $('<div class="date"></div>');
            let blockedOut = $('<span class="unavailableDate"></span>')
            if (day === 0) {
                dayDisplay.text('');
            } else {
                if (availableDates.find(appt => appt.date === day && appt.times.find(time => time.booked === false)) && day >= currentDay) {
                    dayDisplay = $('<div class="date availableDate" data-bs-toggle="modal" data-bs-target="#serviceSelection"></div>');
                    if (day === currentDay && displayedMonth === currentMonth && displayedYear === currentYear) {
                        dayDisplay.addClass('currentDay');
                    }
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
    renderCalendar();
});

$('#next').on('click', () => {
    displayedMonth += 1;
    if (displayedMonth === 13) {
        displayedMonth = 1;
        displayedYear += 1;
    }
    $('#calendar-dates').empty();
    displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);
    renderCalendar();
});

renderCalendar();