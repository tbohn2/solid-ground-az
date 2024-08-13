import auth from './auth.js';

// Manage logged in state to redirect to login page if not logged in

const token = auth.getToken();
const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const statuses = ['Available', 'Requested', 'Booked', 'Completed', 'Firm'];
const currentDate = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

let services = [];
let displayService = {};
let displayDate = '';
let calendarMonth = currentMonth;
let calendarYear = currentYear;
let calendarDates = new calendar.Calendar(6).monthdayscalendar(calendarYear, calendarMonth);

let appointments = {};
let dayAppts = [];
let mobile = window.innerWidth < 768 ? true : false;

function setDisplayService(service) {
    displayService = service;
}

function loadingPage() {
    $('#calendar-header').append(`<div class="spinner-border" role="status"></div>`);
}

function removeLoading() {
    $('.spinner-border').remove();
}

function displayError(error) {
    $('#calendar-header').append(`<div class="alert alert-danger mx-2 my-0 p-2">${error}</div>`);
}

function removeError() {
    $('.alert').remove();
}

async function getServices() {
    const retrievedServices = await auth.getServices();
    if (typeof retrievedServices === 'string') { displayError(retrievedServices); return; }
    services = retrievedServices;
}

async function getAppointments() {
    loadingPage();
    removeError();
    try {
        const response = await fetch(`http://localhost:5062/api/allAppts/${calendarMonth}/${calendarYear}`, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        removeLoading();
        if (response.ok) {
            data.forEach(appt => {
                const date = new Date(appt.DateTime).getDate();

                if (!appointments[date]) {
                    appointments[date] = [];
                }
                appointments[date].push(appt);
            });
        }
        if (!response.ok) { displayError(data) }
    } catch (error) {
        console.error(error);
        removeLoading();
        displayError('An error occurred while making request. Please try again later.');
    }
}

function renderCalendar() {

    $('#calendar-dates').empty();
    getAppointments();
    console.log(appointments);

    $('#month').text(months[calendarMonth - 1] + ' ' + calendarYear);

    calendarDates.forEach((week, index) => {
        $('#calendar-dates').append(`<div class="d-flex col-12 fade-in"></div>`);
        week.forEach((date, index) => {
            const apptsForDay = appointments[date] || [];
            let numberDisplay

            if (date === 0) { numberDisplay = '' }
            else { numberDisplay = date }

            $('#calendar-dates').children().last().append(
                `<div id="${date + 'container'}" class="date-container px-1 d-flex flex-column align-items-center date" data-bs-toggle=${mobile ? "modal" : ""}
                    data-bs-target=${mobile ? "#apptsModal" : ""}</div>`)

            $(`#${date + 'container'}`).append(
                `<div class='date-display' data-bs-toggle=${mobile ? "" : "modal"} data-bs-target=${mobile ? "" : "#apptsModal"}>${numberDisplay}</div>`);

            if (mobile) {
                $('.date-container').on('click', function () {
                    dayAppts = appointments[$(this).attr('id').slice(0, -9)];
                })
            }
            else {
                $('.date-display').on('click', function () {
                    dayAppts = appointments[$(this).attr('id')];
                })
            }

            $(`#${date + 'container'}`).append(
                `<div class=${`col-12 ${mobile ? 'd-flex justify-content-center flex-wrap' : 'appts-container'} `}>
                    ${apptsForDay.length > 0 ?
                    mobile ?
                        apptsForDay.map((appt, index) => {
                            return (
                                `<div class='appt-dot'>.</div>`
                            )
                        }).join('')
                        :
                        apptsForDay.map((appt, index) => {

                            let display = ''
                            const apptType = services.find(service => service.Id === appt.ApptTypeId)
                            if (appt.Status === 2 || appt.Status === 4) {
                                display = apptType.Name
                            } else {
                                display = statuses[appt.Status]
                            }
                            const apptTime = new Date(appt.DateTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            });
                            console.log(apptTime);
                            console.log(display);



                            return (
                                `<div id=${appt.Id} data-date=${date} data-bs-toggle='modal' data-bs-target='#apptsModal' class='appt-time'>
                                ${apptTime} ${display}
                            </div>`
                            )
                        }).join('')
                    :
                    ''
                }
                </div>`
            )

        })
    })

    $('.appt-time').on('click', function () {
        const apptId = $(this).attr('id');
        const date = $(this).attr('data-date');
        const thisDayAppts = appointments[date] || [];
        // Id is probably a string, so use == instead of ===
        const appt = thisDayAppts.find(appt => appt.Id === apptId);
        dayAppts = [appt];
        displayService = services.find(service => service.Id === appt.ApptTypeId);
        displayDate = date;
    })
}

function refetch() {
    renderCalendar();
}

$('#prev').click(() => {
    if (calendarMonth === 1) {
        const prevYear = calendarYear - 1;
        calendarMonth = 12;
        calendarYear = prevYear;
    }
    else {
        const prevMonth = calendarMonth - 1;
        calendarMonth = prevMonth;
    }
    refetch();
});

$('#next').click(() => {
    if (calendarMonth === 12) {
        const nextYear = calendarYear + 1;
        calendarMonth = 1;
        calendarYear = nextYear;
    }
    else {
        const nextMonth = calendarMonth + 1;
        calendarMonth = nextMonth;
    }
    refetch();
});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        refetch();
    }
});

renderCalendar();
getServices();

module.exports = {
    services,
    displayService,
    setDisplayService,
    dayAppts,
    displayDate,
    calendarMonth,
    calendarYear,
    refetch,
    token
};