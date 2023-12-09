const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');

const searchArtist = require('../searchArtist');
const arraysEqual = require('../arraysEqual');

//===================================================================================================
//========================================  POST ROUTES =============================================

//===================================================================================================
//===========================  SEARCH ARTIST BY QUERY AND INSERT IN DB ==============================
//===================================================================================================
// base route is /search

router.post('/single-artist/:query', async (req, res, next) => {
	const query = req.params.query;

	try {
		const result = await searchArtist(query);

		if (!result) {
			// No matching artist found
			res.json({ success: true, message: 'No matching artist found.' });
			return;
		}

		const { artist_id, artist, genres, more_info, album_ids } = result;

		// Check if the artist already exists in the database
		const existingArtist = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [artist_id]);

		if (existingArtist.rows.length > 0) {
			// Artist already exists, check if additional info is missing
			const existingInfo = existingArtist.rows[0];

			// Check if any additional info is missing and needs to be updated
			if (
				existingInfo.more_info !== more_info ||
				existingInfo.artist !== artist ||
				!arraysEqual(existingInfo.genres, genres) || // Check if arrays are equal
				!arraysEqual(existingInfo.album_ids, album_ids) // Check if arrays are equal
			) {
				// Update the table record with additional info
				const updatedGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
				const updatedAlbumIDs = album_ids.length > 0 ? album_ids : ['none']; // Insert 'none' if album_ids is empty
				const updateResult = await pool.query(
					'UPDATE artists SET artist = $2, more_info = $3, genres = $4, album_ids = $5 WHERE artist_id = $1 RETURNING *',
					[artist_id, artist, more_info, updatedGenres, updatedAlbumIDs]
				);

				console.log('Updated artist info:', updateResult.rows[0]);
			} else {
				// No additional info to update
				console.log(`Artist '${artist}' already exists with complete info. Skipping update.`);
			}
		} else {
			// If the artist doesn't exist, insert it
			const insertGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
			const insertAlbumIDs = album_ids.length > 0 ? album_ids : ['none']; // Insert 'none' if album_ids is empty
			const insertResult = await pool.query(
				'INSERT INTO artists (artist, artist_id, genres, more_info, album_ids) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[artist, artist_id, insertGenres, more_info, insertAlbumIDs]
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

//===================================================================================================
//======== LOOP OVER ARTISTS IN ARTISTS TABLE, FETCH API DATA AND BULK INSERT TO DB =================
//===================================================================================================
//Only use case: text file with artists names, one per line --> route is disabled

router.post('/multiple-artists', async (req, res, next) => {
	try {
		const failedEntries = []; // Array to collect failed entries
		let artistNames = [];

		// Query the artists table for all artists
		const allArtists = await pool.query('SELECT * FROM artists');
		artistNames = allArtists.rows.map((row) => row.artist);

		// Loop over the array and perform a search for each artist
		for (const artistName of artistNames) {
			try {
				const result = await searchArtist(artistName);

				if (!result) {
					// No matching artist found
					console.log(`No matching artist found for '${artistName}'.`);
					failedEntries.push({ artist: artistName, reason: 'No matching artist found' });
					continue;
				}

				const { artist_id, artist, genres, more_info, albumids } = result;

				// Check if the artist already exists in the database
				const existingArtist = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [
					artist_id,
				]);

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
							'UPDATE artists SET artist = $2, more_info = $3, genres = $4, album_ids = $5 WHERE artist_id = $1 RETURNING *',
							[artist_id, artist, more_info, updatedGenres, updatedAlbumIDs]
						);

						console.log('Updated artist info:', updateResult.rows[0]);
					} else {
						// No additional info to update
						console.log(
							`Artist '${artist}' already exists with complete info. Skipping update.`
						);
					}
				} else {
					// If the artist doesn't exist, insert it
					const insertGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
					const insertAlbumIDs = albumids.length > 0 ? albumids : ['none']; // Insert 'none' if albumids is empty
					const insertResult = await pool.query(
						'INSERT INTO artists (artist, artist_id, genres, more_info, albumids) VALUES ($1, $2, $3, $4, $5) RETURNING *',
						[artist, artist_id, insertGenres, more_info, insertAlbumIDs]
					);

					// Optionally, you can log the result or perform additional actions
					console.log('Inserted artist:', insertResult.rows[0]);
				}
			} catch (error) {
				console.error(`Error processing artist '${artistName}':`, error.message);
				failedEntries.push({ artist: artistName, reason: error.message });
				// Continue with the next iteration in case of an error
				continue;
			}
		}

		// Send response with success and failed entries
		res.json({ success: true, message: 'Records created/updated in the artist database', failedEntries });
	} catch (error) {
		console.error('Error processing multiple artists:', error.message);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
});

//===================================================================================================
//=========================================  GET ROUTES =============================================

//GET ARTIST

router.get('/artist/:query', async (req, res) => {
	try {
		const { query } = req.params;

		// Query the database for the artist using ILIKE for case-insensitive search
		const result = await pool.query('SELECT * FROM artists WHERE artist ILIKE $1', [`%${query}%`]);

		if (result.rows.length > 0) {
			// Artist found, send the information as JSON
			res.json({ success: true, artist: result.rows[0] });
		} else {
			// Artist not found
			res.json({ success: false, message: 'Artist not found.' });
		}
	} catch (error) {
		console.error('Error searching for artist:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

//GET ALBUM

//GET TRACK

//GET ALL ALBUMS BY ARTIST
router.get('/artist/:query/albums', async (req, res) => {
	try {
		const { query } = req.params;

		// Query the database for the artist using ILIKE for case-insensitive search
		const artistResult = await pool.query('SELECT * FROM artists WHERE artist ILIKE $1', [`%${query}%`]);

		if (artistResult.rows.length === 0) {
			// Artist not found
			res.json({ success: false, message: 'Artist not found.' });
			return;
		}

		const artist = artistResult.rows[0];
		const { album_ids } = artist;

		if (!album_ids || album_ids.length === 0) {
			// Artist has no associated albums
			res.json({ success: true, message: 'Artist has no associated albums.', albums: [] });
			return;
		}

		// Query the albums table for the associated albums
		const albumResult = await pool.query('SELECT * FROM albums WHERE albumid = ANY($1)', [album_ids]);

		// Loop through the album information and create a simplified JSON object
		const simplifiedAlbums = albumResult.rows.map((album) => ({
			albumName: album.albumname,
			releaseDate: album.releasedate,
			trackCount: album.tracks,
		}));

		// Send the simplified information as JSON
		res.json({ success: true, artist, albums: simplifiedAlbums });
	} catch (error) {
		console.error('Error searching for artist albums:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

//GET ALL TRACKS BY ALBUM

module.exports = router;
