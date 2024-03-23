const options = require("./options.json");
let loggedLines = 0;

console.log("Options: ", options);

const fetchData = () => {
  fetch(options.proxyHost + ":" + options.proxyPort + options.endpoint, {
    method: "GET",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 404) {
        throw new Error("Game is starting but no data received yet.");
      } else {
        throw new Error("Waiting for a game to start.");
      }
    })
    .then((data) => {
      log("Fetching data from ongoing game: ", data.gameData.gameMode + " (game time " + secondsToTime(data.gameData.gameTime) + ")");
    })
    .catch((e) => {
      log(e);
    });
}

const log = (...message) => {
  console.log(new Date().toLocaleTimeString(), ...message);
  loggedLines++;
}

const secondsToTime = (seconds) => {
  const minutes = Math.floor((seconds % 3600) / 60);
  seconds = Math.floor(seconds % 60);

  // always have two digits
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return `${hours}:${minutes}`;
}

fetchData();

setInterval(() => {
  fetchData();
}, options.intervalSeconds * 1000);
