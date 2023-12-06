// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/", indexRoutes);

const playlistRoutes = require("./routes/playlists.routes");
app.use("/playlists", playlistRoutes);

const albumRoutes = require("./routes/albums.routes");
app.use("/albums", albumRoutes);

const searchRoutes = require("./routes/search.routes");
app.use("/songs", searchRoutes);

const artistsRoutes = require("./routes/artists.routes");
app.use("/artists", artistsRoutes);


// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
