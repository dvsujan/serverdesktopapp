const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const MessageSchema = new Schema({
    content:{ 
        type:String, 
        require:true, 
    },
    authorId:{ 
        type:String,
        require:true, 
    }
},{timestamps:true}); 

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message  ;  
