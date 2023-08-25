//create an service with express for upload multiple files to aws s3
 
    import express from 'express';
    import * as multer from 'multer';
    import * as multerS3 from 'multer-s3';
    import * as aws from 'aws-sdk';
    import * as dotenv from 'dotenv';
    import cors from 'cors';
    import * as bodyParser from 'body-parser';

    dotenv.config();

    const app = express();

    app.use(cors());

    app.use(bodyParser.json());

    app.use(bodyParser.urlencoded({ extended: true }));

    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    const upload = multer({
        storage: multerS3({
            s3: s3,
            bucket: process.env.AWS_BUCKET_NAME,
            acl: 'public-read',
            key: function (req , file, cb) {
                cb(null, {fieldName: file.fieldname + Date.now().toString()});
            }

        }),
        limits: { fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
        fileFilter(req, file, cb) {
            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                return cb(new Error('Please upload a image'))
            }

            cb(undefined, true)
        }


    });

    app.post('/upload', upload.array('file', 10), (req, res, next) => {
        res.send(req.files);
    });

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    }

  
 
