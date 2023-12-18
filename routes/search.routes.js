const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const api = process.env.SERVER_URL;

const searchArtist = require('../services/searchArtist');
const arraysEqual = require('../services/arraysEqual');
const searchTrack = require('../services/searchTrack');

//===================================================================================================
//========================================  POST ROUTES =============================================

//search specific track by query and insert in db

router.post('/single-track/:query', async (req, res, next) => {
	const query = req.params.query;

	try {
		const result = await searchTrack(query);

		if (!result) {
			// No matching track found
			res.json({ success: true, message: 'No matching track found.' });
			return;
		}

		const { track_id, track, duration, albumid, artist_id } = result.trackObject[0];
		// Check if the track already exists in the database
		const existingTrack = await pool.query('SELECT * FROM tracks WHERE track_id = $1', [track_id]);

		if (existingTrack.rows.length > 0) {
			// Track already exists, check if additional info is missing
			const existingInfo = existingTrack.rows[0];

			// Check if any additional info is missing and needs to be updated
			if (
				existingInfo.duration !== duration ||
				existingInfo.track !== track ||
				existingInfo.albumid !== albumid ||
				existingInfo.artist_id !== artist_id
			) {
				// Update the table record with additional info
				const updateResult = await pool.query(
					'UPDATE tracks SET track = $2, duration = $3, albumid = $4, artist_id = $5 WHERE track_id = $1 RETURNING *',
					[track_id, track, duration, albumid, artist_id]
				);

				console.log('Updated track info:', updateResult.rows[0]);
			} else {
				// No additional info to update
				console.log(`Track '${track}' already exists with complete info. Skipping update.`);
			}
		} else {
			// If the track doesn't exist, insert it
			const insertResult = await pool.query(
				'INSERT INTO tracks (track, track_id, duration, albumid, artist_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[track, track_id, duration, albumid, artist_id]
			);

			// Optionally, you can log the result or perform additional actions
			console.log('Inserted track:', insertResult.rows[0]);
		}

		const artistResponse = await axios.post(`${api}/artists/single/${artist_id}`, {});

		const artistResult = artistResponse.data;

		res.json({ success: true, message: 'Record created/updated in the track database' });
	} catch (error) {
		console.error('Error processing single track:', error.message);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
});

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

		const { artist_id, artist, genres, image, album_ids } = result;

		// Check if the artist already exists in the database
		const existingArtist = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [artist_id]);

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
				const updatedAlbumIDs = album_ids.length > 0 ? album_ids : ['none']; // Insert 'none' if album_ids is empty
				const updateResult = await pool.query(
					'UPDATE artists SET artist = $2, image = $3, genres = $4, album_ids = $5 WHERE artist_id = $1 RETURNING *',
					[artist_id, artist, image, updatedGenres, updatedAlbumIDs]
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
				'INSERT INTO artists (artist, artist_id, genres, image, album_ids) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[artist, artist_id, insertGenres, image, insertAlbumIDs]
			);

			// Optionally, you can log the result or perform additional actions
			console.log('Inserted artist:', insertResult.rows[0]);
		}

		res.json({
			success: true,
			message: 'Record created/updated in the artist database',
			artist: result,
		});
	} catch (error) {
		console.error('Error processing single artist:', error.message);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
});

//===================================================================================================
//======== LOOP OVER ARTISTS IN ARTISTS TABLE, FETCH API DATA AND BULK INSERT TO DB =================
//===================================================================================================
//Only use case: text file with artists names, one per line --> route is disabled

// router.post('/multiple-artists', async (req, res, next) => {
// 	try {
// 		const failedEntries = []; // Array to collect failed entries
// 		let artistNames = [];

// 		// Query the artists table for all artists
// 		const allArtists = await pool.query('SELECT * FROM artists');
// 		artistNames = allArtists.rows.map((row) => row.artist);

// 		// Loop over the array and perform a search for each artist
// 		for (const artistName of artistNames) {
// 			try {
// 				const result = await searchArtist(artistName);

// 				if (!result) {
// 					// No matching artist found
// 					console.log(`No matching artist found for '${artistName}'.`);
// 					failedEntries.push({ artist: artistName, reason: 'No matching artist found' });
// 					continue;
// 				}

// 				const { artist_id, artist, genres, image, albumids } = result;

// 				// Check if the artist already exists in the database
// 				const existingArtist = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [
// 					artist_id,
// 				]);

