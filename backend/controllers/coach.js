const mongoose = require("mongoose");
const Coach = mongoose.model("Coach");
const Player = mongoose.model("Player");
const puppeteer = require("puppeteer");
const fs = require("fs");
const fsp = require("fs").promises;
const axios = require("axios");
const agenda = require("../middlewares/agenda");
const path = require("path");
const csv = require("csv-parser");
const generateTemplate = require("../middlewares/template");
const { chromium } = require("playwright"); // <-- Import Playwright here

// Helper Functions
function sanitizeData(data) {
  return data.map((row) => {
    const sanitizedRow = { ...row };
    // List of fields to check for accidental conversions
    const fieldsToSanitize = [
      "HEIGHT",
      "WINGSPAN",
      "STANDING REACH",
      "HAND WIDTH",
      "HAND LENGTH",
      "STANDING VERT",
      "MAX VERT",
    ];

    fieldsToSanitize.forEach((field) => {
      if (sanitizedRow[field]) {
        if (typeof sanitizedRow[field] === "number") {
          sanitizedRow[field] = sanitizedRow[field].toString();
        }

        sanitizedRow[field] = sanitizedRow[field]
          .replace(/(\d)'(\d)/g, "$1' $2")
          .replace(/(\d)"(\s)/g, '$1"$2');
      }
    });

    return sanitizedRow;
  });
}

function transformYouTubeUrl(url) {
  if (!url || url.trim() === "") return null; // Return null for empty inputs

  const regex = /^https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/;
  const validRegex =
    /^https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)\?si=([a-zA-Z0-9_-]+)$/;

  let match = url.match(regex);

  if (!match) match = url.match(validRegex);

  if (match) {
    const videoId = match[1];

    const urlParams = new URLSearchParams(new URL(url).search);
    const siParam = urlParams.get("si") || "";

    const embedUrl = `https://www.youtube.com/embed/${videoId}?si=${siParam}`;
    return embedUrl;
  } else {
    throw new Error("Invalid YouTube URL");
  }
}

// Helper Function end

const singleRegister = async (req, res) => {
  const { id } = req.user;
  const coach = await Coach.findById(id);

  if (!coach) return res.status(404).json({ error: "Please register first" });

  const images = req.files.map((file, i) => ({
    filename: file.filename,
    path: file.path,
    fileType: i === 0 ? "mugshot" : "standingshot",
  }));

  const videos = Array.isArray(req.body.videos)
      ? req.body.videos
          .filter((url) => url && url.trim() !== "") // Filter out empty strings
          .map((url) => transformYouTubeUrl(url))
      : [];

  const player = new Player({
    images,
    videos: videos,
    ...req.body,
  });

  coach.players.push(player._id);

  await agenda.now( "generate player image", { player });
  await player.save();
  await coach.save();

  return res.status(201).json({ success: "Player added to list." });
};

const getAllPlayers = async (req, res) => {
  const { id } = req.user;
  const coach = await Coach.findById(id).populate("players");

  if (!coach) return { error: "Unauthorized user detected." };

  res.status(200).json(coach.players);
};

const getIndividualPlayer = async (req, res) => {
  const { id } = req.params;

  const player = await Player.findById(id);

  if (!player) return res.status(404).json({ error: "Unable to find player" });

  res.status(200).json(player);
};

const updatePlayerInfo = async (req, res) => {
  const { id } = req.params;
  const player = await Player.findById(id);

  if (!player) return res.status(404).json({ error: "Unable to find user" });

  const videos = Array.isArray(req.body.videos)
      ? req.body.videos
          .filter((url) => url && url.trim() !== "") // Filter out empty strings
          .map((url) => transformYouTubeUrl(url))
      : [];

  await Player.findByIdAndUpdate(id, { ...req.body, videos }, {new: true});

  if (req.files && req.files.length) {
    await Promise.all(
      req.files.map(async (file) => {
        const index = parseInt(file.fieldname.match(/\[(\d+)\]/)[1]);
        let publicId = player.images[index]?.filename;

        publicId &&
          (await agenda.now( "deleteFileFromCloudinary", {
            publicId,
          }));

        player.images[index] = {
          filename: file.filename,
          path: file.path,
          fileType: index === 0 ? "mugshot" : "standingshot",
        };
      })
    );
  }

  await player.save();
  await agenda.now("generate player image", { player });

  res.status(200).json({ success: "Player Information Updated" });
};

const handleExcelFile = async (req, res) => {
  const { id } = req.user;
  const coach = await Coach.findById(id);

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      results.push(row);
    })
    .on("end", async () => {
      const playerData = sanitizeData(results);

      const checkField = (value) =>
        !value || value === "" || value === "-" ? "N/A" : value.trim();

      for (const row of playerData) {
        const player = new Player({
          playerName: checkField(row["PLAYER"]),
          playerTeam: checkField(row["PLAYER TEAM"]),
          position: checkField(row["POS"]),
          heightWithShoes: checkField(row["HEIGHT"]),
          weight: checkField(row["WEIGHT"]),
          bodyFat: checkField(row["BODY COMP"]),
          wingSpan: checkField(row["WINGSPAN"]),
          standingReach: checkField(row["STANDING REACH"]),
          handWidth: checkField(row["HAND WIDTH"]),
          handLength: checkField(row["HAND LENGTH"]),
          standingVert: checkField(row["STANDING VERT"]),
          maxVert: checkField(row["MAX VERT"]),
          laneAgility: checkField(row["LANE AGILITY"]),
          shuttle: checkField(row["SHUTTLE"]),
          courtSprint: checkField(row["3/4 COURT SPRINT"]),
          maxSpeed: checkField(row["MAX SPEED"]),
          maxJump: checkField(row["MAX JUMP"]),
          prpp: checkField(row["PROPULSIVE POWER"]),
          acceleration: checkField(row["ACCELERATION"]),
          deceleration: checkField(row["DECELERATION"]),
          ttto: checkField(row["TAKE OFF"]),
          brakingPhase: checkField(row["BRAKING PHASE"]),
          description: checkField(row["DESCRIPTION"]),
        });

        coach.players.push(player._id);
        await player.save();
      }

      await coach.save();
      await fsp.unlink(req.file.path);
      res.status(200).json({ success: "Players registered successfully!" });
    });
};

