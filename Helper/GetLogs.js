const { Console } = require("console");

const fs = require("fs");


const myLogger = new Console({
    stdout: fs.createWriteStream("normalMessages.txt"),
    stderr: fs.createWriteStream("errorMessages.txt"),
  });


  const myLogs = (error,result,procName)=>{
    myLogger.error("<-----------"+procName+ "----------->");
    myLogger.error(error);
    myLogger.log("<-----------"+procName+ "----------->");
    myLogger.log(result);
  }



  module.exports = myLogs;