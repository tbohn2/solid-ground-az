export function renderApptModal(state, setDisplayService, refetch) {
    let services = state.services;
    let displayService = state.displayService;
    let appts = state.dayAppts;
    let date = state.displayDate;
    let month = state.month;
    let year = state.year;
    let token = state.token;

    const privateServices = services.filter(service => service.Private === true);
    const publicServices = services.filter(service => service.Private === false);
    const adminId = localStorage.getItem('admin_id');
    const dateDisplay = new Date(year, month - 1, date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const minutes = ['00', '15', '30', '45'];
    const statuses = ['Available', 'Requested', 'Booked', 'Completed', 'Public'];
    const initialFormState = { Hour: 12, Minutes: '00', MeridiemAM: true, ApptTypeId: null, Status: 0 };

    const calModalState = {
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

    calModalState.appointments = appts;

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

    function updateAppointments(appts) {
        calModalState.appointments = appts;
        calModalState.apptDetails = appts.length === 1 ? appts[0] : null;
        refetch();
    }

    function clearStates() {
        $('#adding-container').remove();
        $('#editing-container').remove();
        $('#deleting-container').remove();

        calModalState.newApptDetails = initialFormState;
        calModalState.apptDetails = null;
        calModalState.addingAppts = false;
        calModalState.editingAppt = false;
        calModalState.deletingAppt = false;
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
                calModalState.newApptDetails = {
                    ...calModalState.newApptDetails,
                    [name]: parseInt(value),
                    ApptTypeId: apptTypeId
                };
                return;
            }
            value = parseInt(value);
        }

        calModalState.newApptDetails = {
            ...calModalState.newApptDetails,
            [name]: value
        };
    }

    function timeSelector() {
        const selector = `
            <div id='time-selector' class="d-flex flex-column col-12 justify-content-center align-items-center my-2">
            <div class="d-flex col-12 justify-content-center align-items-center">
                <select name="Hour" class="new-appt-input custom-btn mx-1">
                    ${hours.map((hour, index) => `<option key=${index} value=${hour} ${hour == calModalState.newApptDetails.Hour ? 'selected' : ''}>${hour}</option>`)}
                </select>
                <p class="d-flex align-items-center my-0">:</p>
                <select name="Minutes" class="new-appt-input custom-btn mx-1">
                    ${minutes.map((minute, index) => `<option key=${index} value=${minute} ${minute == calModalState.newApptDetails.Minutes ? 'selected' : ''}>${minute}</option>`)}
                </select>
                <select name="MeridiemAM" class="new-appt-input custom-btn">
                    <option value="AM" ${calModalState.newApptDetails.MeridiemAM ? 'selected' : ''}>AM</option>
                    <option value="PM" ${!calModalState.newApptDetails.MeridiemAM ? 'selected' : ''}>PM</option>
                </select>
            </div>
            ${calModalState.addingAppts ?
                `<select id='status-select' name="Status" class="new-appt-input custom-btn mt-2">
                    <option value='0' selected>Private</option>
                    <option value='4'>Public</option>
                </select>` :
                ``
            }
        </div>`;

        if (calModalState.addingAppts) {
            $('#adding-container h3').after(selector);
        } else if (calModalState.editingAppt) {
            $(`#editing-container h3`).append(selector);
        }


        function renderServiceSelect() {
            $('select[name="ApptTypeId"]').remove();

            if (calModalState.newApptDetails.Status !== 0) { // Service not Available
                $('#time-selector').append(
                    `${calModalState.newApptDetails.Status !== 4 ? // Service not Public (has Status 1, 2, or 3)
                        `<select name="ApptTypeId" class="new-appt-input custom-btn mt-2">
                            ${privateServices.map((service, index) => `<option key=${index} value=${service.Id} ${service.Id === calModalState.newApptDetails.ApptTypeId ? 'selected' : ''}>${service.Name}</option>`)}
                        </select>`
                        :
                        `<select name="ApptTypeId" class="new-appt-input custom-btn mt-2">
                            ${publicServices.map((service, index) => `<option key=${index} value=${service.Id} ${service.Id === calModalState.newApptDetails.ApptTypeId ? 'selected' : ''}>${service.Name}</option>`)}
                        </select>`
                    }`

                );
            }
        }

        renderServiceSelect();
        $('.new-appt-input').on('change', (e) => handleInputChange(e));
        $('#status-select').on('change', renderServiceSelect);

    }

    async function addAppt() {
        showLoading();
        hideError();
        // "DateTime": "2024-04-28 14:00:00"

        let newHour = calModalState.newApptDetails.MeridiemAM === false && calModalState.newApptDetails.Hour !== 12 ? calModalState.newApptDetails.Hour + 12 : calModalState.newApptDetails.Hour;
        newHour = newHour === 12 && calModalState.newApptDetails.MeridiemAM === true ? '00' : newHour;

        const newAppt = {
            AdminId: adminId,
            DateTime: `${year}-${month}-${date} ${newHour}:${calModalState.newApptDetails.Minutes}:00`,
            // Server uses ApptType to determine status Available or Public
            ApptTypeId: calModalState.newApptDetails.ApptTypeId,
            Status: calModalState.newApptDetails.Status
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
                $('#apptsModal').modal('hide');
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

    async function editAppt() {
        showLoading();
        hideError();

        // "DateTime": "2024-04-28 14:00:00"
        let newHour = calModalState.newApptDetails.Hour;
        if (calModalState.newApptDetails.MeridiemAM === false) {
            newHour === 12 ? newHour = '00' : newHour += 12;
        }
        try {
            const response = await fetch(`http://localhost:5062/api/editAppt/`, {
                method: 'PUT',
                body: JSON.stringify({
                    Id: calModalState.apptDetails.Id,
                    DateTime: `${year}-${month}-${date} ${newHour}:${calModalState.newApptDetails.Minutes == '0' ? '00' : calModalState.newApptDetails.Minutes}:00`,
                    ApptTypeId: calModalState.newApptDetails.ApptTypeId
                }),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const appt = await response.json();
                clearStates();
                refetch();
                calModalState.appointments = [appt]
                toggleDetails(appt);
                $(`#${appt.Id} .time`).text(new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
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

    async function approveAppt() {
        showLoading();
        hideError();
        try {
            const response = await fetch(`http://localhost:5062/api/approveAppt/`, {
                method: 'PUT',
                body: JSON.stringify({ Id: calModalState.apptDetails.Id }),
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

    async function denyAppt() {
        showLoading();
        hideError();
        try {
            const response = await fetch(`http://localhost:5062/api/denyAppt/`, {
                method: 'PUT',
                body: JSON.stringify({ Id: calModalState.apptDetails.Id }),
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

    async function completeAppt() {
        showLoading();
        hideError();
        try {
            const response = await fetch(`http://localhost:5062/api/completeAppt/`, {
                method: 'PUT',
                body: JSON.stringify({ Id: calModalState.apptDetails.Id, ApptType: { Price: displayService.Price }, ClientId: calModalState.apptDetails.ClientId }),
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

    async function deleteAppt() {
        showLoading();
        calModalState.deletingAppt = false;
        hideError();
        try {
            const response = await fetch(`http://localhost:5062/api/deleteAppt/`, {
                method: 'DELETE',
                body: JSON.stringify({ Id: calModalState.apptDetails.Id }),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                hideLoading();
                clearStates();
                refetch();
                $('#apptsModal').modal('hide');
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

    function setAddingAppts(adding) {
        if (adding) {
            $('#editing-container').remove();
            toggleDetails(calModalState.apptDetails)
            calModalState.addingAppts = true;
            $('.appts-container').hide();
            $('#cal-modal-body').append(`
            <div id='adding-container' class="mt-2 fs-4 col-11 d-flex flex-wrap align-items-center">
                <h3 class="col-12 text-center">Add Available Time</h3>
                <div class= "d-flex justify-content-evenly col-12 my-2">
                    <button id='confirm-add' type="button" class="custom-btn success-btn fs-5">Confirm Time</button>
                    <button id='cancel-add' type="button" class="custom-btn danger-btn fs-5">Cancel</button>
                </div>
            </div>`);

            timeSelector();

            $('#confirm-add').on('click', addAppt);
            $('#cancel-add').on('click', () => setAddingAppts(false))
        } else {
            calModalState.addingAppts = false;
            calModalState.newApptDetails = initialFormState;
            $('#adding-container').remove();
        }
    }

    function setEditing(editing) {
        if (editing) {
            calModalState.addingAppts = false;
            calModalState.deletingAppt = false;
            $('#adding-container').remove();
            $('#deleting-container').remove();

            $(`.appt-details`).hide();
            const apptId = calModalState.apptDetails.Id

            const dateTime = new Date(calModalState.apptDetails.DateTime);
            calModalState.editingAppt = true;
            calModalState.newApptDetails = {
                Hour: dateTime.getHours() % 12 || 12,
                Minutes: dateTime.getMinutes(),
                MeridiemAM: dateTime.getHours() < 12,
                ApptTypeId: calModalState.apptDetails.ApptTypeId,
                Status: calModalState.apptDetails.Status
            };


            $(`#appt-card-${apptId}`).append(`
                <div id='editing-container' class="mt-2 fs-4 col-12 d-flex flex-wrap align-items-center">
                    <h3 class="col-12 text-center">Edit Appointment</h3>
                    <div class="editing-buttons d-flex justify-content-evenly col-12">
                        <button id='save-edit' type="button" class="custom-btn success-btn fs-5 my-2">Save</button>
                        <button id='cancel-edit' type="button" class="custom-btn fs-5 my-2">Cancel</button>
                    </div>
                </div>
                `);

            timeSelector();

            $('#save-edit').on('click', editAppt);
            $('#cancel-edit').on('click', () => setEditing(false));
        } else {
            $(`.appt-details`).show();
            $('#editing-container').remove();
            calModalState.editingAppt = false;
            calModalState.newApptDetails = initialFormState;
        }
    }

    const setDeleting = (deleting) => {
        const apptId = calModalState.apptDetails.Id
        calModalState.deletingAppt = deleting;
        $('.deleting-buttons').remove();

        if (deleting) {
            $('#set-complete').hide();
            $('#enable-edit').hide();
            $('#enable-delete').hide();

            $(`#appt-card-${apptId}`).append(`
            <div id='deleting-container' class="mt-2 fs-4 col-12 pink-border d-flex flex-column align-items-center">
                <h3>Are you sure you want to delete this appointment?</h3>
                <div class="d-flex justify-content-evenly col-12">
                    <button id="confirm-del" type="button" class="custom-btn danger-btn fs-5 my-2">Confirm Delete</button>
                    <button id="cancel-del" type="button" class="custom-btn fs-5 my-2">Cancel</button>
                </div>
            </div>
            `);

            $('#confirm-del').on('click', deleteAppt);
            $('#cancel-del').on('click', () => setDeleting(false));
        }
        else {
            $('#set-complete').show();
            $('#enable-edit').show();
            $('#enable-delete').show();
            $('#deleting-container').remove();
        }
    }

    function toggleDetails(appt) {
        if (calModalState.apptDetails === appt) {
            clearStates();
            calModalState.apptDetails = null;
            $('.appt-details').remove();
        } else {
            $('.appt-details').remove();
            calModalState.apptDetails = appt;
            const time = new Date(appt.DateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const client = calModalState.clients[appt.Id] ? calModalState.clients[appt.Id] : null;

            $(`#appt-card-${appt.Id}`).append(`
        <div class='appt-details pt-2 col-12 text-center fade-in'>
            <h2 class="fs-5">Status: <span class="text-purple">${statuses[appt.Status]}</span></h2>
            ${displayService.Id ?
                    `<div>
                <h2 class="fs-5">Class Name: <span class="text-purple">${displayService.Name}</span></h2>
                <h2 class="fs-5">Price: <span class="text-purple">${displayService.Price}</span></h2>
                <h2 class="fs-5">Duration: <span class="text-purple">${displayService.Duration} min</span></h2>
            </div>`
                    : ''
                }
            <h2 class="time fs-5">Time: <span class="text-purple">${time}</span></h2>
            ${client ?
                    `<div class="my-2">
                <h2 class="text-decoration-underline">Client Information</h2>
                <p class="fs-5 m-0 text-purple fw-bold">${client.Name}</p>
                <p class="fs-5 m-0 text-purple fw-bold">${client.Phone.includes('-') ? client.Phone : `${client.Phone.slice(0, 3)} - ${client.Phone.slice(3, 6)} - ${client.Phone.slice(6)}`}</p>
                <p class="fs-5 m-0 text-purple fw-bold">${client.Email}</p>
            </div>`
                    : ''
                }
            ${appt.Status === 1 ?
                    `<div class="d-flex justify-content-evenly my-3">
                <button type="button" id='approve-btn' class="custom-btn success-btn fs-5 col-3">Approve</button>
                <button type="button" id='deny-btn' class="custom-btn danger-btn fs-5 col-3">Deny</button>
            </div>`
                    : ''
                }            
            <div id='default-buttons' class="d-flex flex-wrap justify-content-evenly mt-3 col-12">
            <button id='enable-edit' type="button" class="custom-btn col-12 col-md-3 fs-5 mb-3">Edit</button>
            <button id='enable-delete' type="button" class="custom-btn danger-btn col-12 col-md-3 fs-5 mb-3">Delete</button>
            ${client && appt.Status === 2 ? `<button id='set-complete' type="button" class="custom-btn success-btn col-12 col-md-8 fs-5 mb-3">Set Complete</button>` : ''}
            </div>
        </div>    
        `)

            $('#set-complete').on('click', completeAppt);
            $('#enable-edit').on('click', () => setEditing(true));
            $('#enable-delete').on('click', () => setDeleting(true));
            $('#approve-btn').on('click', approveAppt);
            $('#deny-btn').on('click', denyAppt);
        }
    }

    $('#apptsModalLabel').text(dateDisplay);

    $('#cal-modal-body').append(`
    ${calModalState.appointments.length === 0 ? `<h2 class="fs-5">Add Appointments Below</h2>` : ''}
    ${calModalState.appointments.map((appt, index) => {
        if (appt.Client) {
            calModalState.clients[appt.Id] = appt.Client // Store client info in state
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
                    <h2 class="time fs-5 my-1 col-3">${time}</h2>
                    <h2 class="fs-5 my-1 col-6 text-center">${display}</h2>
                    <h2 class="my-1 col-3"></h2>
                </div>
            </div>
        </div>`
        )
    }).join('')}
 `);

    $('.appt-card-header').on('click', function () {
        const apptId = $(this).attr('id');
        const appt = calModalState.appointments.find(appt => appt.Id === parseInt(apptId));
        toggleDetails(appt)
    }
    );

    $('#adding-btn').off('click').on('click', function () {
        if (!calModalState.addingAppts) {
            setAddingAppts(true)
        }
    });

    $('#apptsModal').on('hidden.bs.modal', function () {
        $('.modal-title').empty();
        $('#cal-modal-body').empty();
        clearStates();
    });
}