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
const fs = require('fs'); 
require('dotenv').config()
apiURL = 'localhost:5000'
const security = require('./security')

router.get('/',(req, res)=>{ res.json({ message:"done"})});

router.get('/fuck',(req, res)=>{ res.json({ message:"what the fuck"})})

router.get('/channels/:channelId',checkAuth, (req, res)=>{ 
    const channelId = req.params.channelId; 
    const userId = req.userData.userId;  
    Server.findById(serverId).then(result=>{ 
        { 
            res.json({message:result}); 
        }
    })
})

Object.defineProperty(Array.prototype, "asyncForEach", {
    enumerable: false,
    value: function(task){
        return new Promise((resolve, reject) => {
            this.forEach(function(item, index, array){
                task(item, index, array);
                if(Object.is(array.length - 1, index)){
                    resolve({ status: 'finished', count: array.length })
                }
            });        
        })
    }
});


const getResponse = async(messages)=>{ 
    const response = messages.map(async message=>({
            message:await Message.findById(message),
       }))
    return Promise.all(response); 
}

const filterUserData = async(userId)=>{ 
    const userdata = await User.findById(userId);  
    const filteredData = { 
        username:userdata.username, 
        online:userdata.online, 
        id:userdata._id, 
        dp:userdata.DP,
        status:userdata.status,
    }
    return filteredData;  

}


const getUserData = async(users)=>{
    const userdata = users.map(async user=>({
        user:await filterUserData(user),
    }))
    return Promise.all(userdata); 
}

router.get('/users/:serverId',checkAuth,checkPerms,(req, res)=>{ 
    const { page = 1, limit = 50} = req.query; 
    const serverId = req.params.serverId; 
    Server.findById(serverId).then(result=>{
        const a =  Number(((page-1)*limit));
        const b =  Number(((page-1)*limit))+Number(limit);
        const Users = result.Users.slice(a,b);
        getUserData(Users).then((users)=>{ 
            const totalUsers = result.Users.length;  
            res.json({users:users, currentPage:page, totalPages:Math.ceil(totalUsers/limit),userCount:users.length});
        }).catch(err=>console.log(err)); 
 
    }) 
})

router.get('/:channelId/messages/:serverId',checkAuth,checkPerms,async(req, res)=>{ 
    const { page = 1, limit = 50} = req.query; 
    const channelId = req.params.channelId; 
    Channel.findById(channelId).then(result=>{
        const a =  Number(((page-1)*limit));
        const b =  Number(((page-1)*limit))+Number(limit);
        const messages = result.messages.slice(a,b);
        messages.reverse(); 
        getResponse(messages).then((response)=>{ 
            const totalMessages = result.messages.length;  
            res.json({messages:response, currentPage:page, totalPages:Math.ceil(totalMessages/limit),MessageCount:messages.length});
        }).catch(err=>console.log(err)); 
 
    }) 
})

router.post('/add/message/:channelId',checkAuth,(req, res)=>{ 
    const channelId = req.params.channelId ; 
    const content  = req.body.content;  
    const message = {
        authorId:req.userData.userId, 
        content: content, 
    }  
    const messagee = new Message(message).save().then((result)=>{ 
        Channel.findByIdAndUpdate(channelId,{$push:{messages:result._id}}).then((r)=>{ 
            res.json({message:"done"}); 
        }) 
    })
})

const getServerData = async(id)=>{ 
     return new Promise(async function(resolve, reject) {
        Server.findById(id).then((serverdata)=>{ 
            const data = { 
                icon:serverdata.icon, 
                name:serverdata.name,
                id:serverdata._id,
            } 
            resolve(data); 
        }); 
    }); 
    
}
const getservers = (servers)=>{ 
     const response = servers.map(async serverId=>({
            server:await getServerData(serverId),
       }))
       return Promise.all(response);
}

router.get('/servers/',checkAuth,(req,res)=>{ 
    const userId = req.userData.userId; 
    User.findById(userId).then((result)=>{ 
        getservers(result.servers).then((serversdata)=>{ 
            res.json(serversdata); 
        });  
    })
})

router.get('/getchannel/:serverId',checkAuth,checkPerms,(req,res)=>{ 
    Channel.find({parentId:req.params.serverId}).then((result)=>{
        const reqinfo=result.map((server)=>({
            name:server.name,
            serverId:server.parentId, 
            Id:server._id,
        })) 
        res.json(reqinfo); 
    })
})


module.exports = router; 