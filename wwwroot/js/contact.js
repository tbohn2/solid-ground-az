$('#option3').attr('checked', true);

$('#contactForm').submit(async function (e) {
    e.preventDefault();
    $('#form-btn').empty();
    $('#form-btn').append(`<div class="spinner-border" role="status"></div>`)

    let fName = $('#firstname').val();
    let lName = $('#lastname').val();
    let emailAddress = $('#email').val();
    let message = $('#message').val();

    const email = {
        FirstName: fName,
        LastName: lName,
        EmailAddress: emailAddress,
        Message: message
    }

    try {
        const response = await fetch('https://tbohn2-001-site1.ctempurl.com/api/sendEmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(email)
        })
        if (response.ok) {
            $('#form-btn').remove();
            $('#contactForm').before(`<div class="alert alert-info text-center mt-2" role="alert">Thank you for your request! Expect a response within 24 hours</div>`);
        }
        else {
            $('#form-btn').empty();
            $('#form-btn').text("Submit");
            $('#contactForm').before(`<div class="fs-3 m-1 text-center">An error occured. Please try again later.</div>`);
        }
    } catch (error) {
        console.error('Error:', error);
        $('#form-btn').empty();
        $('#form-btn').text("Submit");
        $('#contactForm').before(`<div class="fs-3 m-1 text-center">An error occured. Please try again later.</div>`);
    }
});