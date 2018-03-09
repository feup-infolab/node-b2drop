const util = require("./util");

const Client = require("./Client").Client;

class B2DropShare extends Client
{
    constructor (sharelink, password)
    {
        super(util.Uri.webdavShareUri, sharelink.split("/s/")[1], password);
    }
}

module.exports.B2DropShare = B2DropShare;

