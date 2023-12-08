const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');

const searchYouTubeVideos = require('../yt-search');

//===================================================================================================
//===========================  SEARCH TRACK AND ADD YT URL ==========================================
//===================================================================================================

router.get('/single-track/:id', async (req, res, next) => {
	try {
		const id = req.params.id; // Corrected way to get the parameter value

		const track = await pool.query('SELECT * FROM tracks WHERE track_id = $1', [id]);

		const artist = track.rows[0].artist;
		const song = track.rows[0].track;
		const query = `${artist} ${song}`;
		const youtubeURL = await searchYouTubeVideos(query);

		const updateResult = await pool.query(
			'UPDATE songs SET youtube_url = $1 WHERE track_id = $2 RETURNING *',
			[youtubeURL, id]
		);

		// Check if the update was successful
		if (updateResult.rows.length > 0) {
			console.log('YouTube URL updated:', updateResult.rows[0]);
			res.json({ success: true, track: updateResult.rows[0] });
		} else {
			console.log('No matching track found for track_id:', id);
			res.status(404).json({ success: false, error: 'Track not found' });
		}
	} catch (error) {
		console.error('Error fetching track:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//=======================  SEARCH ALBUMID AND ADD YT URL TO EACH TRACK ==============================
//===================================================================================================

// base route is /ytupdate

router.get('/album/:albumId', async (req, res, next) => {
	try {
		const albumId = req.params.albumId;

		// Fetch associated artist and track information from the tracks and artists tables
		const query = `
		SELECT tracks.*, artists.artist
		FROM tracks
		INNER JOIN artists ON tracks.artist_id = artists.artist_id
		WHERE tracks.albumID = $1
	  `;
		const tracks = await pool.query(query, [albumId]);

		// Loop through the array and perform a YouTube search for each track
		for (const track of tracks.rows) {
			const artistAndTrack = `${track.artist} ${track.track}`;

			console.log('Searching YouTube for:', artistAndTrack);
			// const youtubeURL = await searchYouTubeVideos(artistAndTrack);

			// // Update the youtube_url column for the current trackID
			// await pool.query('UPDATE songs SET youtube_url = $1 WHERE track_id = $2', [
			// 	youtubeURL,
			// 	track.track_id,
			// ]);
		}

		res.json({ success: true, message: 'YouTube URLs updated successfully' });
	} catch (error) {
		console.error('Error updating YouTube URLs:', error);
		res.status(500).send('Internal Server Error');
	}
});

module.exports = router;
