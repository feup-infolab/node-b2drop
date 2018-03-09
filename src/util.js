module.exports.isNull = function (object)
{
    if (object === null)
    {
        return true;
    }

    if (typeof object === "undefined")
    {
        return true;
    }

    return false;
};

module.exports.pathInApp = function (filePath)
{
    const path = require("path");
    return path.join(path.resolve(__dirname, ".."), filePath);
};

module.exports.getAllPathsUntilFolder = function (folderUri)
{
    const sections = folderUri.split("/").splice(1);
    let paths = [];

    for (let i = 0; i <= sections.length; i++)
    {
        let currentSection = sections.slice(0, i).join("/");
        currentSection = "/" + currentSection;
        paths.push(currentSection);
    }

    let pathsWithoutRoot = paths.splice(1);
    return pathsWithoutRoot;
};

module.exports.Uri = {
    loginUri: "https://b2drop.eudat.eu/login",
    logoutUri: "https://b2drop.eudat.eu/logout",
    shareLinkRequest: "https://b2drop.eudat.eu/ocs/v2.php/apps/files_sharing/api/v1/shares",
    webdavPrivateUri: "https://b2drop.eudat.eu/remote.php/webdav",
    webdavShareUri: "https://b2drop.eudat.eu/public.php/webdav"
};