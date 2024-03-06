const services = [
    {
        name: '1 HOUR PRIVATE YOGA',
        description: 'Move through shapes and postures to benefit you individually',
        price: 50,
        time: 60,
        imageURL: './assets/blueBG.jpg'
    },
    {
        name: '25 MIN ASSISTED STRETCH',
        description: 'Customized assisted stretch',
        price: 20,
        time: 25,
        imageURL: './assets/blueBG.jpg'
    },
    {
        name: '50 MIN ASSISTED STRETCH',
        description: 'Customized assisted stretch',
        price: 40,
        time: 50,
        imageURL: './assets/blueBG.jpg'
    },
    {
        name: 'BLENDED SERVICE',
        description: 'Comnbined assisted stretch, ball rolling, and yoga',
        price: 50,
        time: 60,
        imageURL: './assets/blueBG.jpg'
    },
]

for (let i = 0; i < services.length; i++) {
    const card =
        `<div class="serviceCard my-3 col-5 d-flex">
        <img class="col-5" src="./assets/blueBG.jpg" alt="blue water">
        <div class="col-7 ps-3 d-flex flex-column align-items-start justify-content-between">
            <h4 class="mt-3">${services[i].name}</h4>
            <p>${services[i].description}</p>
            <div class="align-self-end d-flex flex-column align-items-end">
                <p class="pe-3">${services[i].price} | ${services[i].time} min</p>
                <button>Book</button>
            </div>
        </div>
    </div>`
    $('#services').append(card)
}