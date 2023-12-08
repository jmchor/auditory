const router = require('express').Router();
const axios = require('axios');
const playListTracks = require('../service');
const pool = require('../db');

router.get('/', async (req, res, next) => {
	try {
		const allTracks = await playListTracks();
		// console.log(allTracks[0])

		for (const song of allTracks) {
			const { artist, track, track_id, duration, albumName, artist_id, albumID } = song;

			try {
				// Check if the song already exists in the database
				const existingSong = await pool.query(
					'SELECT * FROM tracks WHERE artist = $1 AND track = $2',
					[artist, track]
				);

				if (existingSong.rows.length > 0) {
					// Song already exists, skip insertion
					console.log(
						`Song '${track}' by '${artist}' already exists. Skipping insertion.`
					);
					continue;
				}

				// If the song doesn't exist, insert it
				const result = await pool.query(
					'INSERT INTO songs (artist, artist_id, track, duration, albumName, albumID, track_id) VALUES ($artist, $artist_id, $track, $duration, $albumName, $albumID, $track_id) RETURNING *',
					{
						$artist: artist,
						$artist_id: artist_id,
						$track: track,
						$duration: duration,
						$albumName: albumName,
						$albumID: albumID,
						$track_id: track_id,
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
