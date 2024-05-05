import axios from "axios";

export async function getAPISpectatorData(gameName, tagLine) {
  try {
    // get account puuid
    const accountFetch = await axios.get(process.env.RIOT_EUROPE_API_URL + `/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${process.env.RIOT_API_KEY}`);
    const accountData = accountFetch.data;
    const puuid = accountData.puuid;

    // get active game data
    const activeGameFetch = await axios.get(process.env.RIOT_EW1_API_URL + `/lol/spectator/v5/active-games/by-summoner/${puuid}?api_key=${process.env.RIOT_API_KEY}`);
    return activeGameFetch.data;

  } catch (e) {
    console.error(e.status, e.message);
    return null;
  }
}