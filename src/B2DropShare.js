const createClient = require("webdav");

const Uri = {
    webdavShareUri: 'https://b2drop.eudat.eu/public.php/webdav',
}

function B2DropShare(sharelink, password) {
    let self = this;

    self.connection = createClient(
        Uri.webdavShareUri,
        sharelink.split("/s/")[1],
        password
    );
}


B2DropShare.prototype.getDirectoryContents = function (folderPath, callback) {

    let self = this;

    self.connection.getDirectoryContents(folderPath)
        .then(function (contents) {
                return callback(null, contents);
            },
            function (error) {
                return callback(error, null);

            }
        );
}


B2DropShare.prototype.put = function (fileUri, inputStream, callback) {
    let self = this;

    const outputStream = self.connection.createWriteStream(fileUri);

    outputStream.on("finish", function () {
        callback(null);
    });

    outputStream.on("error", function () {
        callback("Error sending file to " + fileUri);
    });

    inputStream.pipe(outputStream);
}


B2DropShare.prototype.get = function (fileUri, callback) {
    const self = this;

    const stream = self.connection.createReadStream(fileUri);

    return callback(null, stream);
}


B2DropShare.prototype.delete = function (fileUri, callback) {
    const self = this;

    self.connection.deleteFile(fileUri)
        .then(function (resp) {
            return callback(null, resp);
        }, function (err) {
            return callback(err, null);
        })
}


B2DropShare.prototype.createFolder = function (folderUri, callback) {

    const self = this;

    self.connection.createDirectory(folderUri)
        .then(function (resp) {
            return callback(null, resp);
        }, function (err) {
            return callback(err, null);
        });
}

B2DropShare.prototype.deleteFolder = function (folderUri, callback) {
    const self = this;

    self.connection.deleteFile(folderUri)
        .then(function (resp) {
            return callback(null, resp);
        }, function (err) {
            return callback(err, null);
        })
}

module.exports.B2DropShare = B2DropShare;

