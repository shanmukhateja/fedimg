import express from 'express';
import cors from 'cors';

// SERVER VARIABLES
const port = 8080;

const app = express();

// MIDDLEWARES
app.use([
    express.json(),
    express.urlencoded({extended: true}),
    cors()
]);

// LISTEN
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})