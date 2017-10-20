global.util = require("../src/util");

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const uuid = require("uuid");
chai.use(chaiHttp);

const fs = require("fs");

const b2drop = require(util.pathInApp("src/B2Drop.js")).B2Drop;
const b2dropAccount = require(util.pathInApp(("test/mockData/account/b2DropAccount.js")));
const testFile = require(util.pathInApp(("test/mockData/files/docMockFile.js")));

//b2DropTestFolderUnit vars
const testPathFolder1 = '/teste1';
const dummyFolderPath = testPathFolder1 + "/dummy_folder" + uuid.v4();
const invalidPasswordFolder = "gg";
const passwordFolder = "ananasManga1234Alfragide";
const shareLink = "https://b2drop.eudat.eu/s/ui6aneS9aORbSzV";

const filesAreEqual = function(fileA, fileB)
{
    const md5File = require("md5-file");

    const md5FileA = md5File.sync(fileA);
    const md5FileB = md5File.sync(fileB);

    return md5FileA === md5FileB;
}

describe("[B2Drop]", function (done) {
    this.timeout(50000);

    before(function (done) {
        done();
    });

    describe("[Login/out]", function () {
        it("Should Login and Logout", function (done) {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.login(function (err, response) {
                response.should.have.property('statusCode', 200);
                account.logout(function (err, response) {
                    response.should.have.property('statusCode', 200);
                    done();
                });
            });
        })
    });


    describe("[Create Share Link ]", function () {
        it("Should succesfully get link", function (done) {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.login(function (err, res) {
                res.should.have.property('statusCode', 200);
                account.getShareLink(testPathFolder1, passwordFolder, function (err, response, shareLink) {
                    console.log(shareLink);
                    response.should.have.property('statusCode', 200);
                    shareLink.should.contain("https://b2drop.eudat.eu/s/");
                    account.logout(function (err, response) {
                        response.should.have.property('statusCode', 200);
                        done();
                    });
                });
            })
        });
    });


    describe("[Upload file] ", function () {
        it("Should upload successfully test file", function (done) {
            var fileUri = "/" + testFile.name;

            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on('open', function () {
                var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                account.initiateWebDavShareLink(shareLink, passwordFolder, function (err, res) {
                    res.should.have.property('statusCode', 303);
                    account.put(fileUri, inputStream, function (err) {
                        should.not.exist(err);
                        inputStream.close();
                        done();
                    });
                });
            });
        });
    });

    describe("[Download file]", function () {
        it("Should get successfully test file", function (done) {
            var account = new b2drop();
            var fileUri = "/" + testFile.name;
            var outputStream = fs.createWriteStream(testFile.download_location);
            account.initiateWebDavShareLink(shareLink, passwordFolder, function (err, res) {
                should.not.exist(err);
                res.should.have.property('statusCode', 303);
                account.get(fileUri, function (err, inputStream) {
                    should.not.exist(err);
                    should.exist(inputStream);

                    outputStream.on('finish', function(){
                        const allOk = filesAreEqual(testFile.location, testFile.download_location);
                        if(allOk)
                        {
                            done();
                        }
                        else
                        {
                            done("Downloaded file is not equal to mock file. Corrupted transfer?");
                        }
                    });

                    outputStream.on('error', function(){
                        done("Failed to pipe file from cloud server.");
                    });

                    inputStream.pipe(outputStream);
                });
            });
        });
    });

    describe("[Delete file]", function () {
        it("Should delete succesfully test file", function (done) {
            var account = new b2drop();
            var fileUri = "/" + testFile.name;
            account.initiateWebDavShareLink(shareLink, passwordFolder, function (err, res) {
                should.not.exist(err);
                res.should.have.property('statusCode', 303);
                account.delete(fileUri, function (err, res) {
                    should.not.exist(err);
                    res.should.have.status(204);
                    done();
                });
            });
        });

    });

    describe("[Create Folder]", function () {
        it("Should  succesfully create folder", function (done) {
            var account = new b2drop();
            var fileUri = dummyFolderPath;
            account.initiateWebDavShareLink(shareLink, passwordFolder, function (err, res) {
                should.not.exist(err);
                res.should.have.property('statusCode', 303);
                account.createFolder(folderUri, passwordFolder, function (err, res) {
                    res.should.have.status(200);
                    done();
                });
            });
        });
    });

    describe("[List Folder]", function () {
        it("Should  succesfully list folder", function (done) {
            var account = new b2drop("", "");
            account.initiateWebDavShareLink(shareLink, passwordFolder, function (err, res) {
                res.should.have.status(200);
                account.getDirectoryContents("/", function (err, resp) {
                    console.log(err);
                    resp.should.have.status(207);
                    done();
                })
            });


        });
    });

    after(function (done) {
        done();
    });
});

