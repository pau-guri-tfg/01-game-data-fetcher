import options from "../options.js";

export const databaseCall = async (method = "GET", endpoint, gameId, data) => {
  return fetch(`${options.apiUrl}/database/games/${gameId}${endpoint}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}