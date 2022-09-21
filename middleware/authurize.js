const jwt = require("jsonwebtoken");
require('dotenv').config()

exports.authenticate = (req, res, next) => {
    const token = req.header('auth-Token');
    if (!token)
        return res.status(404).json({ msg: "Token not found!"});
    try {
        const vrfy = jwt.verify(token, process.env.ACCESS_TOKEN);
        
        req.ID = vrfy.ID;
        console.log("your id is " + req.ID);
        next()
    } catch (_) {
        return res.status(401).json({ msg: "Invalid Token" });
    }

}

exports.resetToken= (req, res, next) => {
    const token = req.header('auth-Token');
    // console.log(token);
    if (!token)
        return res.status(404).json({ msg: "Token not found!" });
    try {
        const vrfy = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN);
        req.ID = vrfy.ID;
        next()
    } catch (_) {
        res.status(401).json({ msg: "Invalid Token" });
    }

}
