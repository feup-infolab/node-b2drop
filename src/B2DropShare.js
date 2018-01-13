const async = require("async");
const createClient = require("webdav");
const util = require("./util");

const Uri = {
    webdavShareUri: "https://b2drop.eudat.eu/public.php/webdav"
};

function B2DropShare (sharelink, password)
{
    let self = this;

    self.connection = createClient(
        Uri.webdavShareUri,
        sharelink.split("/s/")[1],
        password
    );
}

B2DropShare.prototype.checkIfFolderExists = function (folderPath, callback)
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

B2DropShare.prototype.getDirectoryContents = function (folderPath, callback)
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

B2DropShare.prototype.put = function (fileUri, inputStream, callback)
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

B2DropShare.prototype.get = function (fileUri, outputStream, callback)
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

B2DropShare.prototype.delete = function (fileUri, callback)
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

B2DropShare.prototype.createFolder = function (folderUri, callback)
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
        callback(err, results);
    });
};

B2DropShare.prototype.deleteFolder = function (folderUri, callback)
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

module.exports.B2DropShare = B2DropShare;

