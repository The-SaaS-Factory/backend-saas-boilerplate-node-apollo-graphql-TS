import { create } from "xmlbuilder2";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { env } from "process";

const prisma = new PrismaClient();
const sitemap = Router();

function generateSitemap(users: any) {
  const xml = create({ version: "1.0", encoding: "UTF-8" }).ele("urlset", {
    xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
  });

  xml.ele("url").ele("loc").txt(`${env.APP_DOMAIN_FRONT}/`);
  xml.ele("url").ele("loc").txt(`${env.APP_DOMAIN_FRONT}/es`);
  xml.ele("url").ele("loc").txt(`${env.APP_DOMAIN_FRONT}/pt`);
  xml.ele("url").ele("loc").txt(`${env.APP_DOMAIN_FRONT}/en`);
  xml.ele("url").ele("loc").txt(`${env.APP_DOMAIN_FRONT}/about`);
  xml.ele("url").ele("loc").txt(`${env.APP_DOMAIN_FRONT}/roadmap`);

  users.forEach((user) => {
    xml.ele("url").ele("loc").txt(`${env.APP_DOMAIN_FRONT}/${user.username}`);
  });

  return xml.end({ prettyPrint: true });
}

sitemap.get("/sitemap.xml", async (req, res) => {
  try {
    // Obtener los datos de los usuarios registrados desde tu base de datos o GraphQL
    const users = await prisma.user.findMany({});

    // Generar el sitemap XML
    const sitemap = generateSitemap(users);

    // Configurar las cabeceras HTTP para indicar que es un archivo XML
    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (err) {
    console.error("Error generando el sitemap:", err);
    res.status(500).send("Error generando el sitemap");
  }
});

export default sitemap;
