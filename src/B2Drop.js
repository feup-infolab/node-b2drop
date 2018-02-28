const util = require("./util");

let request = require("request");
request = request.defaults({jar: true});
const cheerio = require("cheerio");
const async = require("async");
const qs = require("querystring");
const isNull = require("./util").isNull;

const createClient = require("webdav");

const Uri = {
    loginUri: "https://b2drop.eudat.eu/login",
    logoutUri: "https://b2drop.eudat.eu/logout",
    shareLinkRequest: "https://b2drop.eudat.eu/ocs/v2.php/apps/files_sharing/api/v1/shares",
    webdavPrivateUri: "https://b2drop.eudat.eu/remote.php/webdav"
};

function B2Drop (username, password)
{
    let self = this;

    self.username = username;
    self.password = password;
    self.cookie = request.jar();

    self.connection = createClient(
        Uri.webdavPrivateUri,
        this.username,
        this.password
    );
}

B2Drop.prototype.checkIfFolderExists = function (folderPath, callback)
{
    const self = this;
    self.getDirectoryContents(folderPath, function (err, response)
    {
        if (err)
        {
            if (err.status === 404)
            {
                return callback(null, false);
            }

            return callback(err, response);
        }
        else if (response && response instanceof Array)
        {
            return callback(null, true);
        }

        return callback(1, "Invalid response from server when fetching contents of the B2Drop folder " + folderPath + " !");
    });
};

B2Drop.prototype.getAuthToken = function (callback)
{
    let self = this;

    request.get({
        url: Uri.loginUri,
        auth: {
            user: self.username,
            pass: self.password
        },
        headers: {
            jar: self.cookie
        }
    },
    function (error, response, body)
    {
        if (isNull(error) && response && response.statusCode === 200)
        {
            const $ = cheerio.load(body);
            self.requesttoken = $("head").attr("data-requesttoken");
        }
        return callback(error, response);
    });
};

B2Drop.prototype.changeFolderSetting = function (folderUri, folderID, setting, callback)
{
    let self = this;

    var queryString;

    request.put({
        url: Uri.shareLinkRequest + "/" + folderID + "?format=json",
        headers: {
            jar: self.cookie,
            requesttoken: self.requesttoken
        },
        form: setting
    },
    function (error, response)
    {
        if (error)
        {
            return callback(error, null);
        }
        queryString = qs.stringify({
            format: "json",
            path: folderUri,
            reshares: "true"
        });

        request.get({
            url: Uri.shareLinkRequest + "?" + queryString,
            headers: {
                jar: self.cookie,
                requesttoken: self.requesttoken
            }
        },
        function (error, response)
        {
            return callback(null, response);
        });
    });
};

B2Drop.prototype.getShareLink = function (folderUri, password, callback)
{
    let self = this;

    var getLink = function (callback)
    {
        var queryString = qs.stringify({
            format: "json",
            password: "",
            passwordChanged: "false",
            permission: "31",
            expireDate: "",
            shareType: "3",
            path: folderUri
        });

        request.post({
            url: Uri.shareLinkRequest + "?" + queryString,
            headers: {
                jar: self.cookie,
                requesttoken: self.requesttoken
            }
        },
        function (error, response)
        {
            if (!isNull(error))
            {
                return callback(error, response);
            }

            queryString = qs.stringify({
                format: "json",
                path: folderUri,
                reshares: "true"
            });

            request.get({
                url: Uri.shareLinkRequest + "?" + queryString,
                headers: {
                    jar: self.cookie,
                    requesttoken: self.requesttoken
                }
            },
            function (error, response, body)
            {
                if (!isNull(error) || (response && response.statusCode !== 200))
                {
                    return callback(error, response, null);
                }

                var info = JSON.parse(body);
                const url = info.ocs.data[0].url;
                const folderID = info.ocs.data[0].id;

                self.changeFolderSetting(folderUri, folderID, {permissions: "15"}, function (err, response)
                {
                    if (!isNull(error) || (response && response.statusCode !== 200))
                    {
                        return callback(error, response, url);
                    }
                    self.changeFolderSetting(folderUri, folderID, {password: password}, function (err, response)
                    {
                        return callback(err, response, url);
                    });
                });
            });
        });
    };

    if (isNull(self.requesttoken))
    {
        self.getAuthToken(function (err, response)
        {
            if (response.statusCode !== 200)
            {
                return callback(err, response);
            }

            getLink(function (err, response, url)
            {
                return callback(err, response, url);
            });
        });
    }
    else
    {
        getLink(function (err, resp)
        {
            return callback(err, resp);
        });
    }
};

B2Drop.prototype.getDirectoryContents = function (folderPath, callback)
{
    let self = this;

    self.connection.getDirectoryContents(folderPath)
        .then(function (contents)
        {
            return callback(null, contents);
        },
        function (error)
        {
            return callback(error, null);
        }
        );
};

B2Drop.prototype.put = function (fileUri, inputStream, callback)
{
    let self = this;

    const outputStream = self.connection.createWriteStream(fileUri);

    outputStream.on("finish", function ()
    {
        callback(null);
    });

    outputStream.on("error", function ()
    {
        callback("Error sending file to " + fileUri);
    });

    inputStream.pipe(outputStream);
};

B2Drop.prototype.get = function (fileUri, outputStream, callback)
{
    const self = this;

    const downloadStream = self.connection.createReadStream(fileUri);

    downloadStream.on("error", function (error)
    {
        if (error.code === "ENOENT")
        {
            return callback(404, error);
        }
        return callback(1, error);
    });

    downloadStream.on("data", function (data)
    {
    });

    downloadStream.on("end", function ()
    {
    });

    outputStream.on("finish", function ()
    {
        const msg = "Finished reading the file from b2drop";
        return callback(null, msg);
    });

    outputStream.on("error", function ()
    {
        const msg = "Error writing the file from b2drop to temp file";
        return callback(2, msg);
    });

    downloadStream.pipe(outputStream);
};

B2Drop.prototype.delete = function (fileUri, callback)
{
    const self = this;

    self.connection.deleteFile(fileUri)
        .then(function (resp)
        {
            return callback(null, resp);
        }, function (err)
        {
            return callback(err, null);
        });
};

B2Drop.prototype.createFolder = function (folderUri, callback)
{
    const self = this;

    const allPathsUntilFolder = util.getAllPathsUntilFolder(folderUri);

    async.mapSeries(allPathsUntilFolder, function (folderPath, callback)
    {
        self.checkIfFolderExists(folderPath, function (err, exists)
        {
            if (err)
            {
                return callback(err, "Failed check if the folder " + folderPath + " in B2drop exists");
            }

            if (!exists)
            {
                self.connection.createDirectory(folderPath)
                    .then(function (resp)
                    {
                        return callback(null, resp);
                    }, function (err)
                    {
                        return callback(err, null);
                    });
            }
            else
            {
                return callback(null);
            }
        });
    }, function (err, results)
    {
        callback(err);
    });
};

B2Drop.prototype.deleteFolder = function (folderUri, callback)
{
    const self = this;

    self.connection.deleteFile(folderUri)
        .then(function (resp)
        {
            return callback(null, resp);
        }, function (err)
        {
            return callback(err, null);
        });
};

B2Drop.prototype.getQuota = function (callback)
{
    const self = this;

    self.connection.getQuota()
        .then(function (resp)
        {
            return callback(null, resp);
        }, function (err)
        {
            return callback(err, null);
        });
};

B2Drop.prototype.testConnection = function (callback)
{
    const self = this;

    self.connection.getQuota()
        .then(function (resp)
        {
            var keys = Object.keys(resp);
            if (keys.length === 2 && keys[0] === "used")
            {
                return callback(null, "Valid Connection");
            }

            return callback(resp, "Invalid Connection");
        },
        function (err)
        {
            return callback(err, "Invalid Connection");
        });
};
module.exports.B2Drop = B2Drop;
