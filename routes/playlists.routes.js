const router = require("express").Router();
const axios = require('axios');
const playListTracks = require("../service")
const pool = require("../db")



router.get("/", async (req, res, next) => {

  try {
    const allTracks = await playListTracks();
    // console.log(allTracks[0])


    for (const song of allTracks) {
      const { artist, track, trackId, duration, albumName, spotifyID, albumID } = song;

      try {
        // Check if the song already exists in the database
        const existingSong = await pool.query(
          'SELECT * FROM songs WHERE artist = $1 AND track = $2',
          [artist, track]
        );

        if (existingSong.rows.length > 0) {
          // Song already exists, skip insertion
          console.log(`Song '${track}' by '${artist}' already exists. Skipping insertion.`);
          continue;
        }

        // If the song doesn't exist, insert it
        const result = await pool.query(
          'INSERT INTO songs (artist, spotifyID, track, duration, albumName, albumID, trackid) VALUES ($artist, $spotifyID, $track, $duration, $albumName, $albumID, $trackid) RETURNING *',
          {
            $artist: artist,
            $spotifyID: spotifyID,
            $track: track,
            $duration: duration,
            $albumName: albumName,
            $albumID: albumID,
            $trackid: trackId
          }
        );

        // Optionally, you can log the result or perform additional actions
        console.log('Inserted track:', result.rows[0]);

      } catch (error) {
        console.error('Error inserting or checking track:', error.message);
      }
    }

    res.send(`Tracks successfully inserted into DB`);

  } catch (error) {
    console.error('Error handling request:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
