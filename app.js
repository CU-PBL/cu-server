/**
 * Created by LikeJust on 2018-06-06.
 */
const express = require('express');
const app = express();
const admin = require('firebase-admin');

var serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();


app.get('/product/list', (req, res) => {
    db.collection('cu-pbl/').get().then(qs => {

        const productArr = [];

        qs.forEach(x => {
            productArr.push(x.data())
        });

        res.send(
            {
                data: productArr
            }
        );
    })
});

app.get('/product/:id', (req, res) => {
    const id = req.params.id;

    db.collection('cu-pbl/').get().then(qs => {

        let myData = {};

        qs.forEach(x => {
            const data = x.data();

            if (String(data['id']) === id) {
                const para = req.query.para;

                return res.send(data[para]);
            }
        });
    })
});

app.post('/', (req, res) => {

});


app.listen(3000, () => {
    console.log('server');
});