// 				if (existingArtist.rows.length > 0) {
// 					// Artist already exists, check if additional info is missing
// 					const existingInfo = existingArtist.rows[0];

// 					// Check if any additional info is missing and needs to be updated
// 					if (
// 						existingInfo.image !== image ||
// 						existingInfo.artist !== artist ||
// 						!arraysEqual(existingInfo.genres, genres) || // Check if arrays are equal
// 						!arraysEqual(existingInfo.albumids, albumids) // Check if arrays are equal
// 					) {
// 						// Update the table record with additional info
// 						const updatedGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
// 						const updatedAlbumIDs = albumids.length > 0 ? albumids : ['none']; // Insert 'none' if albumids is empty
// 						const updateResult = await pool.query(
// 							'UPDATE artists SET artist = $2, image = $3, genres = $4, album_ids = $5 WHERE artist_id = $1 RETURNING *',
// 							[artist_id, artist, image, updatedGenres, updatedAlbumIDs]
// 						);

// 						console.log('Updated artist info:', updateResult.rows[0]);
// 					} else {
// 						// No additional info to update
// 						console.log(
// 							`Artist '${artist}' already exists with complete info. Skipping update.`
// 						);
// 					}
// 				} else {
// 					// If the artist doesn't exist, insert it
// 					const insertGenres = genres.length > 0 ? genres : ['none']; // Insert 'none' if genres is empty
// 					const insertAlbumIDs = albumids.length > 0 ? albumids : ['none']; // Insert 'none' if albumids is empty
// 					const insertResult = await pool.query(
// 						'INSERT INTO artists (artist, artist_id, genres, image, albumids) VALUES ($1, $2, $3, $4, $5) RETURNING *',
// 						[artist, artist_id, insertGenres, image, insertAlbumIDs]
// 					);

// 					// Optionally, you can log the result or perform additional actions
// 					console.log('Inserted artist:', insertResult.rows[0]);
// 				}
// 			} catch (error) {
// 				console.error(`Error processing artist '${artistName}':`, error.message);
// 				failedEntries.push({ artist: artistName, reason: error.message });
// 				// Continue with the next iteration in case of an error
// 				continue;
// 			}
// 		}

// 		// Send response with success and failed entries
// 		res.json({ success: true, message: 'Records created/updated in the artist database', failedEntries });
// 	} catch (error) {
// 		console.error('Error processing multiple artists:', error.message);
// 		res.status(500).json({ success: false, error: 'Internal Server Error' });
// 	}
// });

//===================================================================================================
//=================== SEARCH ARTISTS, TRACKS AND ALBUMS IN THE DATABASE =============================

//===================================================================================================
//=========================================  GET ROUTES =============================================

//GET ARTIST BY GENRE

