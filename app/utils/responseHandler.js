

const successResponse =  (res,statusCode,message,data = {}) =>{
    return res.status(statusCode).json({
        message: message,
        success: true,
        data : data,
    });
}

const errorResponse = (res,statusCode,message,error =null)=>{
    return res.status(statusCode).json({
        message : message ,
        success : false,
        error : error
    })
}

module.exports = {successResponse,errorResponse}