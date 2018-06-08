/**
 * Created by LikeJust on 2018-06-06.
 */
const express = require('express');
const app = express();
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const datetime = require('node-datetime');
const morgan = require('morgan');

morgan('tiny');
app.use(bodyParser.json());
app.use(morgan('combined'));

const serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// 재고 관리
app.post('/stock', (req, res) => {
    const inpuBody = req.body;
    const calcFlag = req.query['flag'];

    console.log(calcFlag);

    const pblRef = db.collection('cu-stock');

    inpuBody.forEach(item => {
        const docRef = pblRef.doc(`stock${item['id']}`);

        docRef.get().then(x => {
            const prevData = x.data();

            if (calcFlag === 'sell') {
                prevData['stock'] -= item['stock'];
            } else {
                prevData['stock'] += item['stock'];
            }

            docRef.update({
                'stock': prevData['stock']
            })
        });

    });

    return res.send(inpuBody);
});

// 물품 추가 
app.post('/product', (req, res) => {
    const inputBody = req.body;
    const productID = inputBody['id'];

    const pblRef = db.collection('test-product').doc(`product${productID}`);
    pblRef.set(inputBody);

    res.send(inputBody);
});

// 물품 리스트
app.get('/product/list', (req, res) => {
    db.collection('cu-product/').get().then(qs => {

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

    db.collection('cu-product/').doc(`product${id}`).get().then(x => {
        const data = x.data();
        return res.send(data);
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

app.post('/login', (req, res) => {
    const inputBody = req.body;

    let loginFlag = false;

    db.collection('test-login').doc(inputBody['id']).get().then(x => {
        
        if (x.data() == undefined) {
            return res.send({
                flag: loginFlag
            });
        }

        const dbPW = x.data()['passwd'];

        if (dbPW == inputBody['passwd']) {
            loginFlag = true;
            console.log(inputBody['id'], loginFlag);
        }

        return res.send({
            flag: loginFlag
        });
    });
});

// 서버 시작
// 8000: develop
// 3000: master
app.listen(8000, () => {
    console.log('server');
});