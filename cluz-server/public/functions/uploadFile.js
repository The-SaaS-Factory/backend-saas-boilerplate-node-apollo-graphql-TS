import cloudinary from 'cloudinary';
// A simple function to upload to Cloudinary
export const uploadFile = async (file) => {
    // The Upload scalar return a a promise
    const { createReadStream } = await file;
    const fileStream = createReadStream();
    // Initiate Cloudinary with your credentials
    cloudinary.v2.config({
        cloud_name: "dsb0u1zbk",
        api_key: "423513139335112",
        api_secret: "ywxo3Ng8OlaFiknUwia7Ywix4fM"
    });
    // Return the Cloudinary object when it's all good
    return new Promise((resolve, reject) => {
        const cloudStream = cloudinary.v2.uploader.upload_stream(function (err, fileUploaded) {
            // In case something hit the fan
            if (err) {
                reject(err);
            }
            // All good :smile:
            resolve(fileUploaded);
        });
        fileStream.pipe(cloudStream);
    });
};
