$(document).ready(function () {
    $('input[name="navOptions"]').change(
        function () {
            var pageToLoad = $(this).val();
            window.location.assign(pageToLoad);
        });
});

async function getServices() {
    try {
        // const response = await fetch(`https://tbohn2-001-site1.ctempurl.com/api/services`);
        const response = await fetch(`http://localhost:5062/api/services`);
        if (response.ok) {
            const services = await response.json();
            return services;
        } else {
            // Need to display an error message to the user
            console.error('Server request failed');
            return [];
        }
    } catch (error) {
        // Need to display an error message to the user
        console.error(error);
        return [];
    }
};

const privateServices = await getServices();
export { privateServices };