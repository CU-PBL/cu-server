/**
 * Created by LikeJust on 2018-06-06.
 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');

const crypto = require('crypto');
const secret = 'cu';

const admin = require('firebase-admin');

const datetime = require('node-datetime');

var CsvReadableStream = require('csv-reader');

var fs = require('fs');
var inputStream = fs.createReadStream('product_data.csv', 'utf8');

const DDataObj = {};

inputStream
    .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', (row) => {

        const data_obj = {
            'category': row[0],
            'sub_category': row[1],
            'id': row[2],
            'name': row[3],
            'price': row[4]
        };

        DDataObj[row[2]] = data_obj;
    })
    .on('end', () => {
        console.log('data load!!')
    });

morgan('tiny');
app.use(bodyParser.json());
app.use(morgan('combined'));

const serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post('/refund', (req, res) => {
    const reqHash = req.body['hash'];
    
    db.collection('cu-sale-stock').doc(reqHash).get().then(x => {
        const stockArr = x.data()['data'];       
        
        stockArr.forEach((item, idx) => {
            const stockRef = db.collection('cu-stock').doc(`stock${item['id']}`);
            
            stockRef.get().then(stockData => {
                const prevData = stockData.data();
                prevData['stock'] += item['stock'];
                
                stockRef.set(prevData);    
            })     
            
            if(idx == stockArr.length - 1){
                db.collection('cu-sale-stock').doc(reqHash).delete();
                db.collection('cu-sell').doc(reqHash).delete();
                
                return res.send(reqHash);
            }
        });
    });
});

// 재고 관리
app.post('/stock', (req, res) => {
    const inpuBody = req.body;
    const calcFlag = req.query['flag'];

    const pblRef = db.collection('cu-stock');
    let sum = 0;

    inpuBody.forEach(item => {
        sum += DDataObj[item['id']]['price'] * item['stock']
    });

    inpuBody.forEach((item, idx, arr) => {
        console.log(DDataObj[item['id']]['name']);
        item['name'] = DDataObj[item['id']]['name'];
    });

    inpuBody.forEach((item, idx, arr) => {
        const docRef = pblRef.doc(`stock${item['id']}`);

        docRef.get().then(x => {
            const prevData = x.data();

            if (calcFlag === 'sell') {
                prevData['stock'] -= item['stock'];

                if (arr.length - 1 == idx) {
                    db.collection('cu-sale-stock').doc(`${sum}`).set({
                        data: inpuBody
                    });
                }
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

// 재고 리스트 
app.get('/stock/list', (req, res) => {
    db.collection('cu-stock').get().then(qs => {
        const stockObj = {}

        qs.forEach(x => {
            const temp = x.data()
            stockObj[temp['id']] = temp['stock']
        })

        db.collection('cu-product').get().then(qq => {
            const stockArr = [];

            qq.forEach(xx => {
                const xTemp = xx.data()
                xTemp['stock'] = stockObj[xTemp['id']]
                stockArr.push(xTemp);
            });

            stockArr.sort((a, b) => {
                return a['id'] - b['id'];
            })

            return res.send(stockArr);
        });

    });
});

// 물품 항목 추가 
app.post('/product', (req, res) => {
    const inputBody = req.body;
    const productID = inputBody['id'];

    const pblRef = db.collection('cu-product').doc(`product${productID}`);
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

// 판매 내역 상세 보기 
app.get('/sell/list/:hash', (req, res) => {
    const docHash = req.params['hash'];

    db.collection('cu-sale-stock').doc(docHash).get().then(x => {
        return res.send(x.data()['data']);
    });
});

app.get('/sell/list', (req, res) => {
    db.collection('cu-sell').get().then(qs => {
        const sellArr = []

        qs.forEach(x => {
            sellArr.push(x.data());
        });
        
        sellArr.sort((a, b) => {
            return new Date(b['date']) - new Date(a['date']);
        });

        return res.send(sellArr);
    });
});

// 판매
app.post('/sell', (req, res) => {
    const inputBody = req.body;
    const formatTime = datetime.create().format('Y-m-d H:M:S');

    inputBody['date'] = formatTime;

    const sumHash = crypto
        .createHmac('sha256', secret)
        .update(String(inputBody['sum']))
        .digest('hex');

    inputBody['hash'] = sumHash;

    const newSellRef = db
        .collection('cu-sell')
        .doc(sumHash)
        .set(inputBody);

    const saleDb = db.collection('cu-sale-stock');

    saleDb.doc(String(inputBody['sum'])).get().then(x => {
        const prevData = x.data();
        saleDb.doc(String(inputBody['sum'])).delete();
        saleDb.doc(sumHash).set(prevData);

        return res.send(inputBody);
    });
});

// 로그인 기능 
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
    fs.readFile('start.txt', 'utf-8', (err, data) => {
        console.log(data);
    })
});
