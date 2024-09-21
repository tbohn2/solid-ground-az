import auth from "./auth.js";

export function renderServicesModal(services) {
    const token = auth.getToken();
    const adminId = localStorage.getItem('admin_id');
    const refetchServices = async () => {
        $('#services-container').empty();
        localStorage.removeItem('services');
        return await auth.getServices();
    }

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
        ImgURL: '../assets/services1.jpg',
        AdminId: adminId
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
            $('#service-modal-body').prepend(`
                <div class="text-center col-12">
                    <div class="spinner-border" role="status"></div>
                </div>
            `);
        }
        else {
            $('.spinner-border').remove();
        }
    }

    function displayError(error) {
        $('#service-modal-body').prepend(`
            <div class="text-center col-12">
                <div class="alert alert-danger mx-2 my-0 p-2">${error}</div>
            </div>
        `);
    }

    function removeError() {
        $('.alert').remove();
    }

    function handleInputChange(e) {
        let { name, value } = e.target;
        if (name === 'Private') { value === 'true' ? value = true : value = false };
        if (name === 'ImgURL') { $('#service-photo').attr('src', value) };
        servicesState.serviceDetails = { ...servicesState.serviceDetails, [name]: value };
    };

    function clearStates() {
        servicesState.serviceDetails = initialFormState;
        servicesState.addingService = false;
        servicesState.editingService = false;
        servicesState.displayServiceForm = false;
        servicesState.deletingService = false;
        $('.service-details').remove();
        $('#service-form').remove();
        $('#delete-services-btns').remove();
        setLoading(false);
        removeError();
    }

    async function addNewApptType() {
        $('.service-card').show().addClass('d-flex');
        removeError();
        servicesState.addingService = false;
        setLoading(true);
        try {
            const response = await fetch(`https://solidgroundaz.com/api/newApptType/`, {
                method: 'POST',
                body: JSON.stringify(servicesState.serviceDetails),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                clearStates();
                services = await refetchServices();
                renderServicesModal(services);
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
        setLoading(true);
        try {
            const response = await fetch(`https://solidgroundaz.com/api/editApptType/`, {
                method: 'PUT',
                body: JSON.stringify(servicesState.serviceDetails),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            servicesState.editingService = false;
            if (response.ok) {
                clearStates();
                services = await refetchServices();
                renderServicesModal(services);
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
        if (servicesState.addingService) {
            addNewApptType();
        }
        if (servicesState.editingService) {
            saveEdit();
        }
    }

    async function deleteService() {
        removeError();
        servicesState.deletingService = false;
        setLoading(true);
        try {
            const response = await fetch(`https://solidgroundaz.com/api/deleteApptType/`, {
                method: 'DELETE',
                body: JSON.stringify(servicesState.serviceDetails),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setLoading(false);
                services = await refetchServices();
                renderServicesModal(services);
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

    function renderForm() {
        let parent = '';
        let width
        $('#service-form').remove();
        if (servicesState.editingService) {
            $('.service-details').hide().removeClass('d-flex');
            parent = $(`#s-container-${servicesState.serviceDetails.Id}`);
            width = 'col-12';
        }
        else if (servicesState.addingService) {
            $('.service-card').hide().removeClass('d-flex');
            parent = $('#services-container');
            width = 'col-10';
        }

        const imgURLs = [1, 2, 3, 7, 4, 5, 6, 8].map(num => `../assets/services${num}.jpg`);

        parent.append(`
              <form id='service-form' class='${width} d-flex flex-column align-items-center fade-in'>
                <div class="col-12 my-1">
                    <label>Name:</label>
                    <input type='text' class="service-form-input col-12" name='Name' value='${servicesState.serviceDetails.Name}' required></input>
                </div>
                ${servicesState.serviceDetails.ImgURL ? `<img id='service-photo' class='col-6 my-1 rounded loaded' src='${servicesState.serviceDetails.ImgURL}' alt="servicePhoto" />` : ''}
                <label>Change Image:</label>
                <select name='ImgURL' class='service-form-input col-12 text-center custom-btn my-1'>
                    ${imgURLs.map((url, index) => {
            return `<option value='${url}' ${servicesState.serviceDetails.ImgURL === url ? 'selected' : ''}>Image ${index + 1}</option>`
        }).join('')}                    
                </select>
                <select name='Private' class='service-form-input col-12 text-center custom-btn my-1' value=${servicesState.serviceDetails.Private}>
                    <option value=${false}>Public</option>
                    <option value=${true}>Private</option>
                </select>
                <div class='col-12 d-flex my-1'>
                    <label>Price: $</label>
                    <input class='service-form-input col-2 text-center mx-1' type='number' name='Price' value=${servicesState.serviceDetails.Price} required></input>
                </div>
                <div class='col-12 d-flex my-1'>
                    <label>Duration:</label>
                    <input class=' service-form-input col-2 text-center mx-1' type='number' name='Duration' value=${servicesState.serviceDetails.Duration} required></input>
                    <label>min</label>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Location Name (Optional):</label>
                    <input type='text' class="service-form-input col-12" name='LocationName' value='${servicesState.serviceDetails.LocationName ? servicesState.serviceDetails.LocationName : ''}'></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Address (Optional):</label>
                    <input type='text' class="service-form-input col-12" name='LocationAddress' value='${servicesState.serviceDetails.LocationAddress ? servicesState.serviceDetails.LocationAddress : ''}'></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Brief Description:</label>
                    <input type='text' class="service-form-input col-12" name='ShortDescription' value='${servicesState.serviceDetails.ShortDescription}' required></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Description:</label>
                    <textarea type='text' class="service-form-input col-12" name='Description' required>${servicesState.serviceDetails.Description}</textarea>
                </div>
                <div class='col-12 text-center my-1'>
                    <button type="submit" class="custom-btn success-btn col-5 fs-5 m-1">Save</button>
                    <button id='close-form' type="button" class="custom-btn col-5 fs-5 m-1">Cancel</button>
                </div>
            </form>`);

        $('#close-form').on('click', function () {
            if (servicesState.addingService) {
                $('.service-card').show().addClass('d-flex');
            }
            if (servicesState.editingService) {
                $('.service-details').show().addClass('d-flex');
            }
            servicesState.addingService = false;
            servicesState.editingService = false;
            $('#service-form').remove();
        });
        $('.service-form-input').change(handleInputChange);
        $('#service-form').on('submit', (e) => handleSubmit(e));
    }

    function renderDeleteService() {
        const id = servicesState.serviceDetails.Id;

        servicesState.deletingService = true;
        $('#default-services-btns').hide();
        $(`#s-container-${id}`).append(`
            <div id='delete-services-btns' class='col-12 fw-bold text-center'>
                <p class='text-center'>Are you sure you want to delete this service?</p>
                <button id='confirm-service-del' type="button" class="custom-btn danger-btn col-5 fs-5 m-1">Yes</button>
                <button id='cancel-service-del' type="button" class="custom-btn col-5 fs-5 m-1">Cancel</button>
            </div>
        `);

        $('#confirm-service-del').on('click', deleteService);
        $('#cancel-service-del').on('click', function () {
            servicesState.deletingService = false;
            $('#delete-services-btns').remove();
            $('#default-services-btns').show();
        });
    }

    function displayServiceDetails(service) {
        const newDetails = servicesState.serviceDetails.Id !== service.Id;
        clearStates();
        if (!newDetails) { return; }
        servicesState.serviceDetails = service;
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
                    <button id='toggle-edit' type="button" class="custom-btn col-5 fs-5 m-1">Edit</button>
                    <button id='toggle-delete' type="button" class="custom-btn danger-btn col-5 fs-5 m-1">Delete</button>
                </div>
            </div>`);

        $('#toggle-edit').on('click', () => {
            servicesState.editingService = true
            renderForm()
        });
        $('#toggle-delete').on('click', renderDeleteService);
    }

    function renderServices() {
        $('#services-container').append(`
            ${services.map((service, index) =>
            `<div id=${`s-container-${service.Id}`} class="service-card d-flex flex-wrap justify-content-between border-darkgray rounded my-2 px-1 fs-4 col-sm-8 col-10">
                <div id=${service.Id} class="service-button col-12 text-center">${service.Name}</div>                        
            </div>`).join('')}
            `);

        $('.service-button').on('click', function () {
            const service = services.find(service => service.Id === parseInt(this.id));
            displayServiceDetails(service);
        });
    }

    renderServices();

    $('#toggle-add-service').off('click').on('click', () => {
        servicesState.addingService = true
        renderForm()
    });

    $('#servicesModal').on('hidden.bs.modal', function () {
        $('#services-container').empty();
        clearStates();
    });
}