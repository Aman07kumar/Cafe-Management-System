// const express = require('express');
// const connection = require('../connection');
// const router =express.Router();
// var auth = require('../services/authentication');

// router.get('/details',auth.authenticateToken,(req,res,next)=>{
//     var categoryCount;
//     var productCount;
//     var billCount;
//     var query ="select count(id) as categoryCount from category";

//     connection.query(query,(err,results) => {
//         if(!err){
//             categoryCount = results[0].categoryCount;
//         }
//         else {
//             return res.status(500).json(err);
//         }
//     })

//     var query ="select count(id) as productCount from product";
//     connection.query(query,(err,results) => {
//        if(!err){
//             productCount = results[0].productCount;
//        } 
//        else {
//             return res.status(500).json(err);
//        }
//     })
//     var query = "select count(id) as billCount from bill";
//     connection.query(query,(err,results)=>{
//         if(!err){
//             billCount = results[0].billCount;
//             var data ={
//                 category:categoryCount,
//                 product:productCount,
//                 bill:billCount
//             };
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
const auth = require('../services/authentication');

router.get('/details', auth.authenticateToken, async (req, res, next) => {
    try {
        const [categoryCountResult, productCountResult, billCountResult] = await Promise.all([
            executeQuery("SELECT COUNT(id) AS categoryCount FROM category"),
            executeQuery("SELECT COUNT(id) AS productCount FROM product"),
            executeQuery("SELECT COUNT(id) AS billCount FROM bill")
        ]);

        const categoryCount = categoryCountResult[0].categoryCount;
        const productCount = productCountResult[0].productCount;
        const billCount = billCountResult[0].billCount;

        const data = {
            category: categoryCount,
            product: productCount,
            bill: billCount
        };

        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

function executeQuery(query) {
    return new Promise((resolve, reject) => {
        connection.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = router;
