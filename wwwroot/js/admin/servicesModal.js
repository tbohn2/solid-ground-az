import auth from "./auth.js";

export function renderServicesModal(services) {
    const token = auth.getToken();
    const getServices = auth.getServices();
    const adminId = localStorage.getItem('admin_id');

    const initialFormState = {
        Id: 0,
        Name: '',
        Price: 0,
        Duration: 0,
        ShortDescription: '',
        Description: '',
        Private: false,
        LocationName: '',
        LocationAddress: '',
        ImgURL: ''
    };

    const servicesState = {
        addingService: false,
        editingService: false,
        displayServiceForm: false,
        deletingService: false,
        serviceDetails: initialFormState,
    }

    function setLoading(loading) {
        if (loading) {
            $('#modal-body').append(`<div class="spinner-border" role="status"></div>`);
        }
        else {
            $('.spinner-border').remove();
        }
    }

    function displayError(error) {
        $('#modal-body').append(`<div class="alert alert-danger mx-2 my-0 p-2">${error}</div>`);
    }

    function removeError() {
        $('.alert').remove();
    }

    function handleInputChange(e) {
        let { name, value } = e.target;
        if (name === 'Private') value === 'true' ? value = true : value = false;
        servicesState.serviceDetails = { ...serviceDetails, [name]: value };
    };

    function clearStates() {
        servicesState.serviceDetails = initialFormState;
        servicesState.addingService = false;
        servicesState.editingService = false;
        servicesState.displayServiceForm = false;
        servicesState.deletingService = false;
        setLoading(false);
        removeError();
    }

    function toggleDetails(service) {
        if (serviceDetails.Id === service.Id) {
            setServiceDetails({});
        } else {
            setServiceDetails(service);
        }
    }

    function toggleServiceForm(e) {
        e.preventDefault();
        if (e.target.value === 'add') { setAddingService(true); setEditingService(false) };
        if (e.target.value === 'edit') { setEditingService(true); setAddingService(false) };
        if (displayServiceForm) { setServiceDetails(initialFormState) };
        setDisplayServiceForm(!displayServiceForm);
    }

    function toggleDeleteService() {
        setDeletingService(!deletingService);
    }

    async function addNewApptType() {
        removeError();
        setAddingService(false);
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5062/api/newApptType/`, {
                method: 'POST',
                body: JSON.stringify(serviceDetails),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                clearStates();
                localStorage.removeItem('services');
                getServices();
            }
            if (!response.ok) {
                setLoading(false);
                displayError('Server request failed');
                console.error('Server request failed');
            }
        } catch (error) {
            setLoading(false);
            displayError('Server request failed');
            console.error(error);
        }
    }

    async function saveEdit() {
        removeError();
        setEditingService(false);
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5062/api/editApptType/`, {
                method: 'PUT',
                body: JSON.stringify(serviceDetails),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                clearStates();
                localStorage.removeItem('services');
                getServices();
            }
            if (!response.ok) {
                setLoading(false);
                displayError('Server request failed');
                console.error('Server request failed');
            }
        } catch (error) {
            setLoading(false);
            displayError('Server request failed');
            console.error(error);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (addingService) {
            addNewApptType();
        }
        if (editingService) {
            saveEdit();
        }
    }

    async function deleteService() {
        removeError();
        setDeletingService(false);
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5062/api/deleteApptType/`, {
                method: 'DELETE',
                body: JSON.stringify(serviceDetails),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setLoading(false);
                localStorage.removeItem('services');
                getServices();
            }
            if (!response.ok) {
                setLoading(false);
                displayError('Server request failed');
                console.error('Server request failed');
            }
        } catch (error) {
            setLoading(false);
            displayError('Server request failed');
            console.error(error);
        }
    }

    function renderEditForm() {
        $('#services-container').hide();

        $('#modal-body').append(`
              <form id='service-form' class='col-9 d-flex flex-column align-items-center fade-in'>
                <div class="col-12 my-1">
                    <label>Name:</label>
                    <input type='text' class="service-form-input col-12" name='Name' required></input>
                </div>
                ${servicesState.serviceDetails.ImgURL ? `<img id='service-photo' class='col-6 my-1 rounded' href=${servicesState.serviceDetails.ImgURL} alt="servicePhoto" />` : ''}
                <label>Change Image:</label>
                <select name='ImgURL' class='service-form-input col-12 text-center custom-btn my-1' >
                    <option value=''>None</option>
                    <option value='~/assets/services1.jpg'>Yoga</option>
                    <option value='~/assets/services2.jpg'>Stretch 1</option>
                    <option value='~/assets/services3.jpg'>Stretch 2</option>
                    <option value='~/assets/services7.jpg'>Stretch 3</option>
                    <option value='~/assets/services4.jpg'>Balls</option>
                    <option value='~/assets/services5.jpg'>Group</option>
                    <option value='~/assets/services6.jpg'>Head Massage</option>
                    <option value='~/assets/services8.jpg'>Equipment</option>
                </select>
                <select name='Private' class='service-form-input col-12 text-center custom-btn my-1'>
                    <option value=${false}>Public</option>
                    <option value=${true}>Private</option>
                </select>
                <div class='col-12 d-flex my-1'>
                    <label>Price: $</label>
                    <input class='service-form-input col-2 text-center mx-1' type='number' name='Price' required></input>
                </div>
                <div class='col-12 d-flex my-1'>
                    <label>Duration:</label>
                    <input class=' service-form-input col-2 text-center mx-1' type='number' name='Duration' required></input>
                    <label>min</label>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Location Name (Optional):</label>
                    <input type='text' class="service-form-input col-12" name='LocationName'></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Address (Optional):</label>
                    <input type='text' class="service-form-input col-12" name='LocationAddress'></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Brief Description:</label>
                    <input type='text' class="service-form-input col-12" name='ShortDescription' required></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Description:</label>
                    <textarea type='text' class="service-form-input col-12" name='Description' required></textarea>
                </div>
                <div class='col-12 text-center my-1'>
                    <button type="submit" class="custom-btn success-btn col-5 fs-5 m-1">Save</button>
                    <button id='close-form' type="button" class="custom-btn col-5 fs-5 m-1">Cancel</button>
                </div>
            </form>`);

        $('#close-form').on('click', clearStates);
        $('.service-form-input').change(handleInputChange);
        $('#service-form').on('submit', (e) => handleSubmit(e));
    }

    function renderDeleteService() {
        const id = servicesState.serviceDetails.Id;

        servicesState.deletingService = true;
        $('#default-services-btns').hide();
        $(`#s-container-${id}`).append(`
            <div id='delete-services-btns' class='col-12 fw-bold text-center'>
                <p>Are you sure you want to delete this service?</p>
                <button id='confirm-service-del' type="button" class="custom-btn danger-btn col-5 fs-5 m-1" onClick=${deleteService}>Yes</button>
                <button id='cancel-service-del' type="button" class="custom-btn col-5 fs-5 m-1" onClick=${toggleDeleteService}>Cancel</button>
            </div>
        `);

        $('#confirm-service-del').on('click', deleteService);
        $('#cancel-service-del').on('click', function () {
            servicesState.deletingService = false;
            $('#delete-services-btns').remove();
            $('#default-services-btns').show();
        });
    }

    function displayServiceDetails() {
        const service = servicesState.serviceDetails;
        const id = service.Id;

        $(`#s-container-${id}`).append(`  
            <div class="service-details my-1 col-12 d-flex flex-wrap justify-content-center fade-in">
                <div class="col-12 text-center bg-purple text-white">${service.Private ? 'Private' : 'Public'}</div>
                <div class="col-12">Price: <span class="text-purple">$${service.Price}</span></div>
                <div class="col-12">Duration: <span class="text-purple">${service.Duration}min</span></div>
                ${service.LocationName ? `<div class="col-12">Location:</div>` : ''}
                ${service.LocationName ? `<div class="col-12 text-purple">${service.LocationName}</div>` : ''}
                ${service.LocationAddress ? `<div class="col-12">Address:</div>` : ''}
                ${service.LocationAddress ? `<div class="col-12 text-purple">${service.LocationAddress}</div>` : ''}
                <div class="col-12">Brief Description:</div>
                <div class="col-12 text-purple">${service.ShortDescription}</div>
                <div class="col-12">Description:</div>
                <div class="col-12 text-purple">${service.Description}</div>
                <div id='default-services-btns' class='col-12 text-center'>
                    <button id='toggle-edit' type="button" class="custom-btn col-5 fs-5 m-1" value='edit'>Edit</button>
                    <button id='toggle-delete' type="button" class="custom-btn danger-btn col-5 fs-5 m-1">Delete</button>
                </div>
            </div>`);

        $('#toggle-edit').on('click', renderEditForm);
        $('#toggle-delete').on('click', renderDeleteService);
    }

    function renderServices() {
        $('#services-container').append(`
            ${services.map((service, index) =>
            `<div id=${`s-container-${service.Id}`} class="d-flex flex-wrap justify-content-between border-darkgray rounded my-2 px-1 fs-4 col-8">
                <div id=${service.Id} class="service-button col-12 text-center">${service.Name}</div>                        
            </div>`).join('')}
            `);

        $('.service-button').on('click', function () {
            servicesState.serviceDetails = services.find(service => service.Id === parseInt(this.id));
            displayServiceDetails();
        });
    }

    renderServices();

    $('#servicesModal').on('hidden.bs.modal', function () {
        clearStates();
    });
}