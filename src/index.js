const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generatemessage, generateLocationmessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.port || 3000

const publicdirpath = path.join(__dirname, '../public')

app.use(express.static(publicdirpath))

let count = 0

io.on('connection', (socket) => {
    console.log('New connection established!!')

    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.broadcast.to(user.room).emit('chatting', generatemessage('Admin', user.username + ' has joined!!'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
    })
    socket.on('message', (messagetoall, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(messagetoall)) {
            return callback('Warning!! Do not use bad words.')
        }
        io.to(user.room).emit('chatting', generatemessage(user.username, messagetoall))
        callback()
    })

    socket.on('location', (coords, callback2) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationmessage(user.username, 'https://google.com/maps?q=' + coords.latitude + ',' + coords.longitude))
        callback2()
    })

    socket.on('disconnect', () => {

        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('chatting', generatemessage('Admin', user.username + ' has left!!'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }

    })


})

server.listen(port, () => {
    console.log('Server is running on port ' + port)
})