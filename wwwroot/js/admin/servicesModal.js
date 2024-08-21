export function renderServicesModal(services, getServices) {
    const token = auth.getToken();
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
        setServiceDetails({
            ...serviceDetails,
            [name]: value
        });
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

    function renderForm() {
        $('#services-container').hide();

        $('#modal-body').append(`
              <form id='service-form' class='col-9 d-flex flex-column align-items-center fade-in' onSubmit=${(e) => handleSubmit(e)}>
                <div class="col-12 my-1">
                    <label>Name:</label>
                    <input type='text' class="col-12" name='Name' value=${serviceDetails.Name} onChange=${handleInputChange} required></input>
                </div>
                ${serviceDetails.ImgURL ? `<img id='service-photo' class='col-6 my-1 rounded' src=${serviceDetails.ImgURL} alt="servicePhoto" />` : ''}
                <label>Change Image:</label>
                <select name='ImgURL' class='col-12 text-center custom-btn my-1' value=${serviceDetails.ImgURL} onChange=${handleInputChange}>
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
                <select name='Private' class='col-12 text-center custom-btn my-1' value=${serviceDetails.Private} onChange=${handleInputChange}>
                    <option value=${false}>Public</option>
                    <option value=${true}>Private</option>
                </select>
                <div class='col-12 d-flex my-1'>
                    <label>Price: $</label>
                    <input class='col-2 text-center mx-1' type='number' name='Price' value=${serviceDetails.Price} onChange=${handleInputChange} required></input>
                </div>
                <div class='col-12 d-flex my-1'>
                    <label>Duration:</label>
                    <input class='col-2 text-center mx-1' type='number' name='Duration' value=${serviceDetails.Duration} onChange=${handleInputChange} required></input>
                    <label>min</label>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Location Name (Optional):</label>
                    <input type='text' class="col-12" name='LocationName' value=${serviceDetails.LocationName} onChange=${handleInputChange}></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Address (Optional):</label>
                    <input type='text' class="col-12" name='LocationAddress' value=${serviceDetails.LocationAddress} onChange=${handleInputChange}></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Brief Description:</label>
                    <input type='text' class="col-12" name='ShortDescription' value=${serviceDetails.ShortDescription} onChange=${handleInputChange} required></input>
                </div>
                <div class="col-12 my-1">
                    <label class="col-12">Description:</label>
                    <textarea type='text' class="col-12" name='Description' value=${serviceDetails.Description} onChange=${handleInputChange} required></textarea>
                </div>
                <div class='col-12 text-center my-1'>
                    <button type="submit" class="custom-btn success-btn col-5 fs-5 m-1">Save</button>
                    <button type="button" class="custom-btn col-5 fs-5 m-1" onClick=${clearStates}>Cancel</button>
                </div>
            </form>`);

        $('#service-form').on('submit', (e) => handleSubmit(e));
    }



    $('#servicesModal').on('hidden.bs.modal', function () {
        clearStates();
    });
}