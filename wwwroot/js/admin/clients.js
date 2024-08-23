import auth from "../utils/auth";

const token = auth.getToken()

const clientStates = {
    services: [],
    clients: [],
    displayedClients: [],
    displayedAppt: {},
    displayDate: 0,
    displayMonth: 0,
    displayYear: 0,
    displayedService: {},
    displayedPastAppts: [],
    displayClient: 0,
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

useEffect(() => {
    getServices();
}, []);

const getService = async (appt) => {
    const service = clientStates.services.find(service => service.Id === appt.ApptTypeId);
    clientStates.displayedService = service;
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

useEffect(() => {
    fetchClients();
}, []);

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
    clientStates.displayedAppt = appt;
    clientStates.displayDate = date.getDate();
    clientStates.displayMonth = date.getMonth() + 1;
    clientStates.displayYear = date.getFullYear();
}