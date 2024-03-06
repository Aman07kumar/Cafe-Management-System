// const express = require('express');
// const connection = require('../connection');
// const router =express.Router();
// let ejs = require('ejs');
// let pdf =require('html-pdf');
// let path = require('path');
// let fs =require('fs');
// let uuid = require('uuid');
// var auth =require('../services/authentication');


// router.post('/generateReport',auth.authenticateToken,(req,res)=>{
//    const generateUuid= uuid.v1();
// //    console.log('Generated UUID:', generateUuid);
//     const orderDetails =req.body;
//     var productDetailsReport =JSON.parse(orderDetails.productDetails);

//     var query ="insert into bill (name,uuid,email,contactNumber,paymentMethod,total,productDetails,createdBy) values(?,?,?,?,?,?,?,?)";
//     connection.query(query,[orderDetails.name,generateUuid,orderDetails.email,orderDetails.contactNumber,orderDetails.paymentMethod,orderDetails.totalAmount,orderDetails.productDetails,res.locals.email],(err,results)=>{
//         if(!err){
//             ejs.renderFile(path.join(__dirname,'',"report.ejs"),{productDetails:productDetailsReport,name:orderDetails.name,email:orderDetails.email,contactNumber:orderDetails.contactNumber,paymentMethod:orderDetails.paymentMethod,totalAmount:orderDetails.totalAmount},(err,results)=>{
//                 if(err){
//                     return  res.status(500).json(err);
//                 }
//                 else {
//                     pdf.create(results).toFile('./generated_pdf/'+generateUuid+".pdf",function(err,data){
//                         if(err){
//                             console.log(err);
//                             return res.status(500).json(err);
//                         }
//                         else {
//                             return res.status(200).json({ uuid: generateUuid });
//                         }
//                     })
//                 }
//             })
//         }
//         else {
//             return res.status(500).json(err);
//         }
//     })

// })

// router.post('/getPdf',auth.authenticateToken,function(req,res){
//     const orderDetails=req.body;
//     const pdfpath = './generated_pdf/'+orderDetails.uuid+'.pdf';
//     if(fs.existsSync(pdfpath)){
//         res.contentType("application/pdf")
//         fs.createReadStream(pdfpath).pipe(res);
//     }
//     else {
//         var productDetailsReport =JSON.parse(orderDetails.productDetails);
//         ejs.renderFile(path.join(__dirname,'',"report.ejs"),{productDetails:productDetailsReport,name:orderDetails.name,email:orderDetails.email,contactNumber:orderDetails.contactNumber,paymentMethod:orderDetails.paymentMethod,totalAmount:orderDetails.totalAmount},(err,results)=>{
//             if(err){
//                 return  res.status(500).json(err);
//             }
//             else {
//                 pdf.create(results).toFile('./generated_pdf/'+ orderDetails.uuid+".pdf",function(err,data){
//                     if(err){
//                         console.log(err);
//                         return res.status(500).json(err);
//                     }
//                     else {
//                         res.contentType("application/pdf")
//                         fs.createReadStream(pdfpath).pipe(res);
//                     }
//                 })
//             }
//         })
//     }
// })


// router.get('getBills',auth.authenticateToken,(req,res,next) => {
//     var query ="select * from bill order by id DESC";
//     connection.query(query,(err,results)=> {
//         if(!err){
//             return res.status(200).json(results);
//         }
//         else {
//             return res.status(500).json(err);
//         }
//     })
// })


// router.delete('/delete/:id',auth.authenticateToken,(req,res,next)=>{
//     const id =req.params.id;
//     var query = "delete from bill where id=?";
//     connection.query(query,[id],(err,results)=>{
//         if(!err){
//             if(results.affectedRows == 0 ){
//                 return res.status(404).json({message:"Bill id does not found"});
//             }
//             return res.status(200).json({message:"Bill Deleted Sucessfully"});
//         }
//         else {
//             return res.status(500).json(err);
//         }
//     })
// })
// module.exports = router;
const express = require('express');
const connection = require('../connection');
const router = express.Router();
const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const auth = require('../services/authentication');

router.post('/generateReport', auth.authenticateToken, (req, res) => {
    const generateUuid = uuid.v1();
    const orderDetails = req.body;
    const productDetailsReport = JSON.parse(orderDetails.productDetails);

    const query = "INSERT INTO bill (name, uuid, email, contactNumber, paymentMethod, total, productDetails, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
        orderDetails.name,
        generateUuid,
        orderDetails.email,
        orderDetails.contactNumber,
        orderDetails.paymentMethod,
        orderDetails.totalAmount,
        orderDetails.productDetails,
        res.locals.email
    ];

    connection.query(query, values, (err, results) => {
        if (err) {
            console.error("Error inserting bill:", err);
            return res.status(500).json({ error: "Failed to generate report" });
        }

        const templateData = {
            productDetails: productDetailsReport,
            name: orderDetails.name,
            email: orderDetails.email,
            contactNumber: orderDetails.contactNumber,
            paymentMethod: orderDetails.paymentMethod,
            totalAmount: orderDetails.totalAmount
        };

        ejs.renderFile(path.join(__dirname, '', "report.ejs"), templateData, (err, html) => {
            if (err) {
                console.error("Error rendering EJS template:", err);
                return res.status(500).json({ error: "Failed to generate report" });
            }

            pdf.create(html).toFile(`./generated_pdf/${generateUuid}.pdf`, (err, data) => {
                if (err) {
                    console.error("Error creating PDF:", err);
                    return res.status(500).json({ error: "Failed to generate report" });
                }

                res.status(200).json({ uuid: generateUuid });
            });
        });
    });
});

router.post('/getPdf', auth.authenticateToken, (req, res) => {
    const orderDetails = req.body;
    const pdfpath = `./generated_pdf/${orderDetails.uuid}.pdf`;

    if (fs.existsSync(pdfpath)) {
        res.contentType("application/pdf");
        fs.createReadStream(pdfpath).pipe(res);
    } else {
        res.status(404).json({ error: "PDF not found" });
    }
});

router.get('/getBills', auth.authenticateToken, (req, res) => {
    const query = "SELECT * FROM bill ORDER BY id DESC";

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching bills:", err);
            return res.status(500).json({ error: "Failed to fetch bills" });
        }
        res.status(200).json(results);
    });
});

router.delete('/delete/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;
    const query = "DELETE FROM bill WHERE id = ?";
    
    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error("Error deleting bill:", err);
            return res.status(500).json({ error: "Failed to delete bill" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Bill ID not found" });
        }
        res.status(200).json({ message: "Bill deleted successfully" });
    });
});

module.exports = router;
