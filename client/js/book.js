const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
let displayedYear = currentYear;
let displayedMonth = currentMonth;

// Array of arrays of weeks
let displayedDates = new calendar.Calendar(6).monthdayscalendar(displayedYear, displayedMonth);

function renderCalendar() {
    $('#month-year').text(`${months[displayedMonth - 1]} ${displayedYear}`);

    displayedDates.forEach(week => {
        let weekDisplay = $('<div class="d-flex justify-content-between col-12"></div>');
        week.forEach(day => {
            let dayDisplay = $('<div class="date"></div>');
            if (day === 0) {
                dayDisplay.text('');
            } else {
                dayDisplay.text(day);
            }
            weekDisplay.append(dayDisplay);
        });
        $('#calendar-dates').append(weekDisplay);
    });
}

renderCalendar();

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