import express from "express";
import webpush from "web-push";
import moment from "moment-timezone";

 
import {
  migrateDbSeedAclAsocciatePermissionsToRole,
  migrateDbSeedAclPermissions,
  migrateDbSeedAdminUser,
  migrateDbSeedLanguageAndCurrency,
  migrateFrontendComponentsByDefault,
  migrateUserTypes,
} from "../../prisma/seed.js";
import { env } from "process";
import ImageKit from "imagekit";
import bodyParser from "body-parser";
import { imageKitFacade } from "../facades/imagekit.js";
import { generateRandomString } from "../facades/str.js";
import { fetchLinkDetails } from "../facades/linkDetailsFetcher.js";
import { generateKpi } from "../facades/adminFacade.js";
//  import { makeImage } from "../facades/makeImage.js";

const router = express.Router();

router.use(bodyParser.json({ limit: "150mb" }));
router.use(
  bodyParser.urlencoded({
    limit: "150mb",
    extended: true,
    parameterLimit: 500000,
  })
);
router.use(bodyParser.text({ limit: "2000mb" }));

router.post("/saveImage", async (req, res) => {
  //get push subscription object from the request
  const image = req.body;

  const imageGenerate: any = await imageKitFacade(
    image,
    generateRandomString(7)
  );

  if (imageGenerate) {
    res.status(200).json({
      url: imageGenerate.url as string,
      thumbnailUrl: imageGenerate.thumbnailUrl,
    });
  } else {
    res.status(500);
  }
});

router.post("/generateKpis", async (req, res) => {
  //get push subscription object from the request
  await generateKpi();
  
  
  res.status(200).json({});
});

router.post("/subscribe", (req, res) => {
  //get push subscription object from the request
  const subscription = req.body;
  console.log(subscription);

  //send status 201 for the request
  res.status(201).json({});

  //create payload: specify the details of the push notification
  const payload = JSON.stringify({ title: "Section.io Push Notification" });

  //pass the object into sendNotification function and catch any error
  webpush
    .sendNotification(subscription, payload)
    .catch((err) => console.error(err));
});

router.get("/migrate", (req, res) => {
  // return res.send("not available");
  try {
    migrateDbSeedLanguageAndCurrency();
    migrateDbSeedAclPermissions();
    migrateDbSeedAclAsocciatePermissionsToRole();
    migrateDbSeedAdminUser();
    migrateUserTypes();
    return "ok";
  } catch (error) {
    console.log(error);
  }
});

router.get("/migrate/userType", (req, res) => {
  // return res.send("not available");
  try {
    migrateUserTypes();
    return "ok";
  } catch (error) {
    console.log(error);
  }
});
router.get("/migrate/frontend-components", (req, res) => {
  // return res.send("not available");
  try {
    migrateFrontendComponentsByDefault();
    return "ok";
  } catch (error) {
    console.log(error);
  }
});

router.get("/test", (req, res) => {
  const subscription = req.body;

  //send status 201 for the request
  res.status(201).json({});

  //create payload: specify the details of the push notification
  const payload = JSON.stringify({ title: "Section.io Push Notification" });
  webpush
    .sendNotification(subscription, payload)
    .catch((err) => console.error(err));
});

router.get("/get-link-details", async (req, res) => {
  const link = req.query.link; // Obtiene el enlace de los parámetros de la solicitud

  if (!link) {
    return res.status(400).json({ error: "Missing link parameter" });
  }

  const linkDetails = await fetchLinkDetails(link as string);
  res.json(linkDetails);
});

// router.get("/generate-post-image", async (req, res) => {
//   const postId = req.query.postId; // Obtiene el enlace de los parámetros de la solicitud

//   if (!postId) {
//     return res.status(400).json({ error: "Missing postId parameter" });
//   }

//   const linkDetails = await makeImage(postId as string);
//   res.json(linkDetails);
// });

router.get("/authimagekit", (req, res) => {
  const imagekit = new ImageKit({
    publicKey: "public_y8F60KW3dcPoPRWjJihL9GaRWwA=",
    privateKey: "private_Tu3YPqvUkxk6/FfLWlvvpoG9ujU=",
    urlEndpoint: "https://ik.imagekit.io/cluzstudio",
  });

  ///const currentTimeInSeconds = Math.floor(Date.now() / 1000); // obtener la hora actual en segundos
  const currentTimeInSeconds: number = moment().tz("America/Sao_Paulo").unix();
  const expireTimeInSeconds: number = moment()
    .tz("America/Sao_Paulo")
    .add(30, "minutes")
    .unix();

  const authParams = imagekit.getAuthenticationParameters(
    undefined,
    expireTimeInSeconds
  );

  res.send(authParams);
});

router.post("/upload_files", (req: any, res) => {
  try {
    const imageKit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    imageKit.upload(
      {
        file: req.body.filepath,
        fileName: req.body.filename,
        folder: "creo_red/publications",
      },
      function (err, response) {
        if (err) {
          return res.status(500).json({
            status: "failed",
            message: err.message,
          });
        } else {
          const { url } = response;

          res.json({
            status: "success",
            message: "Successfully uploaded files",
            url: url,
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
});

export default router;
