const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "points.json");

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function addPoints(userId, username, points = 1) {
  const data = load();
  let user = data.find((u) => u.userId === userId);
  if (user) {
    user.points += points;
    user.username = username;
  } else {
    data.push({ userId, username, points });
  }
  save(data);
  return user ? user.points : points;
}

function getLeaderboard(limit = 10) {
  const data = load();
  return data.sort((a, b) => b.points - a.points).slice(0, limit);
}

function getPoints(userId) {
  const data = load();
  const user = data.find((u) => u.userId === userId);
  return user ? user.points : 0;
}

module.exports = { addPoints, getLeaderboard, getPoints };
