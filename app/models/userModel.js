const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String,
        sparse:true,
        required:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,

    },
    isVerified:{
        type:Boolean,
        default:false,
    }
},
{
    timestamps:true,
})


module.exports = mongoose.model("User",userSchema);
