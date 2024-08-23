import auth from "../utils/auth";

const token = auth.getToken()

const [services, setServices] = useState([]);
const [clients, setClients] = useState([]); // All clients
const [displayedClients, setDisplayedClients] = useState([]); // Changes with search input
const [displayedAppt, setDisplayedAppt] = useState({});
const [displayDate, setDisplayDate] = useState(0);
const [displayMonth, setDisplayMonth] = useState(0);
const [displayYear, setDisplayYear] = useState(0);
const [displayedService, setDisplayedService] = useState({});
const [displayedPastAppts, setDisplayedPastAppts] = useState([]);
const [displayClient, setDisplayClient] = useState(0);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [successMessage, setSuccessMessage] = useState('');

const getServices = async () => {
    const services = await auth.getServices();
    if (typeof services === 'string') { setError(services); return; }
    setServices(services);
}

useEffect(() => {
    getServices();
}, []);

const getService = async (appt) => {
    const service = services.find(service => service.Id === appt.ApptTypeId);
    setDisplayedService(service);
}

const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
        const response = await fetch('http://localhost:5062/api/clients', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) { setClients(data); setDisplayedClients(data) }
        if (!response.ok) { setError(data) }
        setLoading(false);
    } catch (error) {
        console.error(error);
        setLoading(false);
        setError('An error occurred while making request. Please try again later.');
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
            setSuccessMessage('Balance cleared')
            setTimeout(() => {
                setSuccessMessage('');
            }, 2000);
        }
        if (!response.ok) { setError('Failed to clear balance') }
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
    if (clientId === displayClient) {
        setDisplayedPastAppts([]);
        setDisplayClient(0);
    }
    else {
        setDisplayedPastAppts(pastAppts);
        setDisplayClient(clientId);
    }
}

const handleSearchChange = (e) => {
    const search = e.target.value;
    if (search === '') {
        setDisplayedClients(clients);
        return;
    }
    const filteredClients = clients.filter((client) => {
        return client.Client.Name.toLowerCase().includes(search.toLowerCase()) || client.Client.Email.toLowerCase().includes(search.toLowerCase()) || client.Client.Phone.includes(search);
    });
    setDisplayedClients(filteredClients);
}

const setModalStates = (appt) => {
    setDisplayedAppt(appt);
    getService(appt);
    const date = new Date(appt.DateTime);
    setDisplayDate(date.getDate());
    setDisplayMonth(date.getMonth() + 1);
    setDisplayYear(date.getFullYear());
}