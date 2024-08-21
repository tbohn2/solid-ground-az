function renderServicesModal(services, getServices) {
    const token = auth.getToken();
    const adminId = localStorage.getItem('admin_id');

    const initialFormState = {
        AdminId: adminId,
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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const servicesState = {
        addingService: false,
        editingService: false,
        displayServiceForm: false,
        deletingService: false,
        serviceDetails: initialFormState,
    }


    const handleInputChange = (e) => {
        let { name, value } = e.target;
        if (name === 'Private') value === 'true' ? value = true : value = false;
        setServiceDetails({
            ...serviceDetails,
            [name]: value
        });
    };

    const clearStates = () => {
        setServiceDetails(initialFormState);
        setAddingService(false);
        setEditingService(false);
        setDeletingService(false);
        setDisplayServiceForm(false);
        setLoading(false);
        setError('');
    }

    const toggleDetails = (service) => {
        if (serviceDetails.Id === service.Id) {
            setServiceDetails({});
        } else {
            setServiceDetails(service);
        }
    }

    const toggleServiceForm = (e) => {
        e.preventDefault();
        if (e.target.value === 'add') { setAddingService(true); setEditingService(false) };
        if (e.target.value === 'edit') { setEditingService(true); setAddingService(false) };
        if (displayServiceForm) { setServiceDetails(initialFormState) };
        setDisplayServiceForm(!displayServiceForm);
    }

    const toggleDeleteService = () => {
        setDeletingService(!deletingService);
    }

    const addNewApptType = async () => {
        setError('');
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
                setError('Server request failed');
                console.error('Server request failed');
            }
        } catch (error) {
            setLoading(false);
            setError('Server request failed');
            console.error(error);
        }
    }

    const saveEdit = async () => {
        setError('');
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
                setError('Server request failed');
                console.error('Server request failed');
            }
        } catch (error) {
            setLoading(false);
            setError('Server request failed');
            console.error(error);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (addingService) {
            addNewApptType();
        }
        if (editingService) {
            saveEdit();
        }
    }

    const deleteService = async () => {
        setError('');
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
                setError('Server request failed');
                console.error('Server request failed');
            }
        } catch (error) {
            setLoading(false);
            setError('Server request failed');
            console.error(error);
        }
    }
}