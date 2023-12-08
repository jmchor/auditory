const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const getAlbums = require('../albums');
const getSingleAlbum = require('../getSingleAlbum');
const arraysEqual = require('../arraysEqual');

let albumIDsArray = []; // Declare the array outside of the route handlers
let albumIDsFromArtistsArray = [];

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

//===================================================================================================
//===========================  FETCH ALBUMIDS FROM TRACKS TABLE =====================================
//===================================================================================================
//Disable for now, since it's not used

// router.get('/', async (req, res, next) => {
//   albumIDsArray = [];
// 	try {
// 		// Query to fetch albumIDs from the songs table
// 		const queryResult = await pool.query('SELECT DISTINCT albumid FROM tracks');

// 		// Extract albumIDs from the query result
// 		const albumIDs = queryResult.rows.map((row) => row.albumid);

// 		// Create an object to store the albumIDs
// 		albumIDsArray = queryResult.rows.map((row) => row.albumid).flat();

// 		// Respond with the albumIDs object
// 		res.json(albumIDsArray);
// 	} catch (error) {
// 		console.error('Error fetching albumIDs:', error);
// 		res.status(500).send('Internal Server Error');
// 	}
// });

//===================================================================================================
//===========================  FETCH ALBUMIDS FROM ALBUMS TABLE =====================================
//===================================================================================================

router.get('/album_ids', async (req, res, next) => {
	try {
		const allAlbums = await pool.query('SELECT DISTINCT albumid FROM albums');

		const albumIDs = allAlbums.rows.map((row) => row.albumid).flat();

		albumIDsArray = albumIDs;

		res.json(albumIdsFromAlbumsArray);
	} catch (error) {
		console.error('Error fetching albumIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//====== USE ALBUMIDS FROM WHEREVER TO FETCH BULK API ALBUM DATA AND INSERT INTO ALBUM TABLE ========
//===================================================================================================
// This API call contains TRACK_IDS, since it's the SINGLE-ALBUM-API and uses a different function
//the base route is /albums

router.post('/with-trackids', async (req, res, next) => {
	try {
		const albumObjects = [];
		const delayDuration = 3000;
		let iterationCounter = 0;

		// Fetch albums and push them to albumObjects
		for (const albumID of albumIDsArray) {
			try {
				const album = await getSingleAlbum(albumID);
				// Perform operations with the fetched album data
				albumObjects.push(album);

				iterationCounter++;

				// Add a delay after every 10 iterations
				if (iterationCounter % 10 === 0) {
					await delay(delayDuration);
				}
			} catch (error) {
				console.error('Error fetching or processing album:', error);
				res.status(500).send('Internal Server Error');
				return; // Stop further processing on error
			}
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
					album_type,
					track_ids,
				} = albumObject;

				// Check if the album already exists in the database
				const existingAlbum = await pool.query('SELECT * FROM albums WHERE albumid = $1', [
					albumId,
				]);

				if (existingAlbum.rows.length > 0) {
					// Album already exists, check for updates
					const existingData = existingAlbum.rows[0];

					if (
						existingData.label !== label ||
						existingData.albumname !== albumName ||
						existingData.artist !== artist ||
						existingData.tracks !== trackCount ||
						existingData.releasedate !== releaseDate ||
						existingData.album_type !== album_type ||
						arraysEqual(existingData.track_ids, track_ids)
							? existingData.track_ids
							: track_ids
					) {
						// Update the existing record
						const result = await pool.query(
							'UPDATE albums SET label = $2, albumname = $3, artist = $4, tracks = $5, releasedate = $6, album_type = $7, track_ids = $8 WHERE albumid = $1 RETURNING *',
							[
								albumId,
								label,
								albumName,
								artist,
								trackCount,
								releaseDate,
								album_type,
								track_ids,
							]
						);

						console.log(
							`Updated album '${albumName}' by '${artist}':`,
							result.rows[0]
						);
					} else {
						// Information is the same, skip
						console.log(
							`Album '${albumName}' by '${artist}' already exists. Skipping update.`
						);
					}
				} else {
					// If the album doesn't exist, insert it
					const result = await pool.query(
						'INSERT INTO albums (albumid, label, albumname, artist, tracks, track_ids, releasedate, album_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
						[
							albumId,
							label,
							albumName,
							artist,
							trackCount,
							track_ids,
							releaseDate,
							album_type,
						]
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
//============= USE PARAM ID TO FETCH ALBUM API DATA AND INSERT IT IN ALBUM TABLE ===================
//===================================================================================================

router.post('/single-trackids/:id', async (req, res, next) => {
	try {
		const { id } = req.params;

		// Fetch single album based on the provided ID
		const album = await getSingleAlbum(id);

		// Perform operations with the fetched album data
		const { albumId, label, albumName, artist, releaseDate, trackCount, album_type, track_ids } = album;

		// Check if the album already exists in the database
		const existingAlbum = await pool.query('SELECT * FROM albums WHERE albumid = $1', [albumId]);

		if (existingAlbum.rows.length > 0) {
			// Album already exists, check for updates
			const existingData = existingAlbum.rows[0];

			if (
				existingData.label !== label ||
				existingData.albumname !== albumName ||
				existingData.artist !== artist ||
				existingData.tracks !== trackCount ||
				existingData.releasedate !== releaseDate ||
				existingData.album_type !== album_type ||
				arraysEqual(existingData.track_ids, track_ids)
					? existingData.track_ids
					: track_ids
			) {
				// Update the existing record
				const result = await pool.query(
					'UPDATE albums SET label = $2, albumname = $3, artist = $4, tracks = $5, releasedate = $6, album_type = $7, track_ids = $8 WHERE albumid = $1 RETURNING *',
					[albumId, label, albumName, artist, tracks, releaseDate, album_type, track_ids]
				);

				console.log(`Updated album '${albumName}' by '${artist}':`, result.rows[0]);
			} else {
				// Information is the same, skip
				console.log(`Album '${albumName}' by '${artist}' already exists. Skipping update.`);
			}
		} else {
			// If the album doesn't exist, insert it
			const result = await pool.query(
				'INSERT INTO albums (albumid, label, albumname, artist, tracks, track_ids, releasedate, album_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
				[albumId, label, albumName, artist, trackCount, track_ids, releaseDate, album_type]
			);

			// Optionally, you can log the result or perform additional actions
			console.log('Inserted album:', result.rows[0]);
		}

		// Respond with a success message or additional data
		res.json({ success: true, message: 'Album fetched and processed successfully.' });
	} catch (error) {
		console.error('Error processing single album:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//===========================  FETCH ALBUMIDS FROM ARTISTS TABLE ====================================
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
//===== USE ALBUMIDS FROM ARTISTS TABLE TO FETCH BULK API ALBUM DATA AND INSERT INTO ALBUM TABLE ====
//===================================================================================================
// This API call does NOT contain TRACK_IDS, since it's the SEVERAL-ALBUM-API

router.post('/from-artists', async (req, res, next) => {
	const albumObjects = [];
	const failedFetches = [];

	try {
		// Fetch albums and push them to albumObjects

		const testArray = albumIDsFromArtistsArray.slice(0, 10);

		try {
			const album = await getAlbums(testArray);

			albumObjects.push(album);
			console.log('Preparing album Objects array');
		} catch (error) {
			// Log the error, push the failed ID to the array, and continue with the next item
			console.error('Error fetching or processing album:', error);
			failedFetches.push(album.albumName);
		}

		console.log(albumObjects);

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
					// Album already exists, check for updates
					const existingData = existingAlbum.rows[0];

					if (
						existingData.albumname !== albumName ||
						existingData.label !== label ||
						existingData.trackCount !== trackCount ||
						existingData.releaseDate !== releaseDate ||
						existingData.album_type !== album_type
					) {
						// If information differs, update the existing record
						const result = await pool.query(
							'UPDATE albums SET label = $2, trackCount = $3, releasedate = $4, album_type = $5, albumname = $6 WHERE albumid = $1 RETURNING *   ',
							[albumId, label, trackCount, releaseDate, album_type, albumName]
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
						'INSERT INTO albums (albumid, label, albumname, artist, tracks, releasedate, album_type) ' +
							'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
						[albumId, label, albumName, artist, trackCount, releaseDate, album_type]
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

		// // Respond with a success message or additional data
		res.json({ success: true, message: 'Albums fetched and processed successfully.' });
	} catch (error) {
		console.error('Error processing albumIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

module.exports = router;
