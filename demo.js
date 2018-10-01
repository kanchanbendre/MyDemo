const express = require('express');
const exphbs=require('express-handlebars');
const nodemailer=require('nodemailer');
const app = express();

const router = express.Router();
const {
    Pool,
    Client
} = require('pg');
const bodyParser = require('body-parser');

const pool = new Pool({
    user:'gosssvnlplxlmd', 
  //  user: 'postgres',
    host: 'ec2-54-243-147-162.compute-1.amazonaws.com',
    database: 'd1g653dd8jcirk',
    password: 'fabbcb9bac71298caf243fd189957517ac165dceb12216aecc320eaff12888ae',
    port: 5432,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1)
});
//view engin setup
app.engine('handlerbar',exphbs());
app.set('view engine','handlerbar');
//Third-party middelware
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));
app.use(router);

router.post('/registration', function(req, response, next) {
    console.log('inside the login post');
    // Grab data from http request
    const data = {
        email:req.body.email,
        password: req.body.password,       
        device_id: req.body.device_id,
        d_no: req.body.d_no, 
        otp:'0',
        otp_flag:0
    };

    const values = [
        data.email,
        data.password,
        data.device_id,
        data.d_no,
        data.otp,
        data.otp_flag   
    ]; 
 
    pool.connect((err, client, done) => {
        if (err)
            throw err;   

            client.query('SELECT * from login WHERE email = $1 ', [req.body.email], (err, result,rows,fields) => {              
       
              if(!err){
                  if(result.rowCount==1){               
            
                   response.json({
                                "status": 0 ,     
                                "message":"This email already registered"               
                                })
                    }
                else{
                 
                    client.query('INSERT INTO login(email, password, device_id,d_no,otp,otp_flag) values($1, $2, $3,$4,$5,$6)', values, (err, res,rows) => {
                     
                        if (err) {                              
                            throw err                       
                          }
                          client.query('SELECT * from login WHERE email = $1 ', [req.body.email], (err, result,rows,fields) => {                         
                        if(result.rowCount>=1){
                        var user_id=result.rows[0].user_id;
                         response.json({
                                    "status": 1 ,     
                                    "message":"Registration Successfully",
                                    "userID":user_id         
                                 })
      
                                }
                            });
                        })

                
                }
            }
            else
            throw err;
        })
        
        });
    });


router.post('/login', function(req, res) {
    pool.connect((err, client, done) => {
        if (err)
            throw err;
         client.query('SELECT * from login WHERE email = $1 ', [req.body.email], (err, result,rows,fields) => {     
         if(!err){
             if(result.rowCount>=1){
                var password  = req.body.password;       
                var pass = result.rows[0].password;       
                var device_id=req.body.device_id;
                var de_id=result.rows[0].device_id;
                var user_id=result.rows[0].user_id;
                var dno=req.body.d_no;
                var dNo=result.rows[0].d_no;   
                 console.log(result);

                if(pass === password){
                    res.json({
                                   "status": 1 ,     
                                   "message":" You are successfully logged in..",
                                   "userID": user_id                                 
                                  })                        
                               }
               else{
                    res.json({
                                 "status": 0 ,     
                                 "message":" Invalid credentials.."                                                               
                                 })    
                   
                   }             
                   if(device_id === de_id){
                       console.log("equal...");                     
                   }

                   else{
                       console.log('inside else of update');
                       client.query('update login set deviceid =($1), d_no=($2) where  user_id=($3)',[device_id, dno, user_id],(err,result) =>{
                        if(!err){
                            console.log('updated');
                        }
                        else{
                        throw err;
                        }
                          
                       });                      
                   }
               }       
       
                else{      
                       res.json({
                                 "status": 2 ,     
                                 "message":" This email Id does not exist."                                
                              })                     // res.send(JSON.stringify('Status : 2   This email Id does not exist. . .'));
                   }
               }
              else{
                  throw err;       
                 }
            })        
         });
    });             

router.get('/Login', function(req, res, next) {  
    pool.connect((err, client, done) => {
        if (err)
            throw err;
         client.query('select * from login', (err, rows,fields) => {
           // done();
            if (err) {
                next(err);
                throw err
            }
            res.send(rows);
           // pool.end()
          })         
      }); 
});

