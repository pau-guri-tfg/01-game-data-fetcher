import http from "http";
import httpProxy from "http-proxy";
//import options from "../options.js";

const proxy = httpProxy.createProxyServer({
  target: process.env.URL,
  secure: false
});

http.createServer((req, res) => {
  proxy.web(req, res);
}).listen(process.env.PROXY_PORT);

proxy.on("error", (err, req, res) => {
  res.writeHead(500, {
    "Content-Type": "text/plain"
  });
  res.end("No response from " + process.env.URL);
});

console.log("Proxy server running on \"http://localhost:" + process.env.PROXY_PORT + "\" and forwarding to \"" + process.env.URL + "\"");