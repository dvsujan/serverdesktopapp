// USER INFO
const express = require('express');
const { modelNames } = require('mongoose');
const router = express.Router();
const multer = require('multer')
const User = require('../models/User'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkAuth');
const nodemailer = require('nodemailer');
const sharp = require('sharp');
const fs = require('fs'); 
require('dotenv').config()
apiURL = 'localhost:5000'
const mail = require('./SendMail'); 
const security = require('./security');
const { Server } = require('http');

const generateVerificationCode = ()=>{ 
  var minm = 100000;
  var maxm = 999999;
  const down = Math.floor(Math
  .random() * (maxm - minm + 1)) + minm;
  return down ; 
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './HQPost/');
  },
  filename: function(req, file, cb) {
    cb(null,makeid(10)+file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ 
    storage:storage,
    limit:{ 
        filesize:1024*1024*20,
    },
    fileFilter:fileFilter,
})

function makeid(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * 
 charactersLength)));
   }
   return result.join('');
}


router.get('/:id',(req,res,next)=>{ 
    const id = req.params.id;
    User.findById(id)
    .then((user)=>{
        resobj = { 
          username:user.username,
          bio:user.bio,   
          followers:user.followers, 
          following:user.following,
          DP:user.DP,
          name:user.name,
        } 
        res.status(200).json(resobj);  
    })
    .catch((err)=>{
        res.status(400).json({ 
            message:'user not found',
        })
    })
});

router.get('/verify/token/',checkAuth,(req, res)=>{
  res.json({message:"valid"});  
})



router.post('/register',(req, res) => {
    User.find({ email: req.body.email })
    .exec()
    .then(user => {
      if (user.length >= 1) {
        return res.json({
          message: "Mail Already exists"
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
              console.log(err);
            return res.status(500).json({
              error: err
            });
          } else {
            const user = new User({
              email: req.body.email.toLowerCase(),
              password: hash,
              username:req.body.username.toLowerCase(), 
            });
            user
              .save()
              .then(result => {
                console.log(result);
                const code = generateVerificationCode();
                const userEncryption = security.encrypt(req.body.email); 
                mail.sendMail(req.body.email,userEncryption,req.body.first_name);  
                res.status(201).json({
                  message: "User created",
                  VerificationCode:code,
                  hash:userEncryption ,
                });
              })
              .catch(err => {
                console.log(err);
                if(err.code == 11000){ 
                  res.json({ 
                    message:'Username already Exists',
                  })
                } 
                else{
                  res.status(500).json({
                  error: err
                });
              }
              });
          }
        });
      }
    });
});

router.put('/',checkAuth,(req, res)=>{ 
  const username = req.userData.username; 
  const Bio = req.body.bio; 
  const Name = req.body.name ; 
  console.log(req);  
  User.findOneAndUpdate({username:username},{bio:Bio, name:Name}).then(()=>{ 
    res.json({message:"done"});
  }) 
  .catch((err)=>{ 
    console.log(err); 
  })
})

router.patch('/',checkAuth, upload.single('ProfileImage'), async(req, res)=>{ 
  const FinalPath = './profiles/'+makeid(10)+'resized'+req.file.originalname;
  const { filename: ProfileImage } = req.file;
  const username = req.userData.username;
  const bio = req.body.bio; 
  const name = req.body.name; 
  console.log(ProfileImage);
  await sharp(req.file.path)
      .resize({
          fit: sharp.fit.contain,
          width:200, 
        })
      .jpeg({ quality: 50 })
      .toFile(FinalPath)
      fs.unlinkSync(req.file.path); 

    User.findOneAndUpdate({username:username},{bio:bio, name:name, DP:FinalPath.replace('./','')}).then(()=>{ 
      res.status(200).json({message:"done"}); 
    })
    .catch((err)=>{ 
      console.log(err); 
    })
});

router.post("/login", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(200).json({
          message: "Auth failed"
        });
      }
      else if(user[0].Active==false){ 
        return res.status(200).json({
          message:"Account Not Activated",
        })
      } 
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(200).json({
            message: "Auth failed"
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              userId: user[0]._id, 
              username:user[0].username,
            },
            process.env.JWT_KEY,
            {
                expiresIn: "10d"
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token
          });
        }
        res.status(200).json({
          message: "Auth failed"
        });
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


router.delete("/",checkAuth, (req, res, next) => {
  User.remove({ _id: req.userData.userId })
    .exec()
    .then(result => {
      res.status(200).json({
        message: "User deleted"
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


router.get('/getid/:username',(req,res,next)=>{ 
    const username = req.params.username.toLowerCase();  
    const id = User.findOne({
        username:username
    }).then((id)=>{
        res.status(200).json({ 
            id:id._id,
        })
    }) 
    .catch((err)=>{
       res.status(200).json({
            error:err.code,
        })
    }) 
 
})

router.get('/me/info', checkAuth, (req, res)=>{ 
  res.json({id:req.userData.userId, email:req.userData.email, username:req.userData.username, message:"done"}); 
})

router.get('/activate/:hash',(req, res)=>{ 
  const email = security.decrypt(req.params.hash); 
  User.findOneAndUpdate({email:email},{Active:true})
  .then(()=>{
    res.json({
      message:"done",
    })
  })
  .catch((err)=>{console.log(err)}); 
})

module.exports = router; 