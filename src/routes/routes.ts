import express from "express";
import webpush from "web-push";
import bodyParser from "body-parser";
import { imageKitFacade } from "../facades/imagekitFacade.js";
import { generateRandomString } from "../facades/strFacade.js";
import { generateKpi } from "../facades/adminFacade.js";

const router = express.Router();

router.use(bodyParser.json({ limit: "150mb" }));
router.use(
  bodyParser.urlencoded({
    limit: "150mb",
    extended: true,
    parameterLimit: 50000,
  })
);
router.use(bodyParser.text({ limit: "2000mb" }));

router.post("/saveImage", async (req, res) => {
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
 

export default router;