// Function to generate PDF
// controllers/playerController.js

const generatePdf = async (req, res) => {
  const { id } = req.params;
  const player = await Player.findById(id);

  if (!player) {
    return res.status(404).json({ error: "Unable to find player." });
  }

  let htmlTemplate;
  try {
    htmlTemplate = await generateTemplate(player);
  } catch (err) {
    console.error("Error generating HTML template:", err);
    return res.status(500).send("Error generating PDF");
  }

  try {
    // 1. Launch Playwright
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 2. Set the viewport size to 640×850
    await page.setViewportSize({ width: 640, height: 880 });

    // 3. Load the HTML content in the page
    await page.setContent(htmlTemplate, { waitUntil: "networkidle" });

    // 4. Generate PDF with a custom page size of 640px × 850px
    const pdfBuffer = await page.pdf({
      width: "640px",
      height: "880px",
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px"
      },
      scale: 1
    });

    // 5. Close the browser
    await browser.close();

    // Set response headers for PDF download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=ScoutPro-${player.playerName}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    // Send the PDF buffer as response
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF with Playwright:", error);
    res.status(500).send("Error generating PDF");
  }
};


const deletePlayer = async (req, res) => {
  const { id } = req.params;

  const player = await Player.findByIdAndDelete(id);

  if (!player) return res.status(404).json({ error: "No such user found." });

  if (player.images && player.images.length) {
    player.images.map(
      async (img) =>
        img.filename &&
        (await agenda.now( "deleteFileFromCloudinary", {
          publicId: img.filename,
        }))
    );
  }

  return res
    .status(200)
    .json({ success: `${player.playerName} has been deleted.` });
};

module.exports = {
  singleRegister,
  getAllPlayers,
  getIndividualPlayer,
  updatePlayerInfo,
  handleExcelFile,
  generatePdf,
  deletePlayer,
};
