import auth from './auth.js';
import { renderApptModal } from './calendarModal.js';
import { renderNewApptsModal } from './newApptsModal.js';
import { renderServicesModal } from './servicesModal.js';

const adminId = localStorage.getItem('admin_id')
const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const statuses = ['Available', 'Requested', 'Booked', 'Completed', 'Firm'];
const currentDate = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

let state = {
    appointments: {},
    services: [],
    displayService: {},
    dayAppts: [],
    date: '',
    month: currentMonth,
    year: currentYear,
    calendarDates: new calendar.Calendar(6).monthdayscalendar(currentYear, currentMonth),
};

let mobile = window.innerWidth < 768 ? true : false;

function setLoading(loading) {
    if (loading) {
        $('#calendar-header').append(`<div class="spinner-border" role="status"></div>`);
    }
    else {
        $('.spinner-border').remove();
    }
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
    state.services = retrievedServices;
}

async function getAppointments() {
    state.appointments = {};
    setLoading(true);
    removeError();
    try {
        const response = await fetch(`https://solidgroundaz.com/api/${adminId}/allAppts/${state.month}/${state.year}`, { headers: { 'Content-Type': 'application/json' } });
        const data = await response.json();
        setLoading(false);
        if (response.ok) {
            data.forEach(appt => {
                const date = new Date(appt.DateTime).getDate();

                if (!state.appointments[date]) {
                    state.appointments[date] = [];
                }
                state.appointments[date].push(appt);
            });
        }
        if (!response.ok) { displayError(data) }
    } catch (error) {
        console.error(error);
        setLoading(false);
        displayError('An error occurred while making request. Please try again later.');
    }
}

async function renderCalendar() {
    $('#calendar-dates').empty();
    await getAppointments();

    $('#month').text(months[state.month - 1] + ' ' + state.year);

    state.calendarDates.forEach((week, index) => {
        $('#calendar-dates').append(`<div class="d-flex col-12 fade-in"></div>`);
        week.forEach((date, index) => {
            const apptsForDay = state.appointments[date] || [];

            $('#calendar-dates').children().last().append(
                `<div id="${date + 'container'}" class="date-container px-1 d-flex flex-column align-items-center date" ${mobile ? `data-bs-toggle="modal" data-bs-target="#apptsModal"` : ""}</div>`)

            if (date === 0) { return; }

            $(`#${date + 'container'}`).append(
                `<div class='date-display' data-date=${date} ${mobile ? "" : `data-bs-toggle="modal" data-bs-target="#apptsModal"`}>${date}</div>`);

            $(`#${date + 'container'}`).append(
                `<div class='${`col-12 ${mobile ? 'd-flex justify-content-center' : 'appts-container'}`}'>
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
                            const apptType = state.services.find(service => service.Id === appt.ApptTypeId)
                            if (appt.Status === 2 || appt.Status === 4) {
                                display = apptType.Name
                            } else {
                                display = statuses[appt.Status]
                            }
                            const apptTime = new Date(appt.DateTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            });

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

        }

        )
    })

    if (mobile) {
        $('.date-container').on('click', function () {
            state.dayAppts = state.appointments[$(this).attr('id').slice(0, -9)] ? state.appointments[$(this).attr('id').slice(0, -9)] : [];
        })

        $('.date-container').on('click', function () {
            state.displayDate = $(this).attr('id').slice(0, -9);
            renderApptModal(state, renderCalendar);
        })
    }
    else {
        $('.date-display').on('click', function () {
            state.dayAppts = state.appointments[$(this).data('date')] ? state.appointments[$(this).data('date')] : [];
        })

        $('.date-display').on('click', function () {
            state.displayDate = $(this).attr('data-date');
            renderApptModal(state, renderCalendar);
        })

        $('.appt-time').on('click', function () {
            const apptId = $(this).attr('id');
            const date = $(this).attr('data-date');
            const thisDayAppts = state.appointments[date] || [];
            const appt = thisDayAppts.find(appt => appt.Id === parseInt(apptId));
            state.dayAppts = [appt];
            state.displayService = appt.ApptTypeId ? state.services.find(service => service.Id === appt.ApptTypeId) : {};
            state.displayDate = date;
            renderApptModal(state, renderCalendar);
        })
    }

    $('#prev').off('click').on('click', () => {
        state.year = state.month === 1 ? state.year - 1 : state.year;
        state.month = state.month === 1 ? 12 : state.month - 1;
        state.calendarDates = new calendar.Calendar(6).monthdayscalendar(state.year, state.month);
        renderCalendar();
    });

    $('#next').off('click').on('click', () => {
        state.year = state.month === 12 ? state.year + 1 : state.year;
        state.month = state.month === 12 ? 1 : state.month + 1;
        state.calendarDates = new calendar.Calendar(6).monthdayscalendar(state.year, state.month);
        renderCalendar();
    });

    $('#newApptBtn').off('click').on('click', () => {
        renderNewApptsModal(renderCalendar, state.services, months, currentDate, currentMonth, currentYear, setLoading, displayError, removeError);
    });

    $('#servicesBtn').off('click').on('click', () => {
        renderServicesModal(state.services);
    });

}

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = !mobile;
        renderCalendar();
    }
});

export default async function fetchAndRenderAppts() {
    await getServices();
    renderCalendar();
}