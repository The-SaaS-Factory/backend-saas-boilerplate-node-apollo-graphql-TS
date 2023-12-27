import { getSuperAdminSetting } from "./adminFacade.js";
import fetch from "node-fetch";

export async function storeContactInLoopsAudience(email: string, name: string) {
  const loopsEnabled = await getSuperAdminSetting("LOOPS_ENABLED");

  if (loopsEnabled === "true") {
    try {
      const apiKey = await getSuperAdminSetting("LOOPS_API_KEY");
      const url = "https://app.loops.so/api/v1/contacts/create";

      const data = {
        email: email,
        source: "api",
        firstName: name,
        userGroup: "leads",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export async function sendLoopsEventToUser(email: string, eventName: string) {
  const loopsEnabled = await getSuperAdminSetting("LOOPS_ENABLED");

  if (loopsEnabled === "true") {
    try {
      const apiKey = await getSuperAdminSetting("LOOPS_API_KEY");
      const url = "https://app.loops.so/api/v1/events/send";

      const data = {
        email: email,
        eventName: eventName,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log(error);
    }
  }
}
export async function sendLoopsTransactionalEventToUser(payload: any) {
  const loopsEnabled = await getSuperAdminSetting("LOOPS_ENABLED");

  if (loopsEnabled === "true") {
    try {
      const apiKey = await getSuperAdminSetting("LOOPS_API_KEY");
      const url = "https://app.loops.so/api/v1/transactional";

      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      };

      fetch("https://app.loops.so/api/v1/transactional", options)
        .then((response) => response.json())
        .then((response) => console.log(response))
        .catch((err) => console.error(err));
    } catch (error) {
      console.log(error);
    }
  }
}
