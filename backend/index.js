const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors());

app.use("/sounds", express.static(path.join(__dirname, "public/sounds")));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


const generateSequence = (level) => {
  const colors = ["red", "yellow", "green", "blue"];
  return Array.from({ length: level }, () => colors[Math.floor(Math.random() * colors.length)]);
};

let gameState = {
  highScore: 0,
  level: 1,
  sequence: generateSequence(1),
};

app.get("/api/v1/game-state", (req, res) => {
  res.status(200).json({
      highScore: 0,
      level: 1,
      sequence: ["red"]
  });
});

app.put("/api/v1/game-state", (req, res) => {
  gameState.level = 1;
  gameState.sequence = generateSequence(1);
  res.status(200).json({ message: "Game reset successfully", gameState });
});

app.post("/api/v1/game-state/sequence", (req, res) => {
  if (!req.body || !Array.isArray(req.body.sequence) || req.body.sequence.length <= 0) {
    return res.status(400).json({ message: "A non-empty sequence array is required." });
  }

  if (req.body.sequence.length !== gameState.level) {
    return res.status(400).json({
      message: `Sequence must be exactly ${gameState.level} items long.`,
    });
  }

  const { sequence } = req.body;

  if (JSON.stringify(sequence) === JSON.stringify(gameState.sequence)) {
    if (gameState.level > gameState.highScore) {
      gameState.highScore = gameState.level;
    }

    gameState.level++;
    gameState.sequence = generateSequence(gameState.level);

    return res.status(200).json({ gameState });
  } else {
    gameState.level = 1;
    gameState.sequence = generateSequence(1);
    return res.status(400).json({
      message: "Incorrect sequence. Restarting at level 1.",
      gameState,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Resource not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

console.log("Server setup is starting...");

app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Simon Says app running on http://localhost:${port}`);
});

