[![Build Status](https://travis-ci.org/feup-infolab/node-b2drop.svg?branch=master)](https://travis-ci.org/feup-infolab/node-b2drop)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/5193de70952343a8a66e9c26e004713f)](https://www.codacy.com/app/silvae86/node-b2drop?utm_source=github.com&utm_medium=referral&utm_content=feup-infolab/node-b2drop&utm_campaign=badger)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/5193de70952343a8a66e9c26e004713f)](https://www.codacy.com/app/silvae86/node-b2drop?utm_source=github.com&utm_medium=referral&utm_content=feup-infolab/node-b2drop&utm_campaign=Badge_Coverage)
[![npm version](https://badge.fury.io/js/node-b2drop.svg)](https://badge.fury.io/js/node-b2drop)
[![Chat on gitter](https://img.shields.io/gitter/room/badges/shields.svg)](https://gitter.im/feup-infolab/dendro)


node-b2drop
====
NodeJS client for B2Drop, based on OwnCloud

# Table of Contents
  * [Installation](#installation)
  * [Module Details](#module-details)
    * [B2Drop](#b2drop)
    * [B2DropShare](#b2dropshare)
  * [Examples](#examples)

            
## Installation 

    $ npm install node-b2drop --save
    
## Module Details 
 ### Introduction
    
   The module is divides in two main classes  B2drop and B2ropShare, the main reason for that
    is to give the maximum flexibility using this cloud storage service.
 
 #### B2Drop
   
   B2Drop is responsible for all operations related to user private 
   area. This operations can be divided in two groups: WebDav  and 
   the functions to extend the previous group capabilities using requests.
   
   The WebDav functions group send the user and password on every request via https.
   
   The extended features uses request and requesttoken to validate the request.
   
   #####WebDav
   ![workflow B2drop webdav](resources/flow1.png "B2drop WebDav")
   
   #####Extended Features
   ![workflow B2drop extra funcs](resources/flow3.png "B2drop request")
   
   ##### Methods
 - **`login(callback) `** - Login B2Drop service
 - **`logout(callback)`** - Logout B2Drop service 
 - **`put(fileUri, inputStream, callback)`** - Upload file to fileUri
 - **`get(fileUri, callback)`** - Get file from fileUri
 - **`delete(fileUri, callback)`** - Delete file at fileUri
 - **`createFolder (folderUri, callback)`** - Create folder in folderUri
 - **`deleteFolder (folderUri, callback)`** - Delete folder in folderUri
 - **`changeFolderSetting (folderUri, folderID, setting, callback)`** - Change folder setting (only change 1 setting for each call)
 - **`getDirectoryContents  (folderPath, callback)`** - List folder content 
 - **`getShareLink(folderUri, password, callback)`** - Create and get share link and set folder to editable and folder password  
   
 ### B2DropShare
   
   B2DropShare is responsible for all operations related to users shared area, only uses WebDav.
   
   
   ####WebDav
  ![workflow B2drop WebDav](resources/flow4.jpg "B2drop WebDav")
   
   #### Methods
  
 - **`put(fileUri, inputStream, callback)`** - Upload file to fileUri
 - **`get(fileUri, callback)`** - Get file from fileUri
 - **`delete(fileUri, callback)`** - Delete file at fileUri
 - **`createFolder(folderUri, callback)`** - Create folder in folderUri
 - **`deleteFolder(folderUri, callback)`** - Delete folder in folderUri
 - **`getDirectoryContents(folderPath, callback)`** - List folder content
    
## Examples
 - ####Login
   ```js
        const b2drop = require('node-b2drop').B2Drop;
        
        var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                    account.login(function (err, response) {
                            if(response && response.statusCode === 200) {
                                console.log("Logged in");
                            }
                        });
                    });
   ```
 - ####Upload File 
   ```js
         const b2drop = require('node-b2drop').B2Drop;
           
         var fileUri = "/" + testFile.name;
         var inputStream = fs.createReadStream(testFile.location);
   
             inputStream.on('open', function () {
                  var account = new b2drop(b2dropAccount.username, b2dropAccount.password);
                  account.put(fileUri, inputStream, function (err) {
                        if(err) {
                            console.log("failed to upload");
                        } else {
                            console.log("file uploaded");
                        }
                     });
                  });
      ```
   
## Test
    
    $ npm test

