import options from "../options.js";
import { postToDatabase, log, secondsToTime } from "./utils.js";

let gameId = null;
let lastFetchedDuration = null;

const fetchData = () => {
  fetch(options.proxyHost + ":" + options.proxyPort + options.endpoint, {
    method: "GET",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 404) {
        throw new Error("Game is starting but no data received yet.");
      } else {
        throw new Error("Waiting for a game to start.");
      }
    })
    .then((data) => {
      // check if game has restarted and create a new ID
      if (!gameId || !lastFetchedDuration || lastFetchedDuration > data.gameData.gameTime) {
        gameId = Date.now().toString(36);
        log("New game started: " + data.gameData.gameMode + " (game ID: " + gameId + ")");
      } else {
        log("Fetching data from ongoing game: " + data.gameData.gameMode + " (game time " + secondsToTime(data.gameData.gameTime) + ")");
      }

      // save data to database
      const uploadPlayers = postToDatabase("/players", data.allPlayers);
      const uploadGameData = postToDatabase("/gameData", data.gameData);
      const uploadEvents = postToDatabase("/events", data.events);
      Promise.all([uploadPlayers, uploadGameData, uploadEvents])
        .then(() => {
          log("Data uploaded to database.");
        })
        .catch((e) => {
          log("Error uploading data to database: ", e);
        });

      lastFetchedDuration = data.gameData.gameTime;
    })
    .catch((e) => {
      log(e);
    });
}

fetchData();

setInterval(() => {
  fetchData();
}, options.intervalSeconds * 1000);
