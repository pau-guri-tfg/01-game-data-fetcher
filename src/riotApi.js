import options from "../options.js";

export async function getAPISpectatorData(gameName, tagLine) {
  try {
    // get account puuid
    const accountFetch = await fetch(`${options.apiUrl}/riot-api/account/${gameName}/${tagLine}`);
    if (!accountFetch.ok) {
      return null;
    }
    const accountData = await accountFetch.json();
    const puuid = accountData.puuid;

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