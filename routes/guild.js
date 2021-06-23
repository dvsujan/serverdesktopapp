const express = require('express');
const { modelNames } = require('mongoose');
const router = express.Router();
const multer = require('multer')
const User = require('../models/User'); 
const Server = require('../models/Server')
const Channel = require('../models/Channel')
const Message = require('../models/Message')
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkAuth');
const checkPerms = require('../middleware/checkPerms');
const checkAdmin = require('../middleware/checkAdmin');
const sharp = require('sharp');
const fs = require('fs');
require('dotenv').config()
apiURL = 'localhost:5000'
const security = require('./security')


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './ServerProfiles/');
  },
  filename: function(req, file, cb) {
    cb(null,makeid(15)+'.'+file.originalname.split('.')[1].replace('\\','/'));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 20
  },
  fileFilter: fileFilter
});


function checkUser(arr, val) {
  return arr.some(function(arrVal) {
    return val === arrVal;
  });
}

router.post('/textchannel/:serverId',checkAuth,checkPerms,checkAdmin,(req, res)=>{ 
    const serverId = req.params.serverId ;
    const body = req.body ;
    const data = {name:body.name,parentId:serverId};
    
    Server.findById(serverId).then(resu=>{ 
        if(resu==null){ 
            res.json({message:'No server exists'}); 
        }
        else{ 
            const channel = new Channel(data).save().then((result)=>{
                Server.findByIdAndUpdate(serverId,{ 
                    $push:{textChannels:channel},
                }).then(r=>res.json({message:'done'}));  
            }) ; 
        }
    }) ;  

})


router.post('/join/server', checkAuth, (req, res)=>{ 
    const serverId = req.body.serverId;
    const userId = req.userData.userId;
    
    Server.findById(serverId).then(resp=>{
        if(checkUser(resp.Users,userId)){
             
            res.json({message:"user already in server"}); 
        }
        else{ 
            User.findByIdAndUpdate(userId,{
                $addToSet:{
                    servers:serverId,
                }
            }).then(response=>{ 
                Server.findByIdAndUpdate(serverId, {$addToSet:{Users:userId}}).then((resp)=>{ 
                res.json({message:"done"}); 
            }).catch(err=>console.log(err)); 
        })
        }

    }).catch(err=>{res.json({message:`no server named ${serverId}`})});

})

router.post('/create/server/',checkAuth,upload.single('ServerProfile'),async(req, res)=>{
    const name = req.body.name;
    const userId = req.userData.userId ;
    const FinalPath = './ServerProfiles/'+makeid(10)+'resized'+'.'+req.file.originalname.split('.')[1];
    const { filename: ServerProfile } = req.file;
    if(req.file.mimetype === 'image/gif'){
        // const savePath = './ServerProfiles/'+makeid(14)+'.gif';  
        const server = new Server({name:name,icon:req.file.path}).save().then(resu=>{
        const newChannel = new Channel({name:'General',parentId:resu._id}).save().then(response=>{
            console.log('server created'); 
            Server.findByIdAndUpdate(resu._id,{$push:{textChannels:response._id, Users:userId}}).then(ab=>{ 
                User.findByIdAndUpdate(userId,{$push:{servers:resu._id}}).then(r=>{ 
                    res.json({message:"done"}); 
                })
            })
        }).catch(error=>{console.log(error)});  
    }).catch(err=>console.log(err)); 
    }
    else{ 
        await sharp(req.file.path)
            .jpeg({resize:300})
            .png({resize:300}) 
        .toFile(FinalPath)
        fs.unlinkSync(req.file.path);
         const server = new Server({name:name,icon:FinalPath.replace('./','')}).save().then(resu=>{
                const newChannel = new Channel({name:'General',parentId:resu._id}).save().then(response=>{
                    console.log('server created'); 
                    Server.findByIdAndUpdate(resu._id,{$push:{textChannels:response._id, Users:userId,permissions:userId}}).then(ab=>{ 
                        User.findByIdAndUpdate(userId,{$push:{servers:resu._id}}).then(r=>{ 
                            res.json({message:"done"}); 
                        })
                    })
                }).catch(error=>{console.log(error)});  
            }).catch(err=>console.log(err));  
    } 
  
})

module.exports = router; 