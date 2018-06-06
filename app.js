/**
 * Created by LikeJust on 2018-06-06.
 */
const express = require('express');
const app = express();
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const datetime = require('node-datetime');

const serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
app.use(bodyParser.json());

// 물품 추가 
app.post('/product', (req, res) => {
    const inputBody = req.body;

    const pblRef = db.collection('cu-pbl').doc();
    pblRef.set(inputBody);

    res.send(inputBody);
});

// 물품 리스트
app.get('/product/list', (req, res) => {
    db.collection('cu-pbl/').get().then(qs => {

        const productArr = [];

        qs.forEach(x => {
            productArr.push(x.data())
        });

        res.send(productArr);
    })
});

// 원하는 물품만 확인
app.get('/product/:id', (req, res) => {
    const id = req.params.id;

    db.collection('cu-pbl/').get().then(qs => {

        let myData = {};

        qs.forEach(x => {
            const data = x.data();

            if (String(data['id']) === id) {
                return res.send(data);
            }
        });
    })
});

// 판매
app.post('/sell', (req, res) => {
    const inputBody = req.body;
    const formatTime = datetime.create().format('Y-m-d H:M:S');

    inputBody['date'] = formatTime;

    const newSellRef = db.collection('cu-sell').doc();

    newSellRef.set(inputBody);

    res.send(inputBody);
});

// 서버 시작
// 8000: develop
// 3000: master
app.listen(8000, () => {
    console.log('server');
});