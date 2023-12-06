const router = require("express").Router();
const axios = require('axios');
const pool = require("../db")

const searchYouTubeVideos = require("../yt-search")
const searchArtist = require("../searchArtist")
const arraysEqual = require("../arraysEqual")


router.get("/single-track/:id", async (req, res, next) => {
    try {
        const id = req.params.id; // Corrected way to get the parameter value

        const track = await pool.query(
            'SELECT * FROM songs WHERE trackId = $1',
            [id]
        );

        const artist = track.rows[0].artist
        const song = track.rows[0].track
        const query = `${artist} ${song}`
        const youtubeURL = await searchYouTubeVideos(query)

        const updateResult = await pool.query(
            'UPDATE songs SET youtube_url = $1 WHERE trackId = $2 RETURNING *',
            [youtubeURL, id]
        );

        // Check if the update was successful
        if (updateResult.rows.length > 0) {
            console.log('YouTube URL updated:', updateResult.rows[0]);
            res.json({ success: true, track: updateResult.rows[0] });
        } else {
            console.log('No matching track found for trackId:', id);
            res.status(404).json({ success: false, error: 'Track not found' });
        }

    } catch (error) {
        console.error('Error fetching track:', error);
        res.status(500).send('Internal Server Error');
    }
});




router.get("/album/:albumId", async (req, res, next) => {
    try {
        const albumId = req.params.albumId;

        // Fetch associated artist and track information from the songs table
        const tracks = await pool.query(
            'SELECT * FROM songs WHERE albumID = $1',
            [albumId]
        );

        // Loop through the array and perform a YouTube search for each track
        for (const track of tracks.rows) {
            const artistAndTrack = `${track.artist} ${track.track}`;
            const youtubeURL = await searchYouTubeVideos(artistAndTrack);

            // Update the youtube_url column for the current trackID
            await pool.query(
                'UPDATE songs SET youtube_url = $1 WHERE trackId = $2',
                [youtubeURL, track.trackid]
            );
        }

        res.json({ success: true, message: 'YouTube URLs updated successfully' });
    } catch (error) {
        console.error('Error updating YouTube URLs:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post("/single-artist/:query", async (req, res, next) => {
    const query = req.params.query;

    try {
        const result = await searchArtist(query);

        if (!result) {
            // No matching artist found
            res.json({ success: true, message: 'No matching artist found.' });
            return;
        }

        const { spotifyID, artist, genres, more_info } = result;

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
                !arraysEqual(existingInfo.genres, genres) // Check if arrays are equal
            ) {
                // Update the table record with additional info
                const updatedGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
                const updateResult = await pool.query(
                    'UPDATE artists SET artist = $2, more_info = $3, genres = $4 WHERE spotifyid = $1 RETURNING *',
                    [spotifyID, artist, more_info, updatedGenres]
                );

                console.log('Updated artist info:', updateResult.rows[0]);
            } else {
                // No additional info to update
                console.log(`Artist '${artist}' already exists with complete info. Skipping update.`);
            }
        } else {
            // If the artist doesn't exist, insert it
            const insertGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
            const insertResult = await pool.query(
                'INSERT INTO artists (artist, spotifyid, genres, more_info) VALUES ($1, $2, $3, $4) RETURNING *',
                [artist, spotifyID, insertGenres, more_info]
            );

            // Optionally, you can log the result or perform additional actions
            console.log('Inserted artist:', insertResult.rows[0]);
        }

        res.json({ success: true, message: 'Record created/updated in the artist database' });
    } catch (error) {
        console.error('Error processing single artist:', error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


router.post("/multiple-artists", async (req, res, next) => {


})











module.exports = router;

