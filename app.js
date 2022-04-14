const express = require("express");
const app = express();
const moment= require("moment");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const DB="mongodb+srv://admin-suvendu:Test123@cluster0.ux8c4.mongodb.net/SparksBank";
mongoose.connect(DB);
const bankSchema = {
   name: {
      type: String,
      minLength: 10,
      required: true
   },
   accountNo: {
      type: Number,
   },
   email: {
      type: String
   },
   phoneNo: {
      type: String,

   },
   address: {
      type: String
   },
   amount: {
      type: Number,
      min: [0, "Less than 0"]
   }
}
const historySchema={
   senderAcNo:{
      type:Number,
      required:true
   },
   senderName:{
      type:String
   },
   receiverAcNo:{
      type:String,
   },
   receiverName:String,
   amount:Number,
   date:String,
   status:String
}
const Customer = mongoose.model("Customer", bankSchema);
const History=mongoose.model("History",historySchema);
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.get("/", function (req, res) {
   res.render("index");
});
app.get("/home", function (req, res) {
   res.redirect("/")
})
app.get("/register", function (req, res) {
   res.render("newUser");

});
app.get("/service", function(req,res){
   res.redirect("/#service");
})
app.post("/register", function (req, res) {
   const userName = req.body.userName;
   const email = req.body.email;
   const address = req.body.address;
   const amount = req.body.amount;
   const acNo = Math.floor(Math.random() * 10 ** 10);
   const customer = new Customer({
      name: userName,
      accountNo: acNo,
      email: email,
      address: address,
      phoneNo: req.body.phoneNo,
      amount: amount
   });
   customer.save();
   console.log("Successfully submitted customer details.")
   res.redirect("/")
});
app.get("/customers", function (req, res) {
   Customer.find({}, function (err, customer) {
      if (!err) {
         res.render("customers", { customerList: customer });
      }
   })

});

app.get("/transfer", function (req, res) {
   Customer.find({}, function (err, customer) {
      if (!err) {
         res.render("transfer", { customerList: customer });
      }
   })
});
app.post("/money-transfer", function (req, res) {
   const tranAccountNo = req.body.transfer;
   Customer.find({}, function (err, customers) {
      if (!err) {
         customers.forEach(function (customer) {
            if (customer.accountNo == tranAccountNo) {
               res.render("money-transfer", { senderAc: tranAccountNo, currentBal: customer.amount,code:1 });
            }
         })

      }
      else {
         console.log(err);
      }
   });
})
app.post("/moneyTransfer", function(req,res){
   const seAcNo=req.body.seAcNo;
   const reAcNo=req.body.reAcNo;
   const amount=Number(req.body.amount);
   const currentDate=moment().format("DD/MM/YYYY, h:mm:ss a")+" (IST)";

   Customer.find({accountNo:seAcNo},function(err,customer){
      if(amount>customer[0].amount || amount<0){
       console.log("Error.....insufficient amount");
       Customer.find({accountNo:reAcNo}, function(err,per){
          if(!err){
            const historyData=new History({
               senderAcNo:customer[0].accountNo,
               senderName:customer[0].name,
               receiverAcNo:per[0].accountNo,
               receiverName:per[0].name,
               amount:amount,
               date:currentDate,
               status:"Failed"
            });
            historyData.save();
          }
       });
       res.render("money-transfer",{senderAc:customer[0].accountNo,currentBal:customer[0].amount,code:100})
      }
      else
      {
         Customer.find({},function(err,person){
            if(!err)
            {
               var flag=0;
               person.forEach(function(per){
                  if(per.accountNo==reAcNo){
                     const upAmount=per.amount+amount;
                     Customer.findOneAndUpdate({accountNo:reAcNo},{amount:upAmount},function(err){
                        if(err)
                        console.log(err);
                     });
                     const upAmount1=customer[0].amount-amount;
                           Customer.findOneAndUpdate({accountNo:seAcNo},{amount:upAmount1},function(err){
                              if(err)
                              console.log(err);
                           }); 
                     flag=1;      
                     console.log("balance updated successfully");
                     const historyData=new History({
                        senderAcNo:customer[0].accountNo,
                        senderName:customer[0].name,
                        receiverAcNo:per.accountNo,
                        receiverName:per.name,
                        amount:amount,
                        date:currentDate,
                        status:"Successful"
                     });
                     historyData.save();
                     res.render("money-transfer",{senderAc:customer[0].accountNo,currentBal:upAmount1,code:200})
                  }
               });
               if(flag==0)
               {
                  console.log("invalid account no......"); 
                  const historyData=new History({
                     senderAcNo:customer[0].accountNo,
                     senderName:customer[0].name,
                     receiverAcNo:"Invalid A/C",
                     receiverName:"Invalid Name",
                     amount:amount,
                     date:currentDate,
                     status:"Failed"
                  });
                  historyData.save();
                  res.render("money-transfer",{senderAc:customer[0].accountNo,currentBal:customer[0].amount,code:300})
               }
              
            }
         });
       
         // 
      }
   })
})

//For history section
app.get("/history", function(req, res){
   History.find({}, function(err,historyData){
      if(!err){
          res.render("history",{historyList:historyData});
      }
   })
  
})




app.listen(3000, function () {
   console.log("Server is running at port: 3000");
})