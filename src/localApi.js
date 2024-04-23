import { Hexgate as HttpsClient, auth, poll } from "hexgate";
import { log } from "./utils.js";
import axios from "axios";

export async function getLocalUserData() {
  const credentials = await poll(auth);
  const httpsClient = new HttpsClient(credentials);

  const getCurrentSummoner = httpsClient.build("/lol-summoner/v1/current-summoner")
    .method("get")
    .create();

  const currentSummoner = await getCurrentSummoner();
  if (!currentSummoner.ok) {
    throw new Error("Error fetching current summoner: " + currentSummoner.status);
  }
  return currentSummoner.data;
}

export async function getLiveClientData() {
  try {
    const response = await axios.get(process.env.PROXY_HOST + ":" + process.env.PROXY_PORT + process.env.ENDPOINT);
    return response.data;
  } catch (e) {
    if (e.status === 404) {
      log("Game is starting but no data received yet.");
    } else if (e.status !== null) {
      log("Waiting for a game to start.");
    } else {
      log("Error fetching data: ", e.message);
    }
  }
}