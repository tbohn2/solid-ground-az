let mobile = window.innerWidth < 768 ? true : false;

$('#overlay').on('click', function () {
    $('.displayDescription.show').removeClass('show');
    $('.displayRollModel.show').removeClass('show');
    $('#overlay').removeClass('show');
    $('.serviceDescription.text-decoration-underline').removeClass('text-decoration-underline');
});

window.addEventListener('resize', () => {
    let isMobile = window.innerWidth < 768 ? true : false;
    if (isMobile !== mobile) {
        mobile = isMobile;
    }
});