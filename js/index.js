document.querySelector('body > main > .contact > form').addEventListener('submit', async function (e){
    e.preventDefault()

    const form = e.target
    const formData = new FormData(form)
    const resultSpan = document.querySelector('body > main > .contact > form > .result')

    let responseJson = null

    try {
        responseJson = await (await fetch(form.action, {
            method: form.method,
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        })).json()
    } catch (e) {
        console.error('ungültiges JSON')
    }

    resultSpan.style.color = responseJson && responseJson.success ? 'green' : 'red'
    resultSpan.innerText = responseJson && responseJson.message ? responseJson.message : 'Fehler bei der Anfrage'

    setTimeout(function () {
        resultSpan.innerText = ''
    }, 5000)
})