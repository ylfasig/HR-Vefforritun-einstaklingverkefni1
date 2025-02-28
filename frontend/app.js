document.addEventListener("DOMContentLoaded", () => {
    const pads = document.querySelectorAll(".pad");
    const startBtn = document.getElementById("start-btn");
    const replayBtn = document.getElementById("replay-btn");
    const highScoreElement = document.getElementById("high-score");
    const resetBtn = document.getElementById("reset-btn");

    if (!startBtn || !replayBtn || !highScoreElement) {
        console.error("Missing essential buttons. Check HTML IDs.");
        return;
    }

    let gameSequence = [];
    let userSequence = [];
    let highScore = 0;
    let isPlayerTurn = false;

    const API_BASE_URL = "http://localhost:4000/api/v1";

    startBtn.addEventListener("click", startGame);
    replayBtn.addEventListener("click", replaySequence);
    if (resetBtn) resetBtn.addEventListener("click", startGame);

    async function startGame() {
        try {
            console.log("Fetching:", `${API_BASE_URL}/game-state`);
            let response = await fetch(`${API_BASE_URL}/game-state`, { method: "PUT" });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            let data = await response.json();
            console.log("Game State Response:", data);

            gameSequence = data.gameState.sequence || [];
            highScore = data.gameState.highScore || 0;
            highScoreElement.textContent = highScore;
            playSequence(gameSequence);
        } catch (error) {
            console.error("Error starting game:", error);
            alert("Failed to start game. Please check backend connection.");
        }
    }

    function replaySequence() {
        if (!gameSequence.length) {
            console.warn("No sequence to replay.");
            return;
        }
        isPlayerTurn = false;
        playSequence(gameSequence);
    }

    function playSound(color) {
        const soundPath = `http://localhost:3000/sounds/${color}.mp3`; 
        const audio = new Audio(soundPath);
        audio.play().catch(e => console.error("Audio Error:", e));
    }

    function playSequence(sequence) {
        console.log("Playing sequence:", sequence);

        isPlayerTurn = false;
        userSequence = [];
        replayBtn.disabled = true;

        let delay = 1000;
        sequence.forEach((color, index) => {
            setTimeout(() => {
                let pad = document.getElementById(`pad-${color}`);
                if (pad) {
                    pad.classList.add("active");
                    playSound(color);
                    setTimeout(() => pad.classList.remove("active"), 300);
                } else {
                    console.error("Error: Pad not found for", color);
                }
            }, index * delay);
        });

        setTimeout(() => {
            isPlayerTurn = true;
            replayBtn.disabled = false;
        }, sequence.length * delay);
    }

    pads.forEach(pad => {
        pad.addEventListener("click", () => {
            if (!isPlayerTurn) return;

            const selectedColor = pad.id.replace("pad-", "");
            userSequence.push(selectedColor);
            playSound(selectedColor);

            if (userSequence.length === gameSequence.length) {
                validateSequence(userSequence);
            }
        });
    });

    async function validateSequence(userSequence) {
        isPlayerTurn = false;

        try {
            let response = await fetch(`${API_BASE_URL}/game-state/sequence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sequence: userSequence })
            });

            let data = await response.json();
            if (data.gameState) {
                gameSequence = data.gameState.sequence;
                highScore = data.gameState.highScore;
                highScoreElement.textContent = highScore;
                userSequence = [];
                setTimeout(() => playSequence(gameSequence), 1000);
            } else {
                document.getElementById("failure-modal").style.display = "block";
            }
        } catch (error) {
            console.error("Error validating sequence:", error);
            alert("Error connecting to backend. Try again later.");
        }
    }
});
