import auth from "../utils/auth";
import { renderApptModal } from './calendarModal.js';

const token = auth.getToken()

const clientStates = {
    services: [],
    clients: [],
    displayedClients: [],
    dayAppts: [],
    date: 0,
    month: 0,
    year: 0,
    displayService: {},
    displayedPastAppts: [],
    displayClient: 0,
    token: token
}

function setLoading(loading) {
    if (loading) {
        $('#clients').prepend(`<div class="spinner-border" role="status"></div>`);
    }
    else {
        $('.spinner-border').remove();
    }
}

function displayError(error) {
    $('#clients').prepend(`<div class="alert alert-danger mx-2 my-0 p-2">${error}</div>`);
}

function removeError() {
    $('.alert').remove();
}

function displaySuccess(message) {
    $('#clients').prepend(`<div class="alert alert-success mx-2 my-0 p-2">${message}</div>`);
}

function removeSuccess() {
    $('.alert').remove();
}

const getServices = async () => {
    const services = await auth.getServices();
    if (typeof services === 'string') { displayError(services); return; }
    clientStates.services = services;
}
const getService = async (appt) => {
    const service = clientStates.services.find(service => service.Id === appt.ApptTypeId);
    clientStates.displayService = service;
}

const fetchClients = async () => {
    setLoading(true);
    removeError();
    try {
        const response = await fetch('http://localhost:5062/api/clients', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            clientStates.clients = data;
            clientStates.displayedClients = data;
        }
        if (!response.ok) { displayError(data) }
        setLoading(false);
    } catch (error) {
        console.error(error);
        setLoading(false);
        displayError('An error occurred while making request. Please try again later.');
    }
}

const payBalance = async (clientId, price) => {
    try {
        const response = await fetch(`http://localhost:5062/api/adjustBalance/`, {
            method: 'PUT',
            body: JSON.stringify({ ClientId: clientId, Price: price }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            displaySuccess('Balance cleared')
            setTimeout(() => {
                removeSuccess();
            }, 2000);
        }
        if (!response.ok) { displayError('Failed to clear balance') }
        fetchClients();
    }
    catch (error) {
        console.error(error);
    }
}

const sortAppts = (appts) => {
    return appts.sort((a, b) => {
        // Compare years
        if (a.year !== b.year) {
            return a.year - b.year;
        }
        // Compare months
        if (a.month !== b.month) {
            return a.month - b.month;
        }
        // Compare dates
        return a.date - b.date;
    });
}

const togglePastAppts = (pastAppts, clientId) => {
    if (clientId === clientStates.displayClient) {
        clientStates.displayedPastAppts = [];
        clientStates.displayClient = 0;
    }
    else {
        clientStates.displayedPastAppts = pastAppts;
        clientStates.displayClient = clientId;
    }
}

const handleSearchChange = (e) => {
    const search = e.target.value;
    if (search === '') {
        clientStates.displayedClients = clientStates.clients;
        return;
    }
    const filteredClients = clientStates.clients.filter((client) => {
        return client.Client.Name.toLowerCase().includes(search.toLowerCase()) || client.Client.Email.toLowerCase().includes(search.toLowerCase()) || client.Client.Phone.includes(search);
    });
    clientStates.displayedClients = filteredClients;
}

const setModalStates = (appt) => {
    getService(appt);
    const date = new Date(appt.DateTime);
    clientStates.dayAppts = [appt];
    clientStates.date = date.getDate();
    clientStates.month = date.getMonth() + 1;
    clientStates.year = date.getFullYear();
    renderApptModal(clientStates, fetchClients);
}

async function renderClients() {
    $('#clients').children().not('#search').remove();

    if (displayedClients.length === 0 && !loading) {
        $('#clients').append(`<div className="alert alert-info">No clients to display</div>`);
        return
    }

    $('#clients').append(`
        <div className="my-2 col-12 d-flex flex-wrap justify-content-evenly">
        ${clientStates.displayedClients.map((clientInfo) => {
        const client = clientInfo.Client
        const clientAppts = clientInfo.Appointments
        const phone = client.Phone.includes('-') ? client.Phone : `${client.Phone.slice(0, 3)}-${client.Phone.slice(3, 6)}-${client.Phone.slice(6)}`
        const pastAppts = sortAppts(clientAppts.filter((appt) => appt.Status === 3))
        const futureAppts = sortAppts(clientAppts.filter((appt) => appt.Status !== 3))
        return (
            `<div key=${client.Id}
            className="bg-white text-darkgray rounded fade-in p-1 my-2 col-10 col-md-5 d-flex flex-column align-items-center">
            <div className="col-12 d-flex flex-column align-items-center border-bottom border-light">
                <h3 className="m-0">${client.Name}</h3>
                <p className="m-0">${client.Email}</p>
                <p className="m-0">${phone}</p>
                <h3 className="text-decoration-underline mx-1">Upcoming Appointments</h3>
                ${futureAppts.length === 0 ? '<p>No upcoming appointments</p>' : ''}
                ${futureAppts.map((appt) => {
                const time = new Date(appt.DateTime).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit'
                });
                const date = new Date(appt.DateTime).toLocaleDateString('en-US', {
                    month: '2-digit', day: '2-digit',
                    year: 'numeric'
                });
                return (
                    `<div id=${appt.Id}
                        className="client-appt custom-btn pink-border d-flex justify-content-between align-items-center col-10 col-lg-8 px-3 my-2" data-bs-toggle="modal" data-bs-target="#apptsModal">
                        <p className="fs-5 m-0 text-center">${date}</p>
                        <p className="fs-5 m-0 text-center">${time}</p>
                    </div>`
                )
            }).join('')}            
            </div>
            <h3>Balance: ${client.Balance}</h3>
            <div className="d-flex justify-content-evenly col-12 my-2">
                <button className="custom-btn success-btn" onClick=${() => payBalance(client.Id, client.Balance)}>Clear
                    Balance</button>
                <button className="custom-btn" onClick=${() => togglePastAppts(pastAppts, client.Id)}>${displayClient === client.Id ? 'Hide' : 'View'} Past Appts</button>
            </div>
            ${displayClient === client.Id &&
            `<div className="d-flex flex-column align-items-center col-12">
                <h3 className="text-decoration-underline">Past Appointments</h3>
                ${displayedPastAppts.length === 0 && <p>No past appointments</p>}
                ${displayedPastAppts.map((appt) => {
                const time = new Date(appt.DateTime).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit'
                });
                const date = new Date(appt.DateTime).toLocaleDateString('en-US', {
                    month: '2-digit', day: '2-digit',
                    year: 'numeric'
                });
                return (
                    `<div id=${appt.Id}
                            className="client-appt custom-btn pink-border d-flex justify-content-between align-items-center col-10 col-lg-8 px-3 my-2"
                             data-bs-toggle='modal' data-bs-target='#apptsModal'>
                            <p className="fs-5 m-0 text-center">${date}</p>
                            <p className="fs-5 m-0 text-center">${time}</p>
                        </div>`
                )
            })}
            </div>`
            }
        </div>`
        )
    }
    )}
    </div>`);

    $('.client-appt').off('click').on('click', () => {
        const apptId = $(this).attr('id');
        const appt = clientAppts.find(appt => appt.Id === apptId);
        setModalStates(appt)
    })
}