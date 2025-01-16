// index.js
import { WebSocketServer } from "ws";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer((req, res) => {
	if (req.url === "/" || req.url === "/index.html") {
		fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
			if (err) {
				res.writeHead(500);
				res.end("Error loading index.html");
				return;
			}
			res.writeHead(200, {
				"Content-Type": "text/html",
			});
			res.end(data);
		});
	} else {
		res.writeHead(404);
		res.end("Not found");
	}
});
const wss = new WebSocketServer({
	server,
	path: "/ws",
	// handleProtocols: true,
	// host: "websocket.sso.kite.run",
});
wss.on("headers", (headers, _req) => {
	console.log({ event: "headers event", headers });
});

server.on("upgrade", (request, _socket, _head) => {
	console.log("Upgrade Request:", {
		url: request.url,
		headers: request.headers,
		method: request.method,
	});
});

wss.on("connection", (ws, req) => {
	const clientIp = req.socket.remoteAddress;
	console.log(`New client connected from ${clientIp}`);

	// Handle connection errors
	ws.on("error", (error) => {
		console.error(`Client error: ${error.message}`);
	});

	ws.on("message", (message) => {
		try {
			// Convert Buffer to string if needed
			const messageStr = message.toString();
			console.log(`Received from ${clientIp}: ${messageStr}`);

			// Echo the message back to the client
			ws.send(`You said: ${messageStr}`);
		} catch (error) {
			console.error(`Error processing message: ${error.message}`);
			ws.send("Error: Could not process message");
		}
	});

	ws.on("close", () => {
		console.log(`Client disconnected: ${clientIp}`);
	});

	// Send welcome message
	ws.send("Connected to WebSocket server");
});

// Handle server-level errors
wss.on("error", (error) => {
	console.error(`WebSocket server error: ${error.message}`);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
	console.log(`Server is listening on http://localhost:${PORT}`);
});
