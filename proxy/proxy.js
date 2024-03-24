import http from "http";
import httpProxy from "http-proxy";
import options from "../options.js";

const proxy = httpProxy.createProxyServer({
  target: options.url,
  secure: false
});

http.createServer((req, res) => {
  proxy.web(req, res);
}).listen(options.proxyPort);

proxy.on("error", (err, req, res) => {
  res.writeHead(500, {
    "Content-Type": "text/plain"
  });
  res.end("No response from " + options.url);
});

console.log("Proxy server running on \"http://localhost:" + options.proxyPort + "\" and forwarding to \"" + options.url + "\"");