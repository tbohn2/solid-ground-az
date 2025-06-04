$('#contactForm').submit(async function (e) {
    e.preventDefault();
    $('#contactForm').append(`<div class='loading text-center'><img class='spinning' src="./assets/flower.svg" alt="flower-logo"></div>`)
    $('#form-btn').hide();

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
        const response = await fetch('/api/sendEmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(email)
        })
        if (response.ok) {
            $('#contactForm').before(`<div class="alert alert-success text-center mt-2" role="alert">Thank you for your request! Expect a response within 24 hours</div>`);
            $('.loading').remove();
        }
        else {
            $('#form-btn').show();
            $('.loading').remove();
            $('#contactForm').before(`<div class="alert alert-danger text-center mt-2">An error occured. Please try again later.</div>`);
        }
    } catch (error) {
        console.error('Error:', error);
        $('#form-btn').show();
        $('.loading').remove();
        $('#contactForm').before(`<div class="alert alert-danger text-center mt-2">An error occured. Please try again later.</div>`);
    }
});