var otp;
router.post('/SendOTP', function(req, response, next) {

    pool.connect((err, client, done) => {
        if (err)
            throw err;          
          client.query('SELECT * from login WHERE email = $1 ', [req.body.email], (err, Result,rows,fields) => {
                if(!err){
                    if(Result.rowCount==1){
                        device_id = req.body.device_id;
                        userID = Result.rows[0].user_id;
                        EMAIL = Result.rows[0].email;
                        
                        USER_ID(userID); 
                        DEVICE_ID(device_id);
                        MAIL(EMAIL);
                   
              otp = Math.floor(1000 + Math.random() * 9000);
              console.log(otp);

          client.query('update login set otp = ($1), otp_flag = ($2),device_id=($3),d_no=($4) where user_id = ($5)',[otp,0,req.body.device_id,req.body.d_no,userID],(err)=>{
                            console.log('updated');

                        });
                        var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'emaitest855@gmail.com',
                            pass: '9850933443D'
                        }
                        });

                        var mailOptions = {
                        from: 'emaitest855@gmail.com',
                        to: req.body.email,
                        subject: 'OTP for reset Password',
                        text: 'Please find the otp',
                        html:'Your otp is '+ otp
                        
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ');
                        }
                        });


                        const result ={
                            status: 1,
                            message: 'OTP is send to your mail_id '
                          };
                        response.send(result); 
                     }
                     else{  
                        const result ={
                            status: 0,
                            message: 'This e-mail does not exist'
                        };
                        response.send(result); 

                            }
                    }
                                else
                                throw err;
                            });
                            
                     });
             });

    var userId;
    function USER_ID (userID){
        userId=userID;
        console.log('User ID=>'+userId);
        return userId;
       }

    var Device_id;
    function DEVICE_ID (device_id){
    Device_id=device_id;
    console.log('device_id is=>  '+Device_id);
    return Device_id;
     }

    var user_email;
    function MAIL (EMAIL){
    user_email=EMAIL;
    console.log('Email Id=> '+user_email);
    return user_email;
    }

    // var Otp_Flag;
    // function OTP(Otpstatus){
    //     Otp_Flag=Otpstatus;
    //     console.log("OtpFlag Status=>"+Otp_Flag);
    //     return Otp_Flag;
    // }

 router.post('/OTPValidator', function(req,res) {

    if(Device_id === req.body.device_id){

        pool.connect((err, client, done) => {
            if (err)
                throw err;


        client.query('select* from login where device_id = $1',[Device_id], (err,Result,rows)=>{
            if(!err){

                if(Result.rows[0].otp_flag == 0){
                    if(Result.rows[0].otp == req.body.otp && Result.rows[0].email == user_email){
                        client.query('update login set otp_flag = ($1) where user_id = ($2)',[1,userId], (err)=>{
                            // Otpstatus=Result.rows[0].otp_flag;
                            // console.log("updated flag=>"+Otpstatus);
                            // OTP(Otpstatus);
                            const result ={
                                status: 1, 
                                message: 'OTP Matched'
                            };
                            res.send(result);
                        });

                    }

                    else{
                        const result ={
                            status: 0, 
                            message: 'OTP does not match'
                        };
                        res.send(result);

                    }
                }

                else
                {
                    const result ={
                        status: 0, 
                        message: 'OTP already used'
                    };
                    res.send(result);
                }

            }

            else
            throw err;

        })

    });

    }
    
    else{
        const result ={
            status: 0, 
            message: 'Device ID does not match'
        };
        res.send(result);
    }

});


router.post('/ResetPassword', function(req, res,next) {

    pool.connect((err, client, done) => {    
        if (err)
            throw err;  
           // if(Otp_Flag === 1){
            client.query('select* from login where device_id = $1',[Device_id], (err,Result,rows)=>{
                if(!err){

                    if(Result.rows[0].otp_flag == 1){
                  client.query('UPDATE login set password = ($1) where device_id = ($2)', [req.body.password,Device_id],(err) =>{
                    if(!err){
                        const result1 ={
                            status: 1,
                            message: 'Password changed Successfully',
                            user_id:userId
                          };            
                            res.send(result1);
                    }
                    else{
                    throw err;
                    }
                    
                });          
           
        }
        else{
            const result ={
                status: 0, 
                message: 'Not able to set Password...'
            };
            res.send(result);

        }
        
    }

          });
        })

 });

 const port = process.env.pool.
const port = process.env.PORT || 5000;
app.listen(port, ()=> console.log(`Listening on ${port}...`));