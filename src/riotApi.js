import axios from "axios";

export async function getAPISpectatorData(gameName, tagLine) {
  try {
    // get account puuid
    const accountFetch = await axios.get(`${process.env.BACKEND_URL}/riot-api/account/${gameName}/${tagLine}`);
    const accountData = accountFetch.data;
    const puuid = accountData.puuid;

    // get active game data
    const activeGameFetch = await axios.get(`${process.env.BACKEND_URL}/riot-api/active-game/${puuid}`);
    return activeGameFetch.data;

  } catch (e) {
    console.error(e.status, e.message);
    return null;
  }
}