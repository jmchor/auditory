const router = require("express").Router();
const axios = require('axios');
const pool = require("../db")

const searchYouTubeVideos = require("../yt-search")


router.get("/single/:id", async (req, res, next) => {
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




module.exports = router;

