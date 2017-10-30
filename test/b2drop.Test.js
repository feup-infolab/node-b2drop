global.util = require("../src/util");

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const uuid = require("uuid");
chai.use(chaiHttp);
const expect = chai.expect;

const fs = require("fs");

const b2drop = require(util.pathInApp("src/B2Drop.js")).B2Drop;
const b2dropShare = require(util.pathInApp("src/B2DropShare.js")).B2DropShare;
const b2dropAccount = require(util.pathInApp(("test/mockData/account/b2DropAccount.js")));
const testFile = require(util.pathInApp(("test/mockData/files/docMockFile.js")));

//b2DropTestFolderUnit vars
const testPathFolder1 = '/teste1';
const dummyFolderPath = "/dummy_folder" + uuid.v4();
const passwordFolder = "ananasManga1234Alfragide";
const shareLink = "https://b2drop.eudat.eu/s/ui6aneS9aORbSzV";

const filesAreEqual = function (fileA, fileB) {
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
        it("Should upload successfully test file private area", function (done) {
            var fileUri = "/" + testFile.name;
            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on('open', function () {
                var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                account.put(fileUri, inputStream, function (err) {
                    should.not.exist(err);
                    inputStream.close();
                    done();
                });
            });
        });

        it("Should upload successfully test file shared area", function (done) {
            var fileUri = "/" + testFile.name;

            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on('open', function () {
                var account = new b2dropShare(shareLink, passwordFolder);
                account.put(fileUri, inputStream, function (err) {
                    should.not.exist(err);
                    inputStream.close();
                    done();
                });
            });
        });
    });

    describe("[Download file]", function () {
        it("should get successfully test file private area", function (done) {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var fileUri = "/" + testFile.name;
            var outputStream = fs.createWriteStream(testFile.download_location);

            account.get(fileUri, function (err, inputStream) {
                should.not.exist(err);
                should.exist(inputStream);
                outputStream.on('finish', function () {
                    const allOk = filesAreEqual(testFile.location, testFile.download_location);
                    if (allOk) {
                        done();
                    }
                    else {
                        done("Downloaded file is not equal to mock file. Corrupted transfer?");
                    }
                });

                outputStream.on('error', function () {
                    done("Failed to pipe file from cloud server.");
                });

                inputStream.pipe(outputStream);
            });
        });


        it("Should get successfully test file shared area", function (done) {
            var account = new b2dropShare(shareLink,passwordFolder);
            var fileUri = "/" + testFile.name;
            var outputStream = fs.createWriteStream(testFile.download_location);
            account.get(fileUri, function (err, inputStream) {
                should.not.exist(err);
                should.exist(inputStream);

                outputStream.on('finish', function () {
                    const allOk = filesAreEqual(testFile.location, testFile.download_location);
                    if (allOk) {
                        done();
                    }
                    else {
                        done("Downloaded file is not equal to mock file. Corrupted transfer?");
                    }
                });

                outputStream.on('error', function () {
                    done("Failed to pipe file from cloud server.");
                });

                inputStream.pipe(outputStream);
            });
        });
    });

    describe("[Delete file]", function () {
        it("should delete succesfully test file private area", function (done) {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var fileUri = "/" + testFile.name;
            account.delete(fileUri, function (err, res) {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });

        it("Should delete succesfully test file shared area", function (done) {
            var account = new b2dropShare(shareLink, passwordFolder);
            var fileUri = "/" + testFile.name;
            account.delete(fileUri, function (err, res) {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });

    });

    describe("[Create Folder]", function () {
        it("Should  succesfully create folder in private area", function (done) {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var folderUri = dummyFolderPath;
            account.createFolder(folderUri, function (err, res) {
                should.not.exist(err);
                res.should.have.status(201);
                done();
            });
        });

        it("Should  succesfully create folder in shared area", function (done) {
            var account = new b2dropShare(shareLink, passwordFolder);
            var folderUri = dummyFolderPath;
            account.createFolder(folderUri, function (err, res) {
                should.not.exist(err);
                res.should.have.status(201);
                done();
            });
        });
    });


    describe("[Delete Folder]", function () {
        it("Should  succesfully delete folder in private area", function (done) {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var folderUri = dummyFolderPath;
            account.deleteFolder(folderUri, function (err, res) {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });

        it("Should  succesfully delete folder in shared area", function (done) {
            var account = new b2dropShare(shareLink, passwordFolder);
            var folderUri = dummyFolderPath;
            account.deleteFolder(folderUri, function (err, res) {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });
    });


    describe("[List Folder]", function () {
        it("Should  succesfully list folder private area", function (done) {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.getDirectoryContents("/", function (err, resp) {
                should.not.exist(err);
                expect(resp).to.be.an('array');
                console.log(JSON.stringify(resp, undefined, 2));
                done();
            })
        });

        it("Should  succesfully list folder public area", function (done) {
            var account = new b2dropShare(shareLink, passwordFolder);
            account.getDirectoryContents("/", function (err, resp) {
                should.not.exist(err);
                expect(resp).to.be.an('array');
                console.log(JSON.stringify(resp, undefined, 2));
                done();
            })
        });

    });

    after(function (done) {
        done();
    });
})
;

