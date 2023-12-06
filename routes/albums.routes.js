const router = require("express").Router();
const axios = require('axios');
const pool = require("../db")
const getAlbums = require("../albums")

let albumIDsArray = []; // Declare the array outside of the route handlers


router.get("/", async (req, res, next) => {
    try {
      // Query to fetch albumIDs from the songs table
      const queryResult = await pool.query('SELECT DISTINCT albumid FROM songs');
  
      // Extract albumIDs from the query result
      const albumIDs = queryResult.rows.map(row => row.albumid);
  
      // Create an object to store the albumIDs
      albumIDsArray = queryResult.rows.map(row => row.albumid);

      // Respond with the albumIDs object
      res.json(albumIDsArray);
    } catch (error) {
      console.error('Error fetching albumIDs:', error);
      res.status(500).send('Internal Server Error');
    }
  });


  router.post("/", async (req, res, next) => {
    try {
      const albumObjects = [];
  
      // Fetch albums and push them to albumObjects
      for (const albumID of albumIDsArray) {
        try {
          const album = await getAlbums(albumID);
          // Perform operations with the fetched album data
          albumObjects.push(album);
        } catch (error) {
          console.error('Error fetching or processing album:', error);
          res.status(500).send('Internal Server Error');
          return; // Stop further processing on error
        }
      }
  
      // Process each albumObject
      for (const albumObject of albumObjects) {
        try {
          const { albumId, label, albumName, artist, releaseDate, trackCount } = albumObject;
  
          // Check if the album already exists in the database
          const existingAlbum = await pool.query(
            'SELECT * FROM albums WHERE albumid = $1',
            [albumId]
          );
  
          if (existingAlbum.rows.length > 0) {
            // Album already exists, skip insertion
            console.log(`Album '${albumName}' by '${artist}' already exists. Skipping insertion.`);
          } else {
            // If the album doesn't exist, insert it
            const result = await pool.query(
              'INSERT INTO albums (albumid, label, albumname, artist, tracks, releasedate) VALUES ($albumId, $label, $albumName, $artist, $trackCount, $releaseDate) RETURNING *',
              {
                $albumId: albumId,
                $label: label,
                $albumName: albumName,
                $artist: artist,
                $trackCount: trackCount,
                $releaseDate: releaseDate
              }
            );
  
            // Optionally, you can log the result or perform additional actions
            console.log('Inserted album:', result.rows[0]);
          }
        } catch (error) {
          console.error('Error processing album:', error);
          res.status(500).send('Internal Server Error');
          return; // Stop further processing on error
        }
      }
  
      // Respond with a success message or additional data
      res.json({ success: true, message: 'Albums fetched and processed successfully.'});
  
    } catch (error) {
      console.error('Error processing albumIDs:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  

module.exports = router;