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
    const response = await axios.get(process.env.LOCAL_API_URL);
    return response.data;
  } catch (e) {
    if (e.response.status === 404) {
      log("Game is starting but no data received yet. (" + e.message + ")");
    } else {
      log("Waiting for a game to start. (" + e.message + ")");
    }
  }
}