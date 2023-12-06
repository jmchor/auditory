const router = require("express").Router();
const axios = require('axios');
const pool = require("../db")
const getArtists = require("../getArtist")
const arraysEqual = require("../arraysEqual")

router.post("/single/:id", async (req, res, next) => {
    const id = req.params.id;

    try {
        const artistObject = await getArtists(id);

        const { spotifyID, artist, genres, albumids, more_info } = artistObject;

        // Check if the artist already exists in the database
        const existingArtist = await pool.query(
            'SELECT * FROM artists WHERE spotifyid = $1',
            [spotifyID]
        );

        if (existingArtist.rows.length > 0) {
            // Artist already exists, check if additional info is missing
            const existingInfo = existingArtist.rows[0];

            // Check if any additional info is missing and needs to be updated
            if (
                existingInfo.more_info !== more_info ||
                existingInfo.artist !== artist ||
                !arraysEqual(existingInfo.genres, genres) || // Check if arrays are equal
                !arraysEqual(existingInfo.albumids, albumids) // Check if arrays are equal
            ) {
                // Update the table record with additional info
                const updateResult = await pool.query(
                    'UPDATE artists SET artist = $2, more_info = $3, genres = $4, albumids = $5 WHERE spotifyid = $1 RETURNING *',
                    [spotifyID, artist, more_info, genres, albumids]
                );

                console.log('Updated artist info:', updateResult.rows[0]);
                res.json({ success: true, artist: updateResult.rows[0] });
            } else {
                // No additional info to update
                console.log(`Artist '${artist}' already exists with complete info. Skipping update.`);
                res.json({ success: true, artist: existingArtist.rows[0] });
            }
            return;
        }

        // If the artist doesn't exist, insert it

        const result = await pool.query(
            'INSERT INTO artists (artist, spotifyid, genres, albumids) VALUES ($artist, $spotifyID, $genres, $albumids, $more_info) RETURNING *',
            {
                $artist: artistName,
                $spotifyID: spotifyID,
                $genres: genres,
                $albumids: albumids,
                $more_info: more_info
            }
        );
        // Optionally, you can log the result or perform additional actions
        console.log('Inserted artist:', result.rows[0]);
        res.json({ success: true, artist: result.rows[0] });


    } catch (error) {
        console.error('Error getting artist:', error.message);
        res.status(404).json({ success: false, error: 'Artist not found' });
    }
});




//get artists by ID and populate the artists table

router.get("/bulk", async (req, res, next) => {
    try {
        const allArtists = await pool.query('SELECT DISTINCT spotifyid FROM songs');
        const artistIDs = allArtists.rows.map(row => row.spotifyid);

        const artistObjects = [];
        const failedEntries = [];

        for (const artistID of artistIDs) {
            try {
                const artist = await getArtists(artistID);
                // Perform operations with the fetched artist data
                artistObjects.push(artist);
                console.log("Pushing artist object:", artist.artist);
            } catch (error) {
                console.error('Error fetching or processing artist:', error);
                failedEntries.push({ artistID, error: error.message });
                continue; // Jump to the next entry on error
            }
        }

        for (const artistObject of artistObjects) {
            try {
                const { spotifyID, artist, genres, albumids, more_info } = artistObject;

                // Check if the artist already exists in the database
                const existingArtist = await pool.query(
                    'SELECT * FROM artists WHERE spotifyid = $1',
                    [spotifyID]
                );

                if (existingArtist.rows.length > 0) {
                    // Artist already exists, check if additional info is missing
                    const existingInfo = existingArtist.rows[0];

                    // Check if any additional info is missing and needs to be updated
                    if (
                        existingInfo.more_info !== more_info ||
                        existingInfo.artist !== artist ||
                        !arraysEqual(existingInfo.genres, genres) || // Check if arrays are equal
                        !arraysEqual(existingInfo.albumids, albumids) // Check if arrays are equal
                    ) {
                        // Update the table record with additional info
                        const updatedGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
                        const updatedAlbumIDs = albumids.length > 0 ? albumids : ['none']; // Insert 'none' if albumids is empty
                        const updateResult = await pool.query(
                            'UPDATE artists SET artist = $2, more_info = $3, genres = $4, albumids = $5 WHERE spotifyid = $1 RETURNING *',
                            [spotifyID, artist, more_info, updatedGenres, updatedAlbumIDs]
                        );

                        console.log('Updated artist info:', updateResult.rows[0]);
                    } else {
                        // No additional info to update
                        console.log(`Artist '${artist}' already exists with complete info. Skipping update.`);
                    }
                    continue;
                }

                // If the artist doesn't exist, insert it
                const insertGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
                const insertAlbumIDs = albumids.length > 0 ? albumids : ['none']; // Insert 'none' if albumids is empty
                const result = await pool.query(
                    'INSERT INTO artists (artist, spotifyid, genres, albumids) VALUES ($artist, $spotifyID, $genres, $albumids, $more_info) RETURNING *',
                    {
                        $artist: artist,
                        $spotifyID: spotifyID,
                        $genres: genres,
                        $albumids: albumids,
                        $more_info: more_info
                    }
                );

                // Optionally, you can log the result or perform additional actions
                console.log('Inserted artist:', result.rows[0]);
            } catch (error) {
                console.error('Error processing artist:', error);
                failedEntries.push({ artistObject, error: error.message });
                continue; // Jump to the next entry on error
            }
        }

        res.json({ success: true, message: 'Bulk operation completed', failedEntries });
    } catch (error) {
        console.error('Error handling bulk request:', error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});






module.exports = router;






