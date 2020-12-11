let connection_string = 'http://localhost:5000';
let socket = io.connect(connection_string);

socket.on('data-change',(data) => {
    console.log("New data has arrived: ",data);
})