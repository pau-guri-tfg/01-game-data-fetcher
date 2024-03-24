import options from "../options";

export async function getCurrentGameData(summonerName) {
  try {
    // get summoner puuid
    const summonerFetch = await fetch(`${options.apiUrl}/riot-api/summoner/${summonerName}`);
    if (!summonerFetch.ok) {
      return null;
    }
    const summonerData = await summonerFetch.json();
    const puuid = summonerData.puuid;

    // get active game data
    const activeGameFetch = await fetch(`${options.apiUrl}/riot-api/active-game/${puuid}`);
    if (!activeGameFetch.ok) {
      return null;
    }
    const activeGameData = await activeGameFetch.json();
    return activeGameData;

  } catch (e) {
    console.error(e);
    return null;
  }
}