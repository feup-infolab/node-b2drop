const util = require("./util");

let request = require("request");

const createClient = require("webdav");
const async = require("async");

class Client
{
    constructor (uri, username, password)
    {
        let self = this;

        self.username = username;
        self.password = password;
        self.cookie = request.jar();

        self.connection = createClient(
            uri,
            this.username,
            this.password
        );
    }

    checkIfFolderExists (folderPath, callback)
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
    }

    getDirectoryContents (folderPath, callback)
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
    }

    put (fileUri, inputStream, callback)
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
    }

    get (fileUri, outputStream, callback)
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
    }

    delete (fileUri, callback)
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
    }

    createFolder (folderUri, callback)
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
    }

    deleteFolder (folderUri, callback)
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
    }

    testConnection (callback)
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
    }
}

module.exports.Client = Client;
