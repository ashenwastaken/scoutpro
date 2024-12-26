const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  images: [
    {
      filename: { type: String, default: "default-image.jpg" },
      path: { type: String, default: "/images/default-image.jpg" },
      fileType: { type: String, default: "image/jpeg" },
    },
  ],
  videos: { type: [String], default: [] },
  playerName: { type: String, required: true },
  position: { type: String, default: "N/A" },
  heightWithShoes: { type: String, default: "N/A" },
  weight: { type: String, default: "N/A" },
  bodyFat: { type: String, default: "N/A" },
  wingSpan: { type: String, default: "N/A" },
  standingReach: { type: String, default: "N/A" },
  handWidth: { type: String, default: "N/A" },
  handLength: { type: String, default: "N/A" },
  standingVert: { type: String, default: "N/A" },
  maxVert: { type: String, default: "N/A" },
  laneAgility: { type: String, default: "N/A" },
  shuttle: { type: String, default: "N/A" },
  courtSprint: { type: String, default: "N/A" },
  description: { type: String, default: "No description available." },
  playerTeam: { type: String, default: "N/A" },
  maxSpeed: { type: String, default: "N/A" },
  maxJump: { type: String, default: "N/A" },
  prpp: { type: String, default: "N/A" },
  acceleration: { type: String, default: "N/A" },
  deceleration: { type: String, default: "N/A" },
  ttto: { type: String, default: "N/A" },
  brakingPhase: { type: String, default: "N/A" },
  pdfPreview: {
    filename: { type: String },
    path: { type: String },
  },
});

module.exports = mongoose.model("Player", playerSchema);
