import axios from "axios"

export const databaseCall = (method = "GET", endpoint, gameId, data) => {
  return axios(`${process.env.BACKEND_URL}/games/${gameId}${endpoint}?api_key=${process.env.BACKEND_API_KEY}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify(data),
  })
}