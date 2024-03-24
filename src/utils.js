import options from "../options.js";

export const postToDatabase = async (endpoint, data) => {
  return fetch(options.databaseApiUrl + "/games/" + gameId + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export const log = (...message) => {
  console.log(new Date().toLocaleTimeString(), ...message);
}

export const secondsToTime = (seconds) => {
  let minutes = Math.floor((seconds % 3600) / 60);
  seconds = Math.floor(seconds % 60);

  // always have two digits
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return `${minutes}:${seconds}`;
}