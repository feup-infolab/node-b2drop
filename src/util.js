module.exports.isNull = function(object)
{
    if(object === null)
    {
        return true;
    }
    else
    {
        if(typeof object === "undefined")
        {
            return true;
        }
        else
        {
            return false;
        }
    }
}

module.exports.pathInApp = function(filePath)
{
    const path = require("path");
    return path.join(path.resolve(__dirname, ".."), filePath)
};

