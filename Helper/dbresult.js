exports.DBMsgOtpStatus = (result)=>{
    try{
        return {msg:result[0][0].msg,otp:result[0][0].otp,status:result[0][0].status,User_ID:result[0][0].User_ID}
    }
    catch(_){
        return {rslt:result[0][0]};
    }
}
exports.ResultDB = (result)=>{
    return {rslt:result[0][0]};
}