import { log, secondsToTime } from "./utils.js";
import { databaseCall } from "./database.js";
import { getAPISpectatorData } from "./riotApi.js";
import { getLiveClientData, getLocalUserData } from "./localApi.js";

let gameId = null;
let lastFetchedGameTime = null;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const fetchData = async () => {

  // fetch game data
  let data = null;
  try {
    data = await getLiveClientData();
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

      let localUser = await getLocalUserData();
      if (!localUser) {
        throw new Error("Local user not found.");
      }
      let spectatorData = await getAPISpectatorData(localUser.gameName, localUser.tagLine);
      if (!spectatorData) {
        throw new Error("Game started locally but does not appear to be on Riot Games servers yet.");
      }

      gameId = spectatorData.gameId;

      // append extra data to gameData
      data.gameData.gameStartTime = spectatorData.gameStartTime;
      data.gameData.bannedChampions = spectatorData.bannedChampions;


      // append extra data to allPlayers
      data.allPlayers.forEach(player => {
        if (!player.isBot) {
          const spectatorPlayer = spectatorData.participants.find((spectatorPlayer) => {
            const spectatorPlayerName = spectatorPlayer.riotId.split("#")[0];
            return spectatorPlayerName === player.summonerName;
          });
          if (!spectatorPlayer) {
            throw new Error("Player not found in API data: " + player.summonerName);
          }

          player.puuid = spectatorPlayer.puuid;
          player.summonerId = spectatorPlayer.summonerId;
          player.profileIconId = spectatorPlayer.profileIconId;
        }
      });

      log("New game started: " + data.gameData.gameMode + " (game ID: " + gameId + ")");
    } catch (e) {
      log("Error getting new game data: ", e.response.data);
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
      log("Error uploading new data to database: ", e.response.data);
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
    }
  }

  lastFetchedGameTime = data.gameData.gameTime;
}

fetchData();

setInterval(() => {
  fetchData();
}, process.env.INTERVAL_SECONDS * 1000);
