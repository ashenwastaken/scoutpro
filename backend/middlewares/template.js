const fs = require("fs").promises;

module.exports = async (player) => {
  let htmlTemplate = await fs.readFile("templates/pdf.html", "utf8");

  const getValue = (value, defaultValue = "N/A") => {
    return value !== undefined && value !== null && value !== "" ? value : defaultValue;
  };

  htmlTemplate = htmlTemplate
    .replace("{{playerName}}", getValue(player.playerName))
    .replace("{{playerTeam}}", getValue(player.playerTeam))
    .replace("{{weight}}", getValue(player.weight))
    .replace("{{heightWithShoes}}", getValue(player.heightWithShoes))
    .replace("{{bodyFat}}", getValue(player.bodyFat))
    .replace("{{wingSpan}}", getValue(player.wingSpan))
    .replace("{{standingReach}}", getValue(player.standingReach))
    .replace("{{handWidth}}", getValue(player.handWidth))
    .replace("{{handLength}}", getValue(player.handLength))
    .replace("{{standingVert}}", getValue(player.standingVert))
    .replace("{{maxVert}}", getValue(player.maxVert))
    .replace("{{laneAgility}}", getValue(player.laneAgility))
    .replace("{{shuttle}}", getValue(player.shuttle))
    .replace("{{courtSprint}}", getValue(player.courtSprint))
    .replace("{{maxSpeed}}", getValue(player.maxSpeed))
    .replace("{{maxJump}}", getValue(player.maxJump))
    .replace("{{prpp}}", getValue(player.prpp))
    .replace("{{acceleration}}", getValue(player.acceleration))
    .replace("{{deceleration}}", getValue(player.deceleration))
    .replace("{{ttto}}", getValue(player.ttto))
    .replace("{{breakingPhase}}", getValue(player.brakingPhase))
    .replace(
      "{{description}}",
      getValue(player.description, "No description available.")
    )
    .replace(
      "{{mugShot}}",
      getValue(
        player.images?.[0]?.path,
        "../assets/images/dummy.jpeg"
      )
    )
    .replace(
      "{{standingShot}}",
      getValue(
        player.images?.[1]?.path,
        "../assets/images/dummy.jpeg"
      )
    );

  return htmlTemplate;
};
