import imageKit from "imagekit";
import { env } from "process";

export const imageKitFacade = (base64Img, imageName) => {
  return new Promise((resolve, reject) => {
    const resolver = new imageKit({
      publicKey: env.IMAGEKIT_PUBLIC_KEY,
      privateKey: env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
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
          resolve(result);
        }
      }
    );
  });
};

export const  isBase64String = (str) => {
  const regex = /^data:image\/([a-zA-Z]*);base64,([^\s]*)$/;

  return regex.test(str);
}
