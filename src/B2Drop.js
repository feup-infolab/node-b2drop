const util = require("./util");
const Uri = require("./util").Uri;
let request = require("request");
request = request.defaults({jar: true});
const cheerio = require("cheerio");
const qs = require("querystring");
const isNull = require("./util").isNull;
const Client = require("./Client").Client;

class B2Drop extends Client
{
    constructor (username, password)
    {
        super(util.Uri.webdavPrivateUri, username, password);
    }

    getAuthToken (callback)
    {
        let self = this;

        request.get({
            url: util.Uri.loginUri,
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
    }

    changeFolderSetting (folderUri, folderID, setting, callback)
    {
        let self = this;

        var queryString;

        request.put({
            url: util.Uri.shareLinkRequest + "/" + folderID + "?format=json",
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
                url: util.Uri.shareLinkRequest + "?" + queryString,
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
    }

    getShareLink (folderUri, password, callback)
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
    }

    getQuota (callback)
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
    }
}

module.exports.B2Drop = B2Drop;
