const router = require("express").Router();
const axios = require('axios');
const pool = require("../db")
const getAlbums = require("../albums")
const arraysEqual = require("../arraysEqual")

let albumIDsArray = []; // Declare the array outside of the route handlers
let albumIDsFromArtistsArray = [];



//===================================================================================================
//===========================  FETCH ALBUMIDS FROM tracks TABLE =======================================
//===================================================================================================

router.get("/", async (req, res, next) => {

    try {
      // Query to fetch albumIDs from the songs table
      const queryResult = await pool.query('SELECT DISTINCT albumid FROM tracks');

      // Extract albumIDs from the query result
      const albumIDs = queryResult.rows.map(row => row.albumid);

      // Create an object to store the albumIDs
      albumIDsArray = queryResult.rows.map(row => row.albumid).flat();

      // Respond with the albumIDs object
      res.json(albumIDsArray);
    } catch (error) {
      console.error('Error fetching albumIDs:', error);
      res.status(500).send('Internal Server Error');
    }
  });

//===================================================================================================
//======= USE ALBUMIDS FROM tracks TABLE TO FETCH API ALBUM DATA AND INSERT INTO ALBUM TABLE =========
//===================================================================================================


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
            'INSERT INTO albums (albumid, label, albumname, artist, tracks, track_ids, releasedate) VALUES ($albumId, $label, $albumName, $artist, $trackCount, $track_ids, $releaseDate) RETURNING *',
            {
              $albumId: albumId,
              $label: label,
              $albumName: albumName,
              $artist: artist,
              $trackCount: trackCount,
              $releaseDate: releaseDate,
              $track_ids: $track_ids
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

//===================================================================================================
//===========================  FETCH ALBUMIDS FROM ARTISTS TABLE =====================================
//===================================================================================================

  router.get("/from-artists", async (req, res, next) => {

    try {

        const allAlbums = await pool.query('SELECT DISTINCT albumids FROM artists');

        const albumIDs = allAlbums.rows.map(row => row.albumids).flat();

        albumIDsFromArtistsArray = albumIDs


        res.json(albumIDsFromArtistsArray)

    } catch (error) {

        console.error('Error fetching albumIDs:', error);
        res.status(500).send('Internal Server Error');

    }

  })


//===================================================================================================
//======= USE ALBUMIDS FROM ARTISTS TABLE TO FETCH API ALBUM DATA AND INSERT INTO ALBUM TABLE =======
//===================================================================================================


router.post("/from-artists", async (req, res, next) => {
  const albumObjects = [];
  const failedFetches = [];


  try {


    // Fetch albums and push them to albumObjects

    const testArray = ['5Vme7q2GPBzNXzU8E3REef,7IYS35jWlgXZb9chaX5lWI,7MbjiPSVdi2TbYALX4gneg,0HaxURSQDvUzdSDGcrgkDz,6tfdqf2qTvj3jjF8vQMRRD,3RHIcVIrmY9ZQukIv8FbUg,7JiqMFjVWF0BpJc1WEzI4G']

      try {
        const album = await getAlbums(testArray);

        albumObjects.push(album);
        console.log("Preparing album Objects array");


      } catch (error) {
        // Log the error, push the failed ID to the array, and continue with the next item
        console.error('Error fetching or processing album:', error);
        failedFetches.push(album.albumName);
      }

      console.log(albumObjects)


    // Process each albumObject
    // for (const albumObject of albumObjects) {
    //   try {
    //     const { albumId, label, albumName, artist, releaseDate, trackCount, track_ids } = albumObject;

    //     // Check if the album already exists in the database
    //     const existingAlbum = await pool.query(
    //       'SELECT * FROM albums WHERE albumid = $1',
    //       [albumId]
    //     );

    //     if (existingAlbum.rows.length > 0) {
    //       // Album already exists, skip insertion
    //       console.log(`Album '${albumName}' by '${artist}' already exists. Skipping insertion.`);
    //     } else {

    //       // If the album doesn't exist, insert it
    //       const result = await pool.query(
    //         'INSERT INTO albums (albumid, label, albumname, artist, tracks, releasedate, track_ids) ' +
    //         'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    //         [albumId, label, albumName, artist, trackCount, releaseDate, track_ids]
    //       );


    //       // Optionally, you can log the result or perform additional actions
    //       console.log('Inserted album:', result.rows[0]);
    //     }
    //   } catch (error) {
    //     console.error('Error processing album:', error);
    //     res.status(500).send('Internal Server Error');
    //     return; // Stop further processing on error
    //   }
    // }

    // // Respond with a success message or additional data
    // res.json({ success: true, message: 'Albums fetched and processed successfully.'});

  } catch (error) {
    console.error('Error processing albumIDs:', error);
    res.status(500).send('Internal Server Error');
  }
}
)





module.exports = router;