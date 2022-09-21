exports.ReplaceWithEmp = (result)=>{
    return result ? result:"";
}


// replace ' with /' in string
exports.RepWithSlash = (result)=>{
    return result ? result.replace(/'/g, "\'"):"";
}