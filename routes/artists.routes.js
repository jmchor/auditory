const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const getArtists = require('../services/getArtist');
const arraysEqual = require('../services/arraysEqual');

router.post('/single/:id', async (req, res, next) => {
	const id = req.params.id;

	try {
		const artistObject = await getArtists(id);

		const { artist_id, artist, genres, album_ids, image } = artistObject;

		// Check if the artist already exists in the database
		const existingArtist = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [artist_id]);

		if (existingArtist.rows.length > 0) {
			// Artist already exists, check if additional info is missing
			const existingInfo = existingArtist.rows[0];

			// Check if any additional info is missing and needs to be updated
			if (
				existingInfo.image !== image ||
				existingInfo.artist !== artist ||
				!genres ||
				!existingInfo.genres ||
				!arraysEqual(existingInfo.genres, genres) || // Check if arrays are equal
				!album_ids ||
				!existingInfo.album_ids ||
				!arraysEqual(existingInfo.album_ids, album_ids) // Check if arrays are equal
			) {
				// Update the table record with additional info
				const updateResult = await pool.query(
					'UPDATE artists SET artist = $2, image = $3, genres = $4, album_ids = $5 WHERE artist_id = $1 RETURNING *',
					[artist_id, artist, image, genres, album_ids]
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
			'INSERT INTO artists (artist, artist_id, genres, album_ids, image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
			[artist, artist_id, genres, album_ids, image]
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

router.post('/bulk', async (req, res, next) => {
	try {
		const allArtists = await pool.query('SELECT DISTINCT artist_id FROM artists');
		const artistIDs = allArtists.rows.map((row) => row.artist_id);

		const artistObjects = [];
		const failedEntries = [];

		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

		for (let i = 0; i < artistIDs.length; i++) {
			const artistID = artistIDs[i];
			try {
				const artist = await getArtists(artistID);
				// Perform operations with the fetched artist data
				artistObjects.push(artist);
				console.log('Pushing artist object:', artist.artist);

				// Check if the current iteration is a multiple of 10
				if ((i + 1) % 10 === 0) {
					console.log('Waiting for 2 seconds...');
					await delay(2000); // Wait for 2 seconds
				}
			} catch (error) {
				console.error('Error fetching or processing artist:', error);
				failedEntries.push({ artistID, error: error.message });
				continue; // Jump to the next entry on error
			}
		}

		for (const artistObject of artistObjects) {
			try {
				const { artist_id, artist, genres, album_ids, image } = artistObject;

				// Check if the artist already exists in the database
				const existingArtist = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [
					artist_id,
				]);

				if (existingArtist.rows.length > 0) {
					// Artist already exists, check if additional info is missing
					const existingInfo = existingArtist.rows[0];

					// Check if any additional info is missing and needs to be updated
					if (
						existingInfo.image !== image ||
						existingInfo.artist !== artist ||
						!arraysEqual(existingInfo.genres, genres) || // Check if arrays are equal
						!arraysEqual(existingInfo.album_ids, album_ids) // Check if arrays are equal
					) {
						// Update the table record with additional info
						const updatedGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
						const updatedAlbumIDs = album_ids.length > 0 ? album_ids : ['none']; // Insert 'none' if albumids is empty
						const updateResult = await pool.query(
							'UPDATE artists SET artist = $2, image = $3, genres = $4, album_ids = $5 WHERE artist_id = $1 RETURNING *',
							[artist_id, artist, image, updatedGenres, updatedAlbumIDs]
						);

						console.log('Updated artist info:', updateResult.rows[0]);
					} else {
						// No additional info to update
						console.log(
							`Artist '${artist}' already exists with complete info. Skipping update.`
						);
					}
					continue;
				}

				// If the artist doesn't exist, insert it
				const insertGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
				const insertAlbumIDs = album_ids.length > 0 ? album_ids : ['none']; // Insert 'none' if albumids is empty
				const result = await pool.query(
					'INSERT INTO artists (artist, artist_id, genres, album_ids) VALUES ($artist, $artist_id, $genres, $album_ids, $image) RETURNING *',
					{
						$artist: artist,
						$artist_id: artist_id,
						$genres: genres,
						$album_ids: album_ids,
						$image: image,
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
