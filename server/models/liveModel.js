const mongoose = require("mongoose");

const liveschema= mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    roomId:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    title:{
        type:String,
        required:true
    },
    viewers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ]
})

module.exports = mongoose.model("Live",liveschema);