import auth from './auth.js';
import {
    services,
    displayService,
    setDisplayService,
    appts as dayAppts,
    date as displayDate,
    month as calendarMonth,
    year as calendarYear,
    refetch,
    token
} from './calendar.js';

const privateServices = services.filter(service => service.Private === true);
const publicServices = services.filter(service => service.Private === false);
const adminId = localStorage.getItem('admin_id');
const token = auth.getToken();
const dateDisplay = new Date(year, month - 1, date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const minutes = ['00', '15', '30', '45'];
const statuses = ['Available', 'Requested', 'Booked', 'Completed', 'Public'];
const initialFormState = { Hour: 12, Minutes: '00', MeridiemAM: true, ApptTypeId: null, Status: 0 };

const state = {
    appointments: [],
    newApptDetails: initialFormState,
    apptDetails: null,
    addingAppts: false,
    editingAppt: false,
    deletingAppt: false,
    loading: false,
    error: ''
};

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
    state.loading = false;
    state.error = '';
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

$('select[name="Hour"], select[name="Minutes"], select[name="MeridiemAM"]').on('change', handleInputChange);

function toggleDetails(appt) {
    state.apptDetails = (state.apptDetails === appt) ? null : appt;
    // Update the view accordingly
}

function toggleEditing() {
    if (state.editingAppt) {
        state.newApptDetails = initialFormState;
    } else {
        const dateTime = new Date(state.apptDetails.DateTime);
        state.newApptDetails = {
            Hour: dateTime.getHours() % 12 || 12,
            Minutes: dateTime.getMinutes(),
            MeridiemAM: dateTime.getHours() < 12,
            ApptTypeId: state.apptDetails.ApptTypeId,
            Status: state.apptDetails.Status
        };
    }
    state.editingAppt = !state.editingAppt;
}

const toggleDeleting = () => {
    state.deletingAppt = !state.deletingAppt;
}

const addAppt = async () => {
    state.loading = true;
    state.error = '';
    // "DateTime": "2024-04-28 14:00:00"

    let newHour = state.newApptDetails.MeridiemAM === false && state.newApptDetails.Hour !== 12 ? state.newApptDetails.Hour + 12 : state.newApptDetails.Hour;
    newHour = newHour === 12 && state.newApptDetails.MeridiemAM === true ? '00' : newHour;

    const newAppt = {
        AdminId: adminId,
        DateTime: `${year}-${month}-${date} ${newHour}:${state.newApptDetails.Minutes}:00`,
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
            state.loading = false;
            clearStates();
            refetch();
        }
        if (!response.ok) {
            state.loading = false;
            const error = await response.json();
            state.error = error;
        }
    }
    catch (error) {
        console.error(error);
        state.loading = false;
        state.error = 'An error occurred while making request. Please try again later.';
    }
}

const editAppt = async () => {
    state.loading = true;
    state.error = '';

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
            state.loading = false;
            clearStates();
            refetch();
            state.appointments = [appt]
            setApptDetails(appt);
        }
        if (!response.ok) {
            state.loading = false;
            const error = await response.json();
            state.error = error;
        }
    }
    catch (error) {
        console.error(error);
        state.loading = false;
        state.error = 'An error occurred while making request. Please try again later.';
    }
}

const approveAppt = async () => {
    state.loading = true;
    state.error = '';
    try {
        const response = await fetch(`http://localhost:5062/api/approveAppt/`, {
            method: 'PUT',
            body: JSON.stringify({ Id: state.apptDetails.Id }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            state.loading = false;
            clearStates();
            refetch();
        }
        if (!response.ok) {
            state.loading = false;
            const error = await response.json();
            state.error = error;
        }
    }
    catch (error) {
        console.error(error);
        state.loading = false;
        state.error = 'An error occurred while making request. Please try again later.';
    }
}

const denyAppt = async () => {
    state.loading = true;
    state.error = '';
    try {
        const response = await fetch(`http://localhost:5062/api/denyAppt/`, {
            method: 'PUT',
            body: JSON.stringify({ Id: state.apptDetails.Id }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            state.loading = false;
            clearStates();
            refetch();
        }
        if (!response.ok) {
            state.loading = false;
            const error = await response.json();
            state.error = error;
        }
    }
    catch (error) {
        console.error(error);
        setError('An error occurred while making request. Please try again later.');

    }
}

const completeAppt = async () => {
    state.loading = true;
    state.error = '';
    try {
        const response = await fetch(`http://localhost:5062/api/completeAppt/`, {
            method: 'PUT',
            body: JSON.stringify({ Id: state.apptDetails.Id, ApptType: { Price: displayService.Price }, ClientId: state.apptDetails.ClientId }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            state.loading = false;
        }
        if (!response.ok) {
            state.loading = false;
            state.error = 'Failed to complete appointment';
        }
        refetch();
    }
    catch (error) {
        console.error(error);
        state.loading = false;
        state.error = 'An error occurred while making request. Please try again later.';
    }
}


const deleteAppt = async () => {
    state.loading = true;
    state.deletingAppt = false;
    state.error = '';
    try {
        const response = await fetch(`http://localhost:5062/api/deleteAppt/`, {
            method: 'DELETE',
            body: JSON.stringify({ Id: state.apptDetails.Id }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            state.loading = false;
            clearStates();
            refetch();
        }
        if (!response.ok) {
            state.loading = false;
            const error = await response.json();
            state.error = error;
        }
    }
    catch (error) {
        console.error(error);
        state.loading = false;
        state.error = 'An error occurred while making request. Please try again later.';
    }
}