export function renderNewApptsModal(refetch, services, months, currentDate, currentMonth, currentYear, setLoading, setError, removeError) {

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
        startDates: [],
        endDates: [],
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

    function clearStates() {
        newApptsState.startDates = [];
        newApptsState.endDates = [];
        newApptsState.newHourDisplay = '12';
        newApptsState.newMinute = '00';
        newApptsState.newMeridiem = 'AM';
        newApptsState.startDate = currentDate;
        newApptsState.startMonth = months[currentMonth - 1];
        newApptsState.startYear = currentYear;
        newApptsState.endDate = currentDate;
        newApptsState.endMonth = months[currentMonth - 1];
        newApptsState.endYear = currentYear;
        newApptsState.newApptStatus = 0;
        newApptsState.newApptTypeId = 0;
        newApptsState.checkedDays = [];
        $('#day-checks').empty();
        $('#apptType-select').remove();
        $('#newApptStatus').val(0);
        $('#newHourDisplay').val('12');
        $('#newMinute').val('00');
        $('#newMeridiem').val('AM');
        $('#day-checks').find('input').prop('checked', false);
        $('.new-appt-option').remove();
    };

    function handleCheckedDay(e) {
        const day = e.target.id;
        if (e.target.checked) {
            newApptsState.checkedDays = [...newApptsState.checkedDays, day];
        }
        if (!e.target.checked) {
            const newCheckedDays = newApptsState.checkedDays.filter(checkedDay => checkedDay !== day);
            newApptsState.checkedDays = newCheckedDays;
        }
    };

    async function createAppts() {
        setLoading(true);
        removeError();
        // "DateTime": "2024-04-28 14:00:00"
        const selectedDays = newApptsState.checkedDays;
        let hour = newApptsState.newMeridiem === 'PM' && newApptsState.newHourDisplay !== '12' ? parseInt(newApptsState.newHourDisplay) + 12 : parseInt(newApptsState.newHourDisplay);
        hour = hour === 12 && newApptsState.newMeridiem === 'AM' ? '00' : hour;
        const minute = parseInt(newApptsState.newMinute);
        const startDateTime = new Date(newApptsState.startYear, months.indexOf(newApptsState.startMonth), newApptsState.startDate, hour, minute);
        const endDateTime = new Date(newApptsState.endYear, months.indexOf(newApptsState.endMonth), newApptsState.endDate, hour, minute);

        const createApptArray = async () => {
            const appts = [];

            selectedDays.forEach(day => {
                let date = startDateTime;
                const indexOfDay = days.indexOf(day) + 1 === 7 ? 0 : days.indexOf(day) + 1;

                while (date <= endDateTime) {
                    if (date.getDay() === indexOfDay) {
                        const localDate = date.getFullYear() + '-' +
                            String(date.getMonth() + 1).padStart(2, '0') + '-' +
                            String(date.getDate()).padStart(2, '0');

                        const newAppt = {
                            AdminId: adminId,
                            DateTime: `${localDate} ${hour}:${newApptsState.newMinute}:00`,
                            ApptTypeId: newApptsState.newApptStatus === 0 ? null : newApptsState.newApptTypeId,
                            Status: parseInt(newApptsState.newApptStatus)
                        }
                        appts.push(newAppt);
                    }
                    date = new Date(date.getTime() + 24 * 60 * 60 * 1000); // increases date by 1 day
                }
            });
            return appts;
        }
        const apptsToAdd = await createApptArray();

        try {
            const response = await fetch(`/api/newAppts/`, {
                method: 'POST',
                body: JSON.stringify(apptsToAdd),
                headers: { 'Content-Type': 'application/json' },
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

    $('#day-checks').append(
        days.map(day =>
            `<div key=${day}>
                <input type="checkbox" class="day-checkbox" id=${day} ${newApptsState.checkedDays.includes(day) ? "checked" : ""}/>
                <label class="d-flex justify-content-center align-items-center" for=${day}>${day}</label>
            </div>`
        ).join('')
    )

    $('.day-checkbox').change((e) => handleCheckedDay(e));

    function appendSelectOptions(selectId, options, currentState) {
        $(selectId).append(
            options.map((option, index) =>
                `<option key=${index} class="new-appt-option" value=${option} ${option == currentState ? "selected" : ""}>${option}</option>`
            ).join('')
        )
    }

    appendSelectOptions('#newHourDisplay', hours, newApptsState.newHourDisplay);
    appendSelectOptions('#newMinute', minutes, newApptsState.newMinute);

    function renderDateSelects(start, mSelectId, dSelectId, ySelectId) {
        $(mSelectId).empty();
        $(dSelectId).empty();
        $(ySelectId).empty();

        let dates = newApptsState.startDates;
        let monthState = newApptsState.startMonth;
        let dateState = newApptsState.startDate;
        let yearState = newApptsState.startYear;

        if (!start) {
            dates = newApptsState.endDates;
            monthState = newApptsState.endMonth;
            dateState = newApptsState.endDate;
            yearState = newApptsState.endYear;
        }

        appendSelectOptions(mSelectId, months, monthState);
        appendSelectOptions(dSelectId, dates, dateState);
        appendSelectOptions(ySelectId, years, yearState);
    }

    function generateDates(name) {
        let month = newApptsState.startMonth;
        let year = newApptsState.startYear;
        if (name === 'endMonth' || name === 'endYear') {
            month = newApptsState.endMonth;
            year = newApptsState.endYear;
        }

        const daysInMonth = new Date(year, months.indexOf(month) + 1, 0).getDate();
        let dates = [];

        for (let i = 1; i <= daysInMonth; i++) {
            dates.push(i);
        }

        if (name === 'startMonth' || name === 'startYear') {
            newApptsState.startDates = dates;
            renderDateSelects(true, '#startMonth', '#startDate', '#startYear');
        } else if (name === 'endMonth' || name === 'endYear') {
            newApptsState.endDates = dates;
            renderDateSelects(false, '#endMonth', '#endDate', '#endYear');
        }
    };

    renderDateSelects(true, '#startMonth', '#startDate', '#startYear');
    renderDateSelects(false, '#endMonth', '#endDate', '#endYear');

    generateDates('startMonth');
    generateDates('endMonth');

    $('#newApptStatus').off('change').on('change', function () {
        const status = parseInt($(this).val());

        if (status === 4) {
            newApptsState.newApptTypeId = initialServiceId;

            $('#newApptStatus').after(`
                <select id="apptType-select" name="ApptTypeId" class="custom-btn mt-2">
                    ${publicServices.map((service, index) =>
                `<option key=${index} class="new-appt-option" value=${service.Id} ${service.Id === newApptsState.newApptTypeId ? "selected" : ""}>${service.Name}</option>`).join('')}
                </select>`
            );

            $('#status-select').change((e) => handleNewState(e));
        } else {
            $('#apptType-select').remove();
        }
    });

    $('select').change(function handleNewState(e) {
        const name = e.target.id;
        const value = e.target.value;

        newApptsState[name] = value;

        if (name === 'startMonth' || name === 'endMonth' || name === 'startYear' || name === 'endYear') {
            generateDates(name);
        }
    });

    $('#create-appts-btn').off('click').on('click', () => createAppts());

    $('#newApptsModal').on('hidden.bs.modal', function () {
        clearStates();
    });
}