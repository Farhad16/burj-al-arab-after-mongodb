const express = require('express');
const app = express();
const port = 4200;
const cors = require("cors");
const bodyParser = require('body-parser');
const admin = require("firebase-admin");
require('dotenv').config()

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.neh82.mongodb.net/burjAllArab?retryWrites=true&w=majority`;

console.log(process.env.DB_PASS);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const serviceAccount = require('./burj-ala-arob-firebase-adminsdk-qnpw1-5b375c7104.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://burj-ala-arob.firebaseio.com"
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAllArab").collection("booking");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/bookings', (req, res) => {
        const token = req.headers.authorization;

        if (token && token.startsWith('Bearer ')) {
            const idToken = token.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email
                    if (tokenEmail == queryEmail) {
                        bookings.find({
                            email: queryEmail
                        }).toArray((err, document) => {
                            res.send(document);
                        })
                    }
                    else {
                        res.status(401).send("Unauthorized access")
                    }
                }).catch(function (error) {
                    res.status(401).send("Unauthorized access")
                });
        }
        else {
            res.status(401).send("Unauthorized access")
        }
    })
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})