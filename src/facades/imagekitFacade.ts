import imageKit from "imagekit";
import { getSuperAdminSetting } from "./adminFacade.js";

export const imageKitFacade = async (base64Img, imageName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const IMAGEKIT_PUBLIC_KEY = await getSuperAdminSetting(
        "IMAGEKIT_PUBLIC_KEY"
      );
      const IMAGEKIT_PRIVATE_KEY = await getSuperAdminSetting(
        "IMAGEKIT_PRIVATE_KEY"
      );
      const IMAGEKIT_URL_ENDPOINT = await getSuperAdminSetting(
        "IMAGEKIT_URL_ENDPOINT"
      );

      if (
        !IMAGEKIT_PUBLIC_KEY ||
        !IMAGEKIT_PRIVATE_KEY ||
        !IMAGEKIT_URL_ENDPOINT
      ) {
        throw new Error("ImageKit settings not found");
      }

      const resolver = new imageKit({
        publicKey: IMAGEKIT_PUBLIC_KEY,
        privateKey: IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: IMAGEKIT_URL_ENDPOINT,
      });

      resolver.upload(
        {
          file: base64Img,
          fileName: imageName,
          isPrivateFile: false,
        },
        function (error, result) {
          if (error) {
            reject(new Error("Failed uploading file"));
          } else {
            resolve({ error: null, result: result });
          }
        }
      );
    } catch (error) {
       reject({ error: error, result: null });
    }
  });
};

export const isBase64String = (str) => {
  const regex = /^data:image\/([a-zA-Z]*);base64,([^\s]*)$/;
  return regex.test(str);
};
