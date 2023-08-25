import fetch from "node-fetch";
import cheerio from "cheerio";

export const fetchLinkDetails = async (link: string) => {
  try {
    const response = await fetch(link);
    const html = await response.text();

    const $ = cheerio.load(html);
    const title = $("meta[property='og:title']").attr("content");
    const description = $("meta[property='og:description']").attr("content");
    const image = $("meta[property='og:image']").attr("content");

    return {
      title,
      description,
      image,
    };
  } catch (error) {
    console.error("Error fetching link details:", error);
    return null;
  }
};
 
