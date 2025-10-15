const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./sessions" }),
  puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
});

app.use(express.json());
app.use(express.static("public"));

client.on("qr", async qr => {
  const qrImage = await qrcode.toDataURL(qr);
  io.emit("qr", qrImage);
});

client.on("ready", () => {
  console.log("✅ WhatsApp подключен!");
  io.emit("ready", true);
});

client.on("message", msg => {
  io.emit("message", { from: msg.from, body: msg.body });
});

app.post("/send", async (req, res) => {
  const { number, message } = req.body;
  const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
  await client.sendMessage(chatId, message);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
client.initialize();
server.listen(PORT, () => console.log(`🌐 Сервер запущен на порту ${PORT}`));
