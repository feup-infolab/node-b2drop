const Pathfinder = global.Pathfinder;
const md5File = require("md5-file");
const uuid = require("uuid");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

const tempFolder = global.util.pathInApp("/test/mockData/files/test_downloads");

rimraf.sync(tempFolder);
mkdirp.sync(tempFolder);

module.exports = {
    md5 : md5File.sync(global.util.pathInApp("/test/mockData/files/test_uploads/docTest.doc")),
    name : "docTest_" + uuid.v4() + ".doc" ,
    extension : "doc",
    location : global.util.pathInApp("/test/mockData/files/test_uploads/docTest.doc"),
    download_location : global.util.pathInApp("/test/mockData/files/test_downloads/" + "docTest_" + uuid.v4() + ".doc"),
    metadata: [{
        prefix:"nie",
        shortName:"plainTextContent",
        value:"This is a test of an upload for the Dendro platform in Word Document (DOC) Format."
    }]
};