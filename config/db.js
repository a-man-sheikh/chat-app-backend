const mongoose = require("mongoose");
const {MONGO_URI}=require("./constants")

const connectDB = async()=>{
    try{
        mongoose.connect(`${MONGO_URI}/chat-app`);
          console.log("MongoDB connected");
    }
    catch(err){
        console.error("MongoDB connection failed:",err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
