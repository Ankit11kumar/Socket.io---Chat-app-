
const socket = io()

const chatform = document.querySelector('#message-form')
const message = chatform.querySelector('input')
const button = chatform.querySelector('#button')
const locbutton = document.querySelector('#location')
const messages = document.querySelector('#messages')
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationmessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })



const autoscroll = () => {
    //New message element
    const $newMessage = messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    console.log(newMessageHeight)
    //visible Height
    const visibleHeight = messages.offsetHeight

    //Height of message container
    const containerHeight = messages.scrollHeight

    //How far i have scrolled
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }

}

socket.on('chatting', (messagetoall) => {
    console.log(messagetoall)
    const html = Mustache.render(messageTemplate, {
        username1: messagetoall.username,
        message: messagetoall.text,
        createdAt: moment(messagetoall.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationmessageTemplate, {
        username: message.username,
        url1: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

chatform.addEventListener('submit', (e) => {
    e.preventDefault()
    button.setAttribute('disabled', 'disabled')
    const data = e.target.elements.input.value
    socket.emit('message', data, error => {

        button.removeAttribute('disabled')
        message.value = ''
        message.focus()

        if (error) {
            return console.log(error)
        }
        console.log('The message was delivered!')
    })
})

locbutton.addEventListener('click', () => {

    locbutton.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation)
        return alert('Geolocation is not supported by your browser.')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            locbutton.removeAttribute('disabled')
            console.log('Location is shared.')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})