router.get('/genre/all', async (req, res) => {
	try {
		const result = await pool.query('SELECT genres FROM artists');

		if (result.rows.length > 0) {
			// Artist found, send the information as JSON
			const genres = result.rows.map((row) => row.genres).flat();

			res.json({ success: true, response: genres });
		} else {
			// Artist not found
			res.json({ success: false, message: 'Artist not found.' });
		}
	} catch (error) {
		console.error('Error searching for artist:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

router.get('/genre/:query', async (req, res) => {
	try {
		const { query } = req.params;

		// Query the database for the artist using ANY for array comparison
		const result = await pool.query('SELECT * FROM artists WHERE $1 = ANY(genres)', [query]);

		if (result.rows.length > 0) {
			// Artists found, send the information as JSON
			res.json({ success: true, response: result.rows });
		} else {
			// No matching artists found
			res.json({ success: false, message: 'No matching artists found.' });
		}
	} catch (error) {
		console.error('Error searching for artists by genre:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

//GET ALL ARTISTS

router.get('/artist/all', async (req, res) => {
	try {
		console.log('HERE!');
		const result = await pool.query('SELECT * FROM artists');

		if (result.rows.length > 0) {
			// Artist found, send the information as JSON
			console.log(result.rows);
			res.json({ success: true, response: result.rows });
		} else {
			// Artist not found
			res.json({ success: false, message: 'Artist not found.' });
		}
	} catch (error) {
		console.error('Error searching for artist:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

//GET ARTIST

router.get('/artist/:query', async (req, res) => {
	try {
		const { query } = req.params;

		// Query the database for the artist using ILIKE for case-insensitive search
		const result = await pool.query('SELECT * FROM artists WHERE artist ILIKE $1', [`%${query}%`]);

		if (result.rows.length > 0) {
			// Artist found, send the information as JSON
			res.json({ success: true, response: result.rows[0] });
		} else {
			// Artist not found
			res.json({ success: false, message: 'Artist not found.' });
		}
	} catch (error) {
		console.error('Error searching for artist:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

//GET ALBUM With TRACKS by searching ALBUM and ARTIST

router.get('/album/with-artist', async (req, res) => {
	try {
		const { query1, query2 } = req.query;
		const decodedQuery1 = decodeURIComponent(query1).toString();
		const decodedQuery2 = query2 ? decodeURIComponent(query2).toString() : '';

		// Query the database for albums with a matching name or artist
		const albumResult = await pool.query(
			'SELECT * FROM albums WHERE albumname ILIKE $1 AND artist ILIKE $2',
			[`%${decodedQuery1}%`, `%${decodedQuery2}%`]
		);

		if (albumResult.rows.length === 0) {
			// Album not found
			res.json({ success: false, message: 'Album not found.' });
			return;
		}

		const album = albumResult.rows[0];
		const { albumid } = album;

		// Query the tracks for the selected album
		const trackResult = await pool.query('SELECT * FROM tracks WHERE albumid = $1', [albumid]);

		const tracksArray = trackResult.rows;

		const response = { ...album, tracklist: tracksArray };

		res.json({ success: true, response: response });
	} catch (error) {
		console.error('Error searching for album:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

//GET ALBUM WITH TRACKS by searching just ALBUM
router.get('/album/:query', async (req, res) => {
	try {
		const { query } = req.params;

		// Query the database for albums with a matching name
		const albumResult = await pool.query('SELECT * FROM albums WHERE albumname ILIKE $1', [`%${query}%`]);

		if (albumResult.rows.length === 0) {
			// Album not found
			res.json({ success: false, message: 'Album not found.' });
			return;
		}

		const album = albumResult.rows[0];
		const { albumid } = album;

		// Query the tracks for the selected album
		const trackResult = await pool.query('SELECT * FROM tracks WHERE albumid = $1', [albumid]);

		const tracksArray = trackResult.rows;

		const response = { ...album, tracklist: tracksArray };

		res.json({ success: true, response: response });
	} catch (error) {
		console.error('Error searching for album:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});
//GET TRACK

router.get('/track', async (req, res) => {
	try {
		const { query1, query2 } = req.query;

		const decodedQuery1 = decodeURI(query1);

		const decodedQuery2 = decodeURI(query2);

		console.log(decodedQuery1, decodedQuery2);

		// Query the database for the artist using ILIKE for case-insensitive search
		const artistResult = await pool.query('SELECT * FROM artists WHERE artist ILIKE $1', [
			`%${decodedQuery1}%`,
		]);

		if (artistResult.rows.length > 0) {
			const artist = artistResult.rows[0];
			const artist_id = artist.artist_id;

			// Now that we have the artist_id, we can query the tracks table
			const trackResult = await pool.query(
				'SELECT * FROM tracks WHERE artist_id = $1 AND track ~* $2',
				[artist_id, `.*${decodedQuery2.replace(/'/g, "''")}.*`]
			);

			console.log(trackResult.rows);

			if (trackResult.rows.length > 0) {
				// Always return an array, even if there's only one track
				const tracks = trackResult.rows.map(async (track) => {
					const { albumid } = track;

					// Query the albums table to get additional information
					const albumResult = await pool.query(
						'SELECT * FROM albums WHERE albumid = $1',
						[albumid]
					);

					return {
						artist: artist.artist,
						...track,
						album: albumResult.rows[0].albumname,
					};
				});

				// Wait for all promises to resolve
				const resolvedTracks = await Promise.all(tracks);

				console.log(resolvedTracks);

				res.json({ success: true, response: resolvedTracks });
			} else {
				// Track not found
				res.json({ success: false, message: 'Track not found.' });
			}
		} else {
			// Artist not found
			res.json({ success: false, message: 'Artist not found.' });
		}
	} catch (error) {
		console.error('Error searching for track:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

//GET ALL ALBUMS WITH METADATA BY ARTIST
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
			image: album.image,
			albumid: album.albumid,
			harddrive: album.harddrive,
		}));

		const response = { ...artist, albums: simplifiedAlbums };

		// Send the simplified information as JSON
		res.json({ success: true, response: response });
	} catch (error) {
		console.error('Error searching for artist albums:', error);
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

module.exports = router;
