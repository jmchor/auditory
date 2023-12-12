const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const getArtists = require('../services/getArtist');
const arraysEqual = require('../services/arraysEqual');
const searchArtist = require('../services/searchArtist');
const searchTrack = require('../services/searchTrack');
const getAlbums = require('../services/getAlbums');
const getTracksFromMultipleAlbums = require('../services/getTracks');
const api = process.env.SERVER_URL;

router.put('/artist/:id', async (req, res) => {
	const { artist, genres, album_ids, image, harddrive } = req.body;
	const { id } = req.params;

	console.log(artist, image, harddrive);

	try {
		// Fetch the existing artist from the database
		const artistInDB = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [id]);

		if (artistInDB.rows.length === 0) {
			return res.status(404).json({ message: 'Artist not found' });
		}

		const existingArtist = artistInDB.rows[0];

		// Update the entire record with the information from req.body
		const updatedArtist = await pool.query(
			'UPDATE artists SET artist = $1, genres = $2, album_ids = $3, image = $4, harddrive = $5 WHERE artist_id = $6 RETURNING *',
			[
				artist || existingArtist.artist,
				genres || existingArtist.genres,
				album_ids || existingArtist.album_ids,
				image || existingArtist.image,
				harddrive || existingArtist.harddrive,
				id,
			]
		);

		res.json(updatedArtist.rows[0]);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
});

router.put('/track/:id', async (req, res) => {
	const { track, artist_id, albumid, youtube_url, duration, harddrive } = req.body;
	const { id } = req.params;

	try {
		// Fetch the existing artist from the database
		const trackInDB = await pool.query('SELECT * FROM tracks WHERE track_id = $1', [id]);

		if (trackInDB.rows.length === 0) {
			return res.status(404).json({ message: 'Track not found' });
		}

		const existingTrack = trackInDB.rows[0];

		// Update the entire record with the information from req.body
		const updatedTrack = await pool.query(
			'UPDATE tracks SET track = $1, artist = $2, album = $3, genres = $4, image = $5, harddrive = $6 WHERE track_id = $7 RETURNING *',
			[
				track || existingTrack.track,
				artist_id || existingTrack.artist_id,
				albumid || existingTrack.albumid,
				youtube_url || existingTrack.youtube_url,
				image || existingTrack.image,
				harddrive || existingTrack.harddrive,
				duration || existingTrack.duration,
				id,
			]
		);

		res.json(updatedTrack.rows[0]);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
});

router.put('/album/:id', async (req, res) => {
	const { albumname, artist_id, artist, tracks, releasedate, album_type, track_ids, image, harddrive } = req.body;
	const { id } = req.params;

	try {
		// Fetch the existing artist from the database
		const albumInDB = await pool.query('SELECT * FROM albums WHERE albumid = $1', [id]);

		if (albumInDB.rows.length === 0) {
			return res.status(404).json({ message: 'Album not found' });
		}

		const existingAlbum = albumInDB.rows[0];

		// Update the entire record with the information from req.body
		const updatedAlbum = await pool.query(
			'UPDATE albums SET album = $1, artist = $2, genres = $3, image = $4, harddrive = $5 WHERE albumid = $6 RETURNING *',
			[
				albumname || existingAlbum.album,
				artist_id || existingAlbum.artist_id,
				artist || existingAlbum.artist,
				tracks || existingAlbum.tracks,
				releasedate || existingAlbum.releasedate,
				album_type || existingAlbum.album_type,
				track_ids || existingAlbum.track_ids,
				image || existingAlbum.image,
				harddrive || existingAlbum.harddrive,
				id,
			]
		);

		res.json(updatedAlbum.rows[0]);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
});

module.exports = router;
