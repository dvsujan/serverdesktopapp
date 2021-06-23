const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const ServerSchema = new Schema({
    name:{ 
        type:String,
        require:true, 
    },
    Users:{
        type:Array, 
    }, 
    textChannels:{
        type:Array, 
    },
    voiceChannels:{ 
        type:Array, 
    } ,
    icon:{ 
        type:String, 
        default:'https://logodix.com/logo/557580.png',
    }, 
    region:{ 
        type:String, 
        default:'India', 
    } , 
    permissions:{ 
        type:Array,
    }
})

const Server = mongoose.model('Server', ServerSchema);
module.exports = Server ;  
