// import { createCanvas, loadImage } from "canvas";
// import * as fs from "fs"; //

// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export const makeImage = async (postId: string | number) => {
//   const postIdNum = typeof postId === "number" ? postId : parseInt(postId);

//   const publication = await prisma.publication.findFirst({
//     where: {
//       id: postIdNum,
//     },
//     include: {
//       contents: true,
//     },
//   });

//   //If not is article generate image from user
//   const user = await prisma.user.findFirst({
//     where: {
//       id: publication.userId,
//     },
//   });

//   if (user) {
//     const width = 1200;
//     const height = 627;

//     const imagePosition = {
//       w: 200,
//       h: 44,
//       x: 500,
//       y: 75,
//     };

//     // Extract the starting Y value for the title's position, which
//     // we'll move if we add a second line.
//     const titleY = 210;
//     // Set the line height of the text, which varies based on the
//     // font size and family.
//     const lineHeight = 77;
//     const authorY = 520;

//     const canvas = createCanvas(width, height); // Usa createCanvas del módulo canvas
//     const context = canvas.getContext("2d");

//     const gradient = context.createLinearGradient(0, 0, 0, height);
//     gradient.addColorStop(0, "#4299E1"); // Azul intenso
//     gradient.addColorStop(1, "#87CEEB"); // Azul cielo

//     context.fillStyle = gradient;
//     context.fillRect(0, 0, width, height);

//     context.font = "bold 53pt Roboto";
//     context.textAlign = "center";
//     context.fillStyle = "#fff";

//     const text = formatTitle(
//       publication.contents.filter((content) => content.type === "TEXT")[0]
//         .content ?? ""
//     );
//     context.fillText(text[0], 600, titleY);
//     // If we need a second line, we move use the titleY and lineHeight
//     // to find the appropriate Y value.
//     if (text[1]) context.fillText(text[1], 600, titleY + lineHeight);
//     if (text[2]) context.fillText(text[2], 600, titleY + lineHeight * 2);

//     context.font = "33pt Roboto";
//     context.fillText(`by @${user.username}`, 600, authorY);

//     console.log(text);

//     loadImage("./assets/logo.png").then((image) => {
//       const { w, h, x, y } = imagePosition;
//       context.drawImage(image, x, y, w, h);

//       const buffer = canvas.toBuffer("image/png");
//       fs.writeFileSync("./temp/image.png", buffer);
//     });
//   }
// };

// const getMaxNextLine = (input, maxChars = 20) => {
//   // Split the string into an array of words.
//   const allWords = input.split(" ");
//   // Find the index in the words array at which we should stop or we will exceed
//   // maximum characters.
//   const lineIndex = allWords.reduce((prev, cur, index) => {
//     if (prev?.done) return prev;
//     const endLastWord = prev?.position || 0;
//     const position = endLastWord + 1 + cur.length;
//     return position >= maxChars ? { done: true, index } : { position, index };
//   });
//   // Using the index, build a string for this line ...
//   const line = allWords.slice(0, lineIndex.index).join(" ");
//   // And determine what's left.
//   const remainingChars = allWords.slice(lineIndex.index).join(" ");
//   // Return the result.
//   return { line, remainingChars };
// };

// const formatTitle = (title) => {
//   let output = [];

//   if (title.length >= 40) {
//     const firstLine = getMaxNextLine(title);
//     const secondLine = getMaxNextLine(firstLine.remainingChars);
//     const thirdLine = getMaxNextLine(secondLine.remainingChars);

//     output = [firstLine.line, secondLine.line, thirdLine.line];
//   } else if (title.length >= 20) {
//     const firstLine = getMaxNextLine(title, title.length / 2);
//     const secondLine = getMaxNextLine(firstLine.remainingChars);

//     output = [firstLine.line, secondLine.line];
//   } else {
//     output = [title];
//   }

//   if (output.length > 0) {
//     const lastLine = output[output.length - 1];
//     if (lastLine.length > 0) {
//       output[output.length - 1] = lastLine + " ...";
//     }
//   }

//   return output;
// };
