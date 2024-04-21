import { Hexgate as HttpsClient, auth, poll } from "hexgate";
import options from "../options.js";
import { log } from "./utils.js";

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
  const response = await fetch(options.proxyHost + ":" + options.proxyPort + options.endpoint, {
    method: "GET",
  })
  if (!response.ok) {
    if (response.status === 404) {
      log("Game is starting but no data received yet.");
      return null;
    } else {
      log("Waiting for a game to start.");
      return null;
    }
  }

  const data = await response.json();
  return data;
}