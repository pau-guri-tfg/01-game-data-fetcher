import options from "../options.js";
import { log, secondsToTime } from "./utils.js";
import { databaseCall } from "./database.js";
import { getCurrentGameData } from "./riotApi.js";

let gameId = null;
let lastFetchedGameTime = null;

const fetchData = async () => {

  // fetch game data
  const data = null;
  try {
    const response = fetch(options.proxyHost + ":" + options.proxyPort + options.endpoint, {
      method: "GET",
    })
    if (!response.ok) {
      if (response.status === 404) {
        log("Game is starting but no data received yet.");
        return;
      } else {
        log("Waiting for a game to start.");
        return;
      }
    }

    data = await response.json();
  } catch (e) {
    log("Error fetching data: ", e);
    return;
  }
  if (!data) return;


  // check if game is new and get the new gameID and extra details from the riot API
  if (!gameId || !lastFetchedGameTime || lastFetchedGameTime > data.gameData.gameTime) {
    try {
      if (data.allPlayers.length === 0) {
        throw new Error("No players found in the game.");
      }

      let gameApiData;
      data.allPlayers.forEach(async player => {
        const gameApiData = await getCurrentGameData(player.summonerName);
        if (gameApiData) {
          return;
        }
      });

      if (!gameApiData) {
        throw new Error("Game started locally but does not appear to be on Riot Games servers yet.");
      }

      gameId = gameApiData.gameId;

      // append extra data to gameData
      data.gameData.gameId = gameId;
      data.gameData.gameStartTime = gameApiData.gameStartTime;
      data.gameData.bannedChampions = gameApiData.bannedChampions;

      // append extra data to allPlayers
      data.allPlayers.forEach(player => {
        const apiPlayer = gameApiData.participants.find(apiPlayer => apiPlayer.summonerName === player.summonerName);
        if (!apiPlayer) {
          throw new Error("Player not found in API data: " + player.summonerName);
        }

        player.puuid = apiPlayer.puuid;
        player.summonerId = apiPlayer.summonerId;
        player.profileIconId = apiPlayer.profileIconId;
      });

      log("New game started: " + data.gameData.gameMode + " (game ID: " + gameId + ")");
    } catch (e) {
      log("Error getting new game data: ", e);
      return;
    }

    // upload new data to database
    try {
      const uploadGameData = databaseCall("POST", "/gameData", gameId, data.gameData);
      const uploadPlayers = databaseCall("POST", "/players", gameId, data.allPlayers);
      const uploadEvents = databaseCall("PUT", "/events", gameId, data.events);

      await Promise.all([uploadGameData, uploadPlayers, uploadEvents]);
      log("New game data uploaded to database.");
    } catch (e) {
      log("Error uploading new data to database: ", e);
      return;
    }
  } else {
    log("Fetched data from ongoing game: " + data.gameData.gameMode + " (game time " + secondsToTime(data.gameData.gameTime) + ")");

    // upload updated data to database
    try {
      const uploadGameData = databaseCall("PATCH", "/gameData", gameId, { gameTime: data.gameData.gameTime });
      const uploadPlayers = databaseCall("PATCH", "/players", gameId, data.allPlayers);
      const uploadEvents = databaseCall("PUT", "/events", gameId, data.events);

      await Promise.all([uploadGameData, uploadPlayers, uploadEvents]);
      log("Game data uploaded to database.");
    } catch (e) {
      log("Error uploading data to database: ", e);
      return;
    }
  }

  lastFetchedGameTime = data.gameData.gameTime;
}

fetchData();

setInterval(() => {
  fetchData();
}, options.intervalSeconds * 1000);
