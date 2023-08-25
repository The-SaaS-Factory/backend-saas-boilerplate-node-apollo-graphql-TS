import { env } from "process";
import algoliasearch from "algoliasearch";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function algoliaFacade() {
    try {
      const client = algoliasearch(env.ALGOLIA_KEY_NAME, env.ALGOLIA_KEY_SECRET);
      const index = client.initIndex(env.ALGOLIA_INDEX_NAME);
  
      const fetchedRecords = await fetchDataFromDatabase();
      const existingRecords = await fetchExistingRecordsFromAlgolia(index);
  
      const newRecords = filterNewRecords(fetchedRecords, existingRecords);
  
      if (newRecords.length > 0) {
        await index.saveObjects(newRecords, { autoGenerateObjectIDIfNotExist: true });
        console.log(`Se han enviado ${newRecords.length} nuevos registros a Algolia.`);
      } else {
        console.log('No hay nuevos registros para enviar a Algolia.');
      }
    } catch (error) {
      console.error('Error al enviar los registros a Algolia:', error);
      console.error('Error al enviar los registros a Algolia:', error.response);
    }
  }
 
  
  
  
  
  
  const fetchDataFromDatabase = async () => {
    const users = await prisma.user.findMany({});
    return users;
  };
  
  const fetchExistingRecordsFromAlgolia = async (index) => {
    const { hits } = await index.browseObjects({ query: '', attributesToRetrieve: ['id'] });
    return hits.map((hit) => hit.id);
  };
  
  const filterNewRecords = (fetchedRecords, existingRecords) => {
    return fetchedRecords.filter((record) => !existingRecords.includes(record.id));
  };
  