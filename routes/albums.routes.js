const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const getAlbums = require('../albums');
const arraysEqual = require('../arraysEqual');

let albumIDsArray = []; // Declare the array outside of the route handlers
let albumIDsFromArtistsArray = [];

//===================================================================================================
//===========================  FETCH ALBUMIDS FROM tracks TABLE =======================================
//===================================================================================================

router.get('/', async (req, res, next) => {
	try {
		// Query to fetch albumIDs from the songs table
		const queryResult = await pool.query('SELECT DISTINCT albumid FROM tracks');

		// Extract albumIDs from the query result
		const albumIDs = queryResult.rows.map((row) => row.albumid);

		// Create an object to store the albumIDs
		albumIDsArray = queryResult.rows.map((row) => row.albumid).flat();

		// Respond with the albumIDs object
		res.json(albumIDsArray);
	} catch (error) {
		console.error('Error fetching albumIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//======= USE ALBUMIDS FROM TRACKS TABLE TO FETCH API ALBUM DATA AND INSERT INTO ALBUM TABLE =========
//===================================================================================================

router.post('/', async (req, res, next) => {
	try {
		const albumObjects = [];

		// Fetch albums and push them to albumObjects
		for (const albumID of albumIDsArray) {
			try {
				const album = await getAlbums(albumID);
				// Perform operations with the fetched album data
				albumObjects.push(album);
			} catch (error) {
				console.error('Error fetching or processing album:', error);
				res.status(500).send('Internal Server Error');
				return; // Stop further processing on error
			}
		}

		// Process each albumObject
		for (const albumObject of albumObjects) {
			try {
				const { albumId, label, albumName, artist, releaseDate, trackCount, album_type } =
					albumObject;

				// Check if the album already exists in the database
				const existingAlbum = await pool.query('SELECT * FROM albums WHERE albumid = $1', [
					albumId,
				]);

				if (existingAlbum.rows.length > 0) {
					// Album already exists, skip insertion
					console.log(
						`Album '${albumName}' by '${artist}' already exists. Skipping insertion.`
					);
				} else {
					// If the album doesn't exist, insert it
					const result = await pool.query(
						'INSERT INTO albums (albumid, label, albumname, artist, tracks, track_ids, releasedate, album_type) VALUES ($albumId, $label, $albumName, $artist, $trackCount, $track_ids, $releaseDate, $album_type) RETURNING *',
						{
							$albumId: albumId,
							$label: label,
							$albumName: albumName,
							$artist: artist,
							$trackCount: trackCount,
							$releaseDate: releaseDate,
							$track_ids: $track_ids,
							$album_type: album_type,
						}
					);

					// Optionally, you can log the result or perform additional actions
					console.log('Inserted album:', result.rows[0]);
				}
			} catch (error) {
				console.error('Error processing album:', error);
				res.status(500).send('Internal Server Error');
				return; // Stop further processing on error
			}
		}

		// Respond with a success message or additional data
		res.json({ success: true, message: 'Albums fetched and processed successfully.' });
	} catch (error) {
		console.error('Error processing albumIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//===========================  FETCH ALBUMIDS FROM ARTISTS TABLE =====================================
//===================================================================================================

router.get('/from-artists', async (req, res, next) => {
	try {
		const allAlbums = await pool.query('SELECT DISTINCT album_ids FROM artists');

		const albumIDs = allAlbums.rows.map((row) => row.album_ids).flat();

		albumIDsFromArtistsArray = albumIDs;

		res.json(albumIDsFromArtistsArray);
	} catch (error) {
		console.error('Error fetching albumIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//======= USE ALBUMIDS FROM ARTISTS TABLE TO FETCH API ALBUM DATA AND INSERT INTO ALBUM TABLE =======
//===================================================================================================

router.post('/from-artists', async (req, res, next) => {
	const albumObjects = [];
	const failedFetches = [];

	try {
		// Fetch albums and push them to albumObjects

		try {
			const album = await getAlbums(testArray);

			albumObjects.push(album);
			console.log('Preparing album Objects array');
		} catch (error) {
			// Log the error, push the failed ID to the array, and continue with the next item
			console.error('Error fetching or processing album:', error);
			failedFetches.push(album.albumName);
		}

		// Process each albumObject
		for (const albumObject of albumObjects) {
			try {
				const {
					albumId,
					label,
					albumName,
					artist,
					releaseDate,
					trackCount,
					track_ids,
					album_type,
				} = albumObject;

				// Check if the album already exists in the database
				const existingAlbum = await pool.query('SELECT * FROM albums WHERE albumid = $1', [
					albumId,
				]);

				if (existingAlbum.rows.length > 0) {
					// Album already exists, check for updates
					const existingData = existingAlbum.rows[0];

					if (
						existingData.albumname !== albumName ||
						existingData.label !== label ||
						existingData.trackCount !== trackCount ||
						existingData.releaseDate !== releaseDate ||
						!arraysEqual(existingData.track_ids, track_ids) ||
						existingData.album_type !== album_type
					) {
						// If information differs, update the existing record
						const result = await pool.query(
							'UPDATE albums SET label = $2, trackCount = $3, releasedate = $4, track_ids = $5, album_type = $6, albumname = $7 WHERE albumid = $1 RETURNING *   ',
							[
								albumId,
								label,
								trackCount,
								releaseDate,
								track_ids,
								album_type,
								albumName,
							]
						);

						console.log(
							`Updated album '${albumName}' by '${artist}':`,
							result.rows[0]
						);
					} else {
						// Information is the same, skip
						console.log(
							`Album '${albumName}' by '${artist}' already exists. Skipping insertion.`
						);
					}
				} else {
					// If the album doesn't exist, insert it
					const result = await pool.query(
						'INSERT INTO albums (albumid, label, albumname, artist, tracks, releasedate, track_ids, album_type) ' +
							'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
						[
							albumId,
							label,
							albumName,
							artist,
							trackCount,
							releaseDate,
							track_ids,
							album_type,
						]
					);

					// Optionally, you can log the result or perform additional actions
					console.log('Inserted album:', result.rows[0]);
				}
			} catch (error) {
				console.error('Error processing album:', error);
				failedFetches.push(albumObject.albumName);
				continue; // Continue with the next album on error
			}
		}

		// Respond with a success message or additional data
		res.json({ success: true, message: 'Albums fetched and processed successfully.' });
	} catch (error) {
		console.error('Error processing albumIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

module.exports = router;
