import auth from './auth.js';

export function renderNewApptsModal(refetch, services, months, currentDate, currentMonth, currentYear, setLoading, setError, removeError) {

    const token = auth.getToken();
    const adminId = localStorage.getItem('admin_id');
    const publicServices = services.filter(service => service.Private === false);
    const initialService = publicServices.length > 0 ? publicServices[0] : null;
    const initialServiceId = initialService ? initialService.Id : 0;

    const days = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const minutes = ['00', '15', '30', '45'];
    const getYears = () => {
        let years = [];
        for (let i = currentYear; i < (currentYear + 10); i++) {
            years.push(i);
        }
        return years;
    }
    const years = getYears();

    const newApptsState = {
        dates: [],
        newHourDisplay: '12',
        newMinute: '00',
        newMeridiem: 'AM',
        startDate: currentDate,
        startMonth: months[currentMonth - 1],
        startYear: currentYear,
        endDate: currentDate,
        endMonth: months[currentMonth - 1],
        endYear: currentYear,
        newApptStatus: 0,
        newApptTypeId: 0,
        checkedDays: [],
    }

    useEffect(() => {
        const daysInMonth = new Date(startYear, months.indexOf(startMonth) + 1, 0).getDate();
        let dates = [];
        for (let i = 1; i <= daysInMonth; i++) {
            dates.push(i);
        }
        setDates(dates);
    }, [startMonth, startYear]);

    useEffect(() => {
        if (newApptStatus === 4) {
            setNewApptTypeId(initialServiceId);
        }
    }, [newApptStatus]);

    const clearStates = () => {
        setnewHourDisplay('12');
        setNewMinute('00');
        setStartDate(currentDate);
        setStartMonth(months[currentMonth - 1]);
        setStartYear(currentYear);
        setEndDate(currentDate);
        setEndMonth(months[currentMonth - 1]);
        setEndYear(currentYear);
        setNewApptStatus(0);
        setNewApptTypeId(0);
        setCheckedDays([]);
    };

    const handleCheckedDay = (e) => {
        const day = e.target.id;
        if (e.target.checked) {
            setCheckedDays([...checkedDays, day]);
        }
        if (!e.target.checked) {
            const newCheckedDays = checkedDays.filter(checkedDay => checkedDay !== day);
            setCheckedDays(newCheckedDays);
        }
    };

    const createAppts = async () => {
        setLoading(true);
        setError('');
        // "DateTime": "2024-04-28 14:00:00"
        const selectedDays = checkedDays;
        let hour = newMeridiem === 'PM' && newHourDisplay !== '12' ? parseInt(newHourDisplay) + 12 : parseInt(newHourDisplay);
        hour = hour === 12 && newMeridiem === 'AM' ? '00' : hour;
        const minute = parseInt(newMinute);
        const startDateTime = new Date(startYear, months.indexOf(startMonth), startDate, hour, minute);
        const endDateTime = new Date(endYear, months.indexOf(endMonth), endDate, hour, minute);

        const createApptArray = () => {
            const appts = [];
            selectedDays.forEach(day => {
                let date = startDateTime;
                while (date <= endDateTime) {
                    if (date.getDay() === days.indexOf(day) + 1) {
                        const newAppt = {
                            AdminId: adminId,
                            DateTime: `${date.toISOString().slice(0, 10)}T${hour}:${newMinute}:00`,
                            ApptTypeId: newApptStatus === 0 ? null : newApptTypeId,
                            Status: newApptStatus
                        }
                        appts.push(newAppt);
                    }
                    date = new Date(date.getTime() + 24 * 60 * 60 * 1000); // increases date by 1 day
                }
            });
            return appts;
        }
        const apptsToAdd = createApptArray();

        try {
            const response = await fetch(`http://localhost:5062/api/newAppts/`, {
                method: 'POST',
                body: JSON.stringify(apptsToAdd),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                setLoading(false);
                clearStates();
                refetch();
            }
            if (!response.ok) {
                setLoading(false);
                const error = await response.json();
                setError(error);
            }
        }
        catch (error) {
            console.error(error);
            setLoading(false);
            setError('An error occurred while making request. Please try again later.');
        }
    };
}