//import options from "../options.js";

export const databaseCall = (method = "GET", endpoint, gameId, data) => {
  return fetch(`${process.env.BACKEND_URL}/database/games/${gameId}${endpoint}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}