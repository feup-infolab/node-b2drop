const util = global.util = require("../src/util");

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const uuid = require("uuid");
chai.use(chaiHttp);
const expect = chai.expect;

const fs = require("fs");
const isNull = require(util.pathInApp("src/util.js")).isNull;

const b2drop = require(util.pathInApp("src/B2Drop.js")).B2Drop;
const b2dropShare = require(util.pathInApp("src/B2DropShare.js")).B2DropShare;
const b2dropAccount = require(util.pathInApp(("test/mockData/account/b2DropAccount.js")));
const testFile = require(util.pathInApp(("test/mockData/files/docMockFile.js")));

// b2DropTestFolderUnit vars
const testPathFolder1 = "/teste1";
const dummyFolderPath = "/dummy_folder" + uuid.v4();
const passwordFolder = "ananasManga1234Alfragide";
const shareLink = "https://b2drop.eudat.eu/s/ui6aneS9aORbSzV";

const filesAreEqual = function (fileA, fileB)
{
    const md5File = require("md5-file");

    const md5FileA = md5File.sync(fileA);
    const md5FileB = md5File.sync(fileB);

    return md5FileA === md5FileB;
};

describe("[Utils]", function (done)
{
    describe("isNull", function ()
    {
        it("Should return true on null object", function (done)
        {
            if (isNull(null))
            {
                done();
            }
            else
            {
                done("isNull returned false when had null as argument");
            }
        });
        it("Should return false on not null object", function (done)
        {
            if (!isNull("D"))
            {
                done();
            }
            else
            {
                done("isNull returned true when had string as argument");
            }
        });
        it("Should return true on undefined object", function (done)
        {
            if (isNull(undefined))
            {
                done();
            }
            else
            {
                done("isNull returned false when had undefined as argument");
            }
        });
    });
});

describe("[B2Drop]", function (done)
{
    this.timeout(50000);

    before(function (done)
    {
        done();
    });

    beforeEach(function (done)
    {
        setTimeout(function ()
        {
            done();
        }, 400);
    });

    describe("[Login/out]", function ()
    {
        it("Should Login and Logout", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.login(function (err, response)
            {
                response.should.have.property("statusCode", 200);
                account.logout(function (err, response)
                {
                    response.should.have.property("statusCode", 200);
                    done();
                });
            });
        });
    });

    describe("[Create Share Link ]", function ()
    {
        it("Should succesfully get link", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.login(function (err, res)
            {
                res.should.have.property("statusCode", 200);
                account.getShareLink(testPathFolder1, passwordFolder, function (err, response, shareLink)
                {
                    console.log(shareLink);
                    response.should.have.property("statusCode", 200);
                    shareLink.should.contain("https://b2drop.eudat.eu/s/");
                    account.logout(function (err, response)
                    {
                        response.should.have.property("statusCode", 200);
                        done();
                    });
                });
            });
        });
    });

    describe("[Upload file] ", function ()
    {
        it("Should upload successfully test file private area", function (done)
        {
            var fileUri = "/" + testFile.name;
            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on("open", function ()
            {
                var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                account.put(fileUri, inputStream, function (err)
                {
                    should.not.exist(err);
                    inputStream.close();
                    done();
                });
            });
        });

        it("Should upload successfully test file shared area", function (done)
        {
            var fileUri = "/" + testFile.name;

            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on("open", function ()
            {
                var account = new b2dropShare(shareLink, passwordFolder);
                account.put(fileUri, inputStream, function (err)
                {
                    should.not.exist(err);
                    inputStream.close();
                    done();
                });
            });
        });
    });

    describe("[Download file]", function ()
    {
        it("should get successfully test file private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var fileUri = "/" + testFile.name;
            var outputStream = fs.createWriteStream(testFile.download_location);

            account.get(fileUri, outputStream, function (err, result)
            {
                should.not.exist(err);
                var renamedFilePath = global.util.pathInApp("/test/mockData/files/test_downloads/docTest.doc");
                fs.rename(testFile.download_location, renamedFilePath, function (err)
                {
                    const allOk = filesAreEqual(testFile.location, renamedFilePath);
                    if (allOk)
                    {
                        done();
                    }
                    else
                    {
                        done("Downloaded file is not equal to mock file. Corrupted transfer?");
                    }
                });
            });
        });

        it("Should get successfully test file shared area", function (done)
        {
            var account = new b2dropShare(shareLink, passwordFolder);
            var fileUri = "/" + testFile.name;
            var outputStream = fs.createWriteStream(testFile.download_location);
            account.get(fileUri, outputStream, function (err, result)
            {
                var renamedFilePath = global.util.pathInApp("/test/mockData/files/test_downloads/docTest.doc");
                fs.rename(testFile.download_location, renamedFilePath, function (err)
                {
                    const allOk = filesAreEqual(testFile.location, renamedFilePath);
                    if (allOk)
                    {
                        done();
                    }
                    else
                    {
                        done("Downloaded file is not equal to mock file. Corrupted transfer?");
                    }
                });
            });
        });
    });

    describe("[Delete file]", function ()
    {
        it("should delete successfully test file private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var fileUri = "/" + testFile.name;
            account.delete(fileUri, function (err, res)
            {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });

        it("Should delete successfully test file shared area", function (done)
        {
            var account = new b2dropShare(shareLink, passwordFolder);
            var fileUri = "/" + testFile.name;
            account.delete(fileUri, function (err, res)
            {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });
    });

    describe("[Create Folder]", function ()
    {
        it("Should successfully create folder in private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var folderUri = dummyFolderPath;
            account.createFolder(folderUri, function (err, res)
            {
                should.not.exist(err);
                done();
            });
        });

        it("Should  successfully create folder in shared area", function (done)
        {
            var account = new b2dropShare(shareLink, passwordFolder);
            var folderUri = dummyFolderPath;
            account.createFolder(folderUri, function (err, res)
            {
                should.not.exist(err);
                done();
            });
        });

        it("Should  successfully create folder structure in private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var folderUri = dummyFolderPath + "/filho/neto/bisneto/trineto/tetraneto";
            account.createFolder(folderUri, function (err, res)
            {
                should.not.exist(err);
                done();
            });
        });

        it("Should  successfully create folder structure in shared area", function (done)
        {
            var account = new b2dropShare(shareLink, passwordFolder);
            var folderUri = dummyFolderPath + "/filho/neto/bisneto/trineto/tetraneto";
            account.createFolder(folderUri, function (err, res)
            {
                should.not.exist(err);
                done();
            });
        });
    });

    describe("[Upload file to inside a Folder]", function ()
    {
        it("Should  successfully create a file inside the new folder in private area", function (done)
        {
            var fileUri = dummyFolderPath + "/" + testFile.name;
            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on("open", function ()
            {
                var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                account.put(fileUri, inputStream, function (err)
                {
                    should.not.exist(err);
                    inputStream.close();
                    done();
                });
            });
        });
    });

    describe("[Upload file to inside Folder structure]", function ()
    {
        it("Should  successfully create a file inside the new folder in private area", function (done)
        {
            var fileUri = dummyFolderPath + "/filho/neto/bisneto/trineto/tetraneto/" + testFile.name;
            var inputStream = fs.createReadStream(testFile.location);

            inputStream.on("open", function ()
            {
                var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                account.put(fileUri, inputStream, function (err)
                {
                    should.not.exist(err);
                    inputStream.close();
                    done();
                });
            });
        });
    });

    describe("[Delete File inside Folder]", function ()
    {
        it("Should  successfully delete folder in private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var fileUri = dummyFolderPath + "/" + testFile.name;
            account.delete(fileUri, function (err, res)
            {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });
    });

    describe("[Delete File inside Folder structure]", function ()
    {
        it("Should  successfully delete folder in private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var fileUri = dummyFolderPath + "/filho/neto/bisneto/trineto/tetraneto/" + testFile.name;
            account.delete(fileUri, function (err, res)
            {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });
    });

    describe("[Delete Folder]", function ()
    {
        it("Should  successfully delete folder in private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var folderUri = dummyFolderPath;
            account.deleteFolder(folderUri, function (err, res)
            {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });

        it("Should  fail delete folder in private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var folderUri = dummyFolderPath + "thatDontExist";
            account.deleteFolder(folderUri, function (err, res)
            {
                should.not.exist(res);
                should.exist(err);
                done();
            });
        });

        it("Should  successfully delete folder in shared area", function (done)
        {
            var account = new b2dropShare(shareLink, passwordFolder);
            var folderUri = dummyFolderPath;
            account.deleteFolder(folderUri, function (err, res)
            {
                should.not.exist(err);
                res.should.have.status(204);
                done();
            });
        });

        it("Should  fail delete folder in shared area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            var folderUri = dummyFolderPath + "thatDontExist";
            account.deleteFolder(folderUri, function (err, res)
            {
                should.not.exist(res);
                should.exist(err);
                done();
            });
        });
    });

    describe("[List Folder]", function ()
    {
        it("Should  succesfully list folder private area", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.getDirectoryContents("/", function (err, resp)
            {
                should.not.exist(err);
                expect(resp).to.be.an("array");
                console.log(JSON.stringify(resp, undefined, 2));
                done();
            });
        });

        it("Should fail listing folder in private area that doens't exists", function (done)
        {
            var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
            account.getDirectoryContents("/folderThatdoenstExist", function (err, resp)
            {
                should.exist(err);
                should.not.exist(resp);
                done();
            });
        });

        it("Should  successfully list folder public area", function (done)
        {
            var account = new b2dropShare(shareLink, passwordFolder);
            account.getDirectoryContents("/", function (err, resp)
            {
                should.not.exist(err);
                expect(resp).to.be.an("array");
                console.log(JSON.stringify(resp, undefined, 2));
                done();
            });
        });

        it("Should fail listing folder in public area that doens't exists", function (done)
        {
            var account = new b2dropShare(shareLink, passwordFolder);
            account.getDirectoryContents("/folderThatdoenstExist", function (err, resp)
            {
                should.exist(err);
                should.not.exist(resp);
                done();
            });
        });
    });

    after(function (done)
    {
        done();
    });
})
;

