const express = require("express");
const uploadFile = express.Router();
uploadFile.get("/", function (req, res) {
    var ImageKit = require("imagekit");
    var fs = require("fs");
    var imagekit = new ImageKit({
        publicKey: "public_1dUhzEW8Sc5D7TuoLosMWsIsddw=",
        privateKey: "private_tCnAYjkGZ0dJK8G7TYJYLeC1CI0=",
        urlEndpoint: "https://ik.imagekit.io/cluzstudio",
    });
    return imagekit.getAuthenticationParameters();
    //   fs.readFile("image.jpg", function (err, data) {
    //     if (err) throw err; // Fail if the file can't be read.
    //     imagekit.upload(
    //       {
    //         file: data, //required
    //         fileName: "my_file_name.jpg", //required
    //         tags: ["tag1", "tag2"],
    //       },
    //       function (error, result) {
    //         if (error) console.log(error);
    //         else console.log(result);
    //       }
    //     );
    //   });
});
uploadFile.post("/", function (req, res) {
    res.send("POST handler for /dogs route.");
});
module.exports = uploadFile;
