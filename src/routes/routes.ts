import express from "express";
import webpush from "web-push";
import bodyParser from "body-parser";
import { imageKitFacade } from "../facades/imagekitFacade.js";
import { generateRandomString } from "../facades/strFacade.js";
import { generateKpi } from "../facades/adminFacade.js";
import { handleWebhook } from "../facades/clerkFacade.js";

const router = express.Router();

router.post("/saveImage", async (req, res) => {
  const image = JSON.parse(req.body);  
 
  if (Array.isArray(image)) {
    const imagesGenerate: any = await Promise.all(
      image.map(async (img: any) => {
        const imageGenerate: any = await imageKitFacade(
          img,
          generateRandomString(7)
        );

        if (imageGenerate.error) {
          console.log("Error", imageGenerate.error);
          return res.status(500).json({ error: imageGenerate.error });
        }

        return {
          url: imageGenerate.result.url as string,
          thumbnailUrl: imageGenerate.result.thumbnailUrl,
        };
      })
    );

    if (imagesGenerate) {
      res.status(200).json(imagesGenerate);
    } else {
      res.status(500);
    }
  } else {
    const imageGenerate: any = await imageKitFacade(
      image,
      generateRandomString(7)
    );

    if (imageGenerate.error) {
      console.log("Error", imageGenerate.error);
      return res.status(500).json({ error: imageGenerate.error });
    }

    const reponse = {
      url: imageGenerate.result.url as string,
      thumbnailUrl: imageGenerate.result.thumbnailUrl,
    };

    if (imageGenerate) {
      res.status(200).json(reponse);
    } else {
      res.status(500);
    }
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
