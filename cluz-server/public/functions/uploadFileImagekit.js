import ImageKit from "imagekit";
const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});
const uploadFileImagekit = (req, res) => {
    if (req.file) {
        imageKit.upload({
            file: req.file,
            fileName: req.filename,
            folder: 'user_avatars'
        }, function (err, response) {
            if (err) {
                return res.status(500).json({
                    status: "failed",
                    message: "An error occured during file upload. Please try again."
                });
            }
            res.json({ status: "success", message: "Successfully uploaded files" });
        });
    }
};
export default uploadFileImagekit;
