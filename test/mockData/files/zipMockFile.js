const util = require("../../../src/util");
const md5File = require("md5-file");
const uuid = require("uuid");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

const tempFolder = util.pathInApp("/test/mockData/files/test_downloads");

rimraf.sync(tempFolder);
mkdirp.sync(tempFolder);

module.exports = {
    md5: md5File.sync(util.pathInApp("/test/mockData/files/test_uploads/zipTest.zip")),
    name: "zipTest_" + uuid.v4() + ".zip",
    extension: "zip",
    location: util.pathInApp("/test/mockData/files/test_uploads/zipTest.zip"),
    download_location: util.pathInApp("/test/mockData/files/test_downloads/" + "zipTest_" + uuid.v4() + ".zip"),
    metadata: [{
        prefix: "nie",
        shortName: "plainTextContent",
        value: "This is a test of an upload for the Dendro platform in ZIP archive (ZIP) Format."
    }]
};
