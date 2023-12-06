const router = require("express").Router();
const axios = require('axios');
const pool = require("../db")

const searchYouTubeVideos = require("../yt-search")


router.get("/:id", async (req, res, next) => {
    try {
        const id = req.params.id; // Corrected way to get the parameter value

        const track = await pool.query(
            'SELECT * FROM songs WHERE trackId = $1',
            [id]
        );

        console.log(track.rows);

        // Respond with the track data
        res.json({ success: true, track: track.rows[0] });
    } catch (error) {
        console.error('Error fetching track:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;

