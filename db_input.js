/**
 * Created by LikeJust on 2018-06-06.
 */
const admin = require('firebase-admin');

const serviceAccount = require('./key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// var docRef = db.collection('cu-pbl/');
var docRef = db.collection('cu-stock/');


var fs = require('fs');
var CsvReadableStream = require('csv-reader');

var inputStream = fs.createReadStream('StockData.csv', 'utf8');

inputStream
    .pipe(CsvReadableStream({parseNumbers: true, parseBooleans: true, trim: true}))
    .on('data', (row) => {

        const dataObj = {
            id: row[0],
            stock: row[1]
        };

        docRef.add(dataObj);
        console.log(dataObj);
    })
    .on('end', () => {
        console.log('No more rows!');
    });

/*
 var inputStream = fs.createReadStream('product_data.csv', 'utf8');

 inputStream
 .pipe(CsvReadableStream({parseNumbers: true, parseBooleans: true, trim: true}))
 .on('data', (row) => {

 const data_obj = {
 'category': row[0],
 'sub_category': row[1],
 'id': row[2],
 'name': row[3],
 'price': row[4]
 };

 docRef.add(data_obj);

 console.log(row);
 })
 .on('end', () => {
 console.log('No more rows!');
 });

 */
