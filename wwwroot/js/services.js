const services = [
    {
        name: '1 HOUR PRIVATE YOGA',
        description: 'Move through shapes and postures to benefit you individually',
        price: 50,
        time: 60,
        imageURL: './assets/services1.jpg'
    },
    {
        name: '25 MIN ASSISTED STRETCH',
        description: 'Customized assisted stretch',
        price: 20,
        time: 25,
        imageURL: './assets/services2.jpg'
    },
    {
        name: '50 MIN ASSISTED STRETCH',
        description: 'Customized assisted stretch',
        price: 40,
        time: 50,
        imageURL: './assets/services3.jpg'
    },
    {
        name: 'BLENDED SERVICE',
        description: 'Combined assisted stretch, ball rolling, and yoga',
        price: 50,
        time: 60,
        imageURL: './assets/services4.jpg'
    },
]

let screenSize

function checkScreenWidth() {
    var width = window.innerWidth;
    if (width < 768) {
        screenSize = "mobile"
    }
}

checkScreenWidth();

$('#option1').attr('checked', true);

for (let i = 0; i < services.length; i++) {
    let card
    if (screenSize === 'mobile') {
        card = `
        <div class="serviceCard my-3 col-10 d-flex flex-column fade-top">
            <img class="col-12" src="${services[i].imageURL}" alt="yoga">
                <h3 class="mt-3 align-self-center text-center">${services[i].name}</h3>
                <p class="m-2 fs-5 align-self-center">${services[i].description}</p>
                <div class="d-flex align-items-center justify-content-between col-12">
                    <p class="col-8 m-0 text-center">$${services[i].price} | ${services[i].time} min</p>
                    <button class="serviceCard-button col-4">Book</button>
                </div>
        </div>`
    }
    else {
        card = `
        <div class="serviceCard my-3 col-10 col-lg-5 d-flex fade-top">
            <img class="col-5" loading="lazy" src="${services[i].imageURL}" alt="yoga">
            <div class="col-7 d-flex flex-column align-items-start justify-content-between">
                <h3 class="mt-3 align-self-center text-center">${services[i].name}</h3>
                <p class="m-2 fs-5 align-self-center">${services[i].description}</p>
                <div class="d-flex align-items-center justify-content-between col-12">
                    <p class="col-8 m-0 text-center">$${services[i].price} | ${services[i].time} min</p>
                    <button class="serviceCard-button col-4">Book</button>
                </div>
            </div>
        </div>`
    }
    $('#services').append(card)
}

window.addEventListener('resize', checkScreenWidth);