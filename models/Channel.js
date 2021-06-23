const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const ChannelSchema = new Schema({
    name:{ 
        type:String,
        require:true, 
    },
    parentId:{ 
        type:String,
        require:true, 
    }, 
    messages:{ 
        type:Array, 
    }, 
},{timestamps:true})

const Channel = mongoose.model('Channels', ChannelSchema);
module.exports = Channel ;  
