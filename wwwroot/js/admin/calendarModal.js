import auth from './auth.js';
import {
    services,
    displayService,
    setDisplayService,
    dayAppts as appts,
    displayDate as date,
    calendarMonth as month,
    calendarYear as year,
    refetch,
    token
} from './calendar.js';

console.log('calendarModal.js');


const privateServices = services.filter(service => service.Private === true);
const publicServices = services.filter(service => service.Private === false);
const adminId = localStorage.getItem('admin_id');
const dateDisplay = new Date(year, month - 1, date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const minutes = ['00', '15', '30', '45'];
const statuses = ['Available', 'Requested', 'Booked', 'Completed', 'Public'];
const initialFormState = { Hour: 12, Minutes: '00', MeridiemAM: true, ApptTypeId: null, Status: 0 };

const state = {
    appointments: [],
    newApptDetails: initialFormState,
    apptDetails: null,
    clients: {},
    addingAppts: false,
    editingAppt: false,
    deletingAppt: false,
    loading: false,
    error: ''
};

state.appointments = appts;

function showLoading() {
    $('#cal-modal-body').append(`<div class="spinner-border" role="status"></div>`);
}

function hideLoading() {
    $('.spinner-border').remove();
}

function showError(error) {
    $('#cal-modal-body').append(`<div class="alert alert-danger">${error}</div>`);
}

function hideError() {
    $('.alert').remove();
}

function timeSelector() { }

function updateAppointments(appts) {
    state.appointments = appts;
    state.apptDetails = appts.length === 1 ? appts[0] : null;
    refetch();
}

function clearStates() {
    state.newApptDetails = initialFormState;
    state.apptDetails = state.appointments.length === 1 ? state.appointments[0] : null;
    state.addingAppts = false;
    state.editingAppt = false;
    state.deletingAppt = false;
    hideLoading();
    hideError();
}

function handleInputChange(e) {
    let name = e.target.name;
    let value = e.target.value;

    if (name === 'MeridiemAM') {
        value = value === 'AM';
    } else if (name !== 'Minutes') {
        if (name === 'Status') {
            let apptTypeId = null;
            if (value === '4') {
                apptTypeId = publicServices[0].Id;
            }
            state.newApptDetails = {
                ...state.newApptDetails,
                [name]: parseInt(value),
                ApptTypeId: apptTypeId
            };
            return;
        }
        value = parseInt(value);
    }

    state.newApptDetails = {
        ...state.newApptDetails,
        [name]: value
    };
}

// $('select[name="Hour"], select[name="Minutes"], select[name="MeridiemAM"]').on('change', handleInputChange);

const addAppt = async () => {
    showLoading();
    hideError();
    // "DateTime": "2024-04-28 14:00:00"

    let newHour = state.newApptDetails.MeridiemAM === false && state.newApptDetails.Hour !== 12 ? state.newApptDetails.Hour + 12 : state.newApptDetails.Hour;
    newHour = newHour === 12 && state.newApptDetails.MeridiemAM === true ? '00' : newHour;

    const newAppt = {
        AdminId: adminId,
        DateTime: `${year} - ${month} - ${date} ${newHour}: ${state.newApptDetails.Minutes}:00`,
        // Server uses ApptType to determine status Available or Public
        ApptTypeId: state.newApptDetails.ApptTypeId,
        Status: state.newApptDetails.Status
    }

    try {
        const response = await fetch(`http://localhost:5062/api/newAppts/`, {
            method: 'POST',
            body: JSON.stringify([newAppt]),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            hideLoading();
            clearStates();
            refetch();
        }
        if (!response.ok) {
            hideLoading();
            const error = await response.json();
            showError(error);
        }
    }
    catch (error) {
        console.error(error);
        hideLoading();
        showError('An error occurred while making request. Please try again later.');
    }
}

const editAppt = async () => {
    showLoading();
    hideError();

    // "DateTime": "2024-04-28 14:00:00"
    let newHour = state.newApptDetails.Hour;
    if (state.newApptDetails.MeridiemAM === false) {
        newHour += 12;
    }
    try {
        const response = await fetch(`http://localhost:5062/api/editAppt/`, {
            method: 'PUT',
            body: JSON.stringify({
                Id: state.apptDetails.Id,
                DateTime: `${year}-${month}-${date} ${newHour}:${state.newApptDetails.Minutes}:00`,
                ApptTypeId: state.newApptDetails.ApptTypeId
            }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            const appt = await response.json();
            hideLoading();
            clearStates();
            refetch();
            state.appointments = [appt]
            setApptDetails(appt);
        }
        if (!response.ok) {
            hideLoading();
            const error = await response.json();
            showError(error);
        }
    }
    catch (error) {
        console.error(error);
        hideLoading();
        showError('An error occurred while making request. Please try again later.');
    }
}

const approveAppt = async () => {
    showLoading();
    hideError();
    try {
        const response = await fetch(`http://localhost:5062/api/approveAppt/`, {
            method: 'PUT',
            body: JSON.stringify({ Id: state.apptDetails.Id }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            hideLoading();
            clearStates();
            refetch();
        }
        if (!response.ok) {
            hideLoading();
            const error = await response.json();
            showError(error);
        }
    }
    catch (error) {
        console.error(error);
        hideLoading();
        showError('An error occurred while making request. Please try again later.');
    }
}

const denyAppt = async () => {
    showLoading();
    hideError();
    try {
        const response = await fetch(`http://localhost:5062/api/denyAppt/`, {
            method: 'PUT',
            body: JSON.stringify({ Id: state.apptDetails.Id }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            hideLoading();
            clearStates();
            refetch();
        }
        if (!response.ok) {
            hideLoading();
            const error = await response.json();
            showError(error);
        }
    }
    catch (error) {
        console.error(error);
        setError('An error occurred while making request. Please try again later.');

    }
}

const completeAppt = async () => {
    showLoading();
    hideError();
    try {
        const response = await fetch(`http://localhost:5062/api/completeAppt/`, {
            method: 'PUT',
            body: JSON.stringify({ Id: state.apptDetails.Id, ApptType: { Price: displayService.Price }, ClientId: state.apptDetails.ClientId }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            hideLoading();
        }
        if (!response.ok) {
            hideLoading();
            showError('Failed to complete appointment');
        }
        refetch();
    }
    catch (error) {
        console.error(error);
        hideLoading();
        showError('An error occurred while making request. Please try again later.');
    }
}

const deleteAppt = async () => {
    showLoading();
    state.deletingAppt = false;
    hideError();
    try {
        const response = await fetch(`http://localhost:5062/api/deleteAppt/`, {
            method: 'DELETE',
            body: JSON.stringify({ Id: state.apptDetails.Id }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            hideLoading();
            clearStates();
            refetch();
        }
        if (!response.ok) {
            hideLoading();
            const error = await response.json();
            showError(error);
        }
    }
    catch (error) {
        console.error(error);
        hideLoading();
        showError('An error occurred while making request. Please try again later.');
    }
}

function setAddingAppts(bool) {
    if (bool) {
        $('.appts-container').addClass('hide');
        $('#cal-modal-body').append(`
            < div class= "mt-2 fs-4 col-11 d-flex flex-wrap align-items-center" >
            <h3 class="col-12 text-center">Add Available Time</h3>
                ${timeSelector()}
        < div class= "d-flex justify-content-evenly col-12 my-2" >
                    <button type="button" class="custom-btn success-btn fs-5" onClick={addAppt}>Confirm Time</button>
                    <button type="button" class="custom-btn danger-btn fs-5" onClick={clearStates}>Cancel</button>
                </div >
            </div > `);
    }
    else {
        $('.appts-container').removeClass('hide');
        clearStates();
    }
}

function setEditing(editing) {
    if (editing) {
        $('.time').addClass('hide');
        $('.default-buttons').addClass('hide');

        const dateTime = new Date(state.apptDetails.DateTime);
        state.newApptDetails = {
            Hour: dateTime.getHours() % 12 || 12,
            Minutes: dateTime.getMinutes(),
            MeridiemAM: dateTime.getHours() < 12,
            ApptTypeId: state.apptDetails.ApptTypeId,
            Status: state.apptDetails.Status
        };

        $('.time').after(`
            <div class="mt-2 fs-5 col-12 d-flex flex-column align-items-center">
                ${timeSelector()}
            </div>
        `);

        $('#cal-modal-body').append(`
            <div class="editing-buttons d-flex justify-content-evenly col-12">
                <button id='save-edit' type="button" class="custom-btn success-btn fs-5 my-2">Save</button>
                <button id='cancel-edit' type="button" class="custom-btn fs-5 my-2">Cancel</button>
            </div>
        `);

        $('#save-edit').on('click', editAppt);
        $('#cancel-edit').on('click', setEditing(false));
    } else {
        $('.time').removeClass('hide');
        $('.default-buttons').removeClass('hide');
        state.newApptDetails = initialFormState;
    }
}

const setDeleting = (deleting) => {
    state.deletingAppt = !state.deletingAppt;
    $('.deleting-buttons').remove();
    $('.default-buttons').addClass('hide');

    if (deleting) {
        $('#cal-modal-body').append(`
            <div class="mt-2 fs-4 col-12 pink-border d-flex flex-column align-items-center">
                <h3>Are you sure you want to delete this appointment?</h3>
                <div class="d-flex justify-content-evenly col-12">
                    <button id="confirm-del" type="button" class="custom-btn danger-btn fs-5 my-2" data-bs-dismiss="modal">Confirm Delete</button>
                    <button id="cancel-del" type="button" class="custom-btn fs-5 my-2">Cancel</button>
                </div>
            </div>
            `);

        $('#confirm-del').on('click', deleteAppt);
        $('#cancel-del').on('click', setDeleting(false));
    }
    else {
        $('.default-buttons').removeClass('hide');
        $('.deleting-buttons').remove();
    }
}

function toggleDetails(appt) {
    state.apptDetails = (state.apptDetails === appt) ? null : appt;

    const time = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    if (state.apptDetails === appt) {
        $('.appt-details').remove();
    } else {
        const client = state.clients[appt.Id] ? state.clients[appt.Id] : null;

        $(`#appt-card-${appt.Id}`).append(`
        <div class='appt-details pt-2 col-12 text-center fade-in'>
            <h2 class="fs-5">Status: <span class="text-purple">${statuses[appt.Status]}</span></h2>
            ${displayService &&
            `<div>
                <h2 class="fs-5">Class Name: <span class="text-purple">${displayService.Name}</span></h2>
                <h2 class="fs-5">Price: <span class="text-purple">${displayService.Price}</span></h2>
                <h2 class="fs-5">Duration: <span class="text-purple">${displayService.Duration} min</span></h2>
            </div>`}
            <h2 class="time fs-5">Time: <span class="text-purple">${time}</span></h2>
            ${client &&
            `<div class="my-2">
                <h2 class="text-decoration-underline">Client Information</h2>
                <p class="fs-5 m-0 text-purple fw-bold">${client.Name}</p>
                <p class="fs-5 m-0 text-purple fw-bold">${client.Phone.includes('-') ? client.Phone : `${client.Phone.slice(0, 3)} - ${client.Phone.slice(3, 6)} - ${client.Phone.slice(6)}`}</p>
                <p class="fs-5 m-0 text-purple fw-bold">${client.Email}</p>
            </div>`
            }
            ${appt.Status === 1 &&
            `<div class="d-flex justify-content-evenly my-3">
                <button type="button" class="custom-btn success-btn fs-5 col-3" onClick={approveAppt}>Approve</button>
                <button type="button" class="custom-btn danger-btn fs-5 col-3" onClick={denyAppt}>Deny</button>
            </div>`
            }            
            <div class="default-buttons d-flex flex-wrap justify-content-evenly mt-3 col-12">
                <button id='set-complete' type="button" class="custom-btn success-btn col-12 col-md-4 fs-5 mb-3" onClick={completeAppt}>Set Complete</button>
                <button id='enable-edit' type="button" class="custom-btn col-12 col-md-3 fs-5 mb-3" onClick={toggleEditing}>Edit</button>
                <button id='enable-delete' type="button" class="custom-btn danger-btn col-12 col-md-4 fs-5 mb-3" onClick={toggleDeleting}>Delete</button>
            </div>
        </div>    
        `)

        $('#set-complete').on('click', completeAppt);
        $('#enable-edit').on('click', setEditing(true));
        $('#enable-delete').on('click', setDeleting(true));
    }
}

$('.modal-title').text(dateDisplay);

$('#cal-modal-body').append(`
    ${appointments.length === 0 && !addingAppts && `<h2 class="fs-5">Add Appointments Below</h2>`}
    ${appointments.map((appt, index) => {

    if (appt.Client) {
        state.clients[appt.Id] = appt.Client // Store client info in state
    }
    let display = ''
    if (appt.Status === 2 || appt.Status === 4) {
        const apptType = services.find(service => service.Id === appt.ApptTypeId)
        display = apptType.Name
    } else {
        display = statuses[appt.Status]
    }
    const time = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        `<div class="appts-container d-flex flex-column align-items-center col-11">
            <div id=${"appt-card-" + appt.Id} class="appt-card col-12 px-1 mt-3 d-flex flex-wrap align-items-center">
                <div id=${appt.Id} class="appt-card-header text-purple col-12 d-flex px-1">
                    <h2 class="fs-5 my-1 col-3">${time}</h2>
                    <h2 class="fs-5 my-1 col-6 text-center">${display}</h2>
                    <h2 class="my-1 col-3"></h2>
                </div>
            </div>
        </div>`
    )
})}
 `);


$('.appt-card-header').on('click', () => {
    const apptId = $(this).attr('id');
    const appt = appointments.find(appt => appt.Id === apptId);
    toggleDetails(appt)
}
);