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

      // get the gameName and tagLine from the first non-bot player
      let localUser = data.allPlayers.find(player => !player.isBot);
      if (!localUser) {
        throw new Error("No non-bot players found in the game.");
      }

      let spectatorData = await getAPISpectatorData(localUser.riotIdGameName, localUser.riotIdTagLine);
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
            return spectatorPlayer.riotId === player.riotId;
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
      log("Error getting new game data: ", e);
      return;
    }

    // upload new data to database
    try {
      const uploadGameData = databaseCall("POST", "/gamedata", gameId, data.gameData);
      const uploadPlayers = databaseCall("POST", "/players", gameId, data.allPlayers);
      const uploadEvents = databaseCall("PUT", "/events", gameId, data.events);

      await Promise.all([uploadGameData, uploadPlayers, uploadEvents]);

      log("New game data uploaded to database.");
    } catch (e) {
      log("Error uploading new data to database: ", e);
    }
  } else {
    log("Fetched data from ongoing game: " + data.gameData.gameMode + " (game time " + secondsToTime(data.gameData.gameTime) + ")");

    // upload updated data to database
    try {
      const uploadGameData = databaseCall("PATCH", "/gamedata", gameId, { gameTime: data.gameData.gameTime });
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
