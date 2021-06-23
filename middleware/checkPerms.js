const mongoose = require('mongoose'); 
const Server = require('../models/Server'); 

function checkperm(arr, val) {
  return arr.some(function(arrVal) {
    return val === arrVal;
  });
}

module.exports = async(req, res, next) => {
    const serverId = req.params.serverId ; 
    const serveres = await Server.findById(serverId); 
    if(checkperm(serveres.Users, req.userData.userId)){ 
        next(); 
    }
    else{ 
        res.json({message:'perms error'})
    }
};