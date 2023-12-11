const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const getTracksFromMultipleAlbums = require('../services/getTracks');

let trackIDsArray = []; // Declare the array outside of the route handlers

//the base route is /tracks

//===================================================================================================
//===========================  FETCH TRACKIDs FROM TRACKS TABLE =====================================
//===================================================================================================

router.get('/from-tracks', async (req, res, next) => {
	try {
		const queryResult = await pool.query('SELECT DISTINCT track_id FROM tracks');

		// Extract trackIDs from the query result
		const trackIDs = queryResult.rows.map((row) => row.track_id);

		// Create an object to store the trackIDs
		trackIDsArray = queryResult.rows.map((row) => row.track_id).flat();

		// Respond with the trackIDs object
		res.json(trackIDsArray);
	} catch (error) {
		console.error('Error fetching track_ids:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//== USE COLLECTED TRACKIDs FOR MULTIPLE ALBUMS AND FETCH API DATA AND INSERT IT IN TRACKS TABLE ===
//===================================================================================================

router.post('/multiple-albums', async (req, res, next) => {
	const trackObjects = [];
	const failedEntries = [];

	if (req.body) {
		trackIDsArray = req.body;
	}

	try {
		try {
			const track = await getTracksFromMultipleAlbums(trackIDsArray);

			trackObjects.push(track);
			console.log('Preparing track Objects array');
		} catch (error) {
			console.error('Error fetching or processing track:', error);
			res.status(500).send('Internal Server Error');
		}
		const flattenedTrackObjects = trackObjects.flat();

		//loop over trackObjects and insert into songs table
		for (const trackObject of flattenedTrackObjects) {
			try {
				// destructure the trackObject
				const { track_id, trackName, artistId, duration, albumId } = trackObject;

				// console.log(trackObject)

				// Check if the track already exists in the database
				const existingTrack = await pool.query('SELECT * FROM tracks WHERE track_id = $1', [
					track_id,
				]);

				if (existingTrack.rows.length > 0) {
					// Track already exists, check if additional info is missing
					const existingInfo = existingTrack.rows[0];

					// Check if any additional info is missing and needs to be updated
					if (
						existingInfo.trackname !== trackName ||
						existingInfo.artistid !== artistId ||
						existingInfo.duration !== duration ||
						existingInfo.albumid !== albumId
					) {
						// Update the table record with additional info
						const updateResult = await pool.query(
							'UPDATE tracks SET track = $1, artist_id = $2, duration = $3, albumid = $4 WHERE track_id = $5 RETURNING *',
							[trackName, artistId, duration, albumId, track_id]
						);

						// Check if the update was successful
						if (updateResult.rows.length > 0) {
							console.log('Track updated:', trackName);
						} else {
							console.log('No matching track found for track_id:', track_id);
							failedEntries.push({
								track_id,
								reason: 'No matching track found',
							});
						}
					} else {
						// No additional info to update
						console.log(
							`Track '${trackName}' already exists with complete info. Skipping update.`
						);
					}
				} else {
					// If the track doesn't exist, insert it
					const insertResult = await pool.query(
						'INSERT INTO tracks (track_id, track, artist_id, duration, albumid) VALUES ($1, $2, $3, $4, $5) RETURNING *',
						[track_id, trackName, artistId, duration, albumId]
					);

					// Optionally, you can log the result or perform additional actions
					console.log('Inserted track:', trackName);
				}
			} catch (error) {
				console.error('Error processing track:', error);
				return; // Stop further processing on error
			}
		}

		res.json({
			success: true,
			message: 'Tracks fetched and processed successfully. Here are the exceptions: ',
			failedEntries,
		});
	} catch (error) {
		console.error('Error processing track_ids:', error);
		res.status(500).send('Internal Server Error');
	}
});

//===================================================================================================
//================== FETCH THE TRACKIDs THAT ARE IN THE ALBUM TABLE ALREADY =========================
//===================================================================================================

router.get('/from-albums', async (req, res, next) => {
	//in the album table, all the trackids are in arrays in the track_ids column
	//we need to flatten the array and then push the trackids into the trackIDsArray

	try {
		const queryResult = await pool.query('SELECT track_ids FROM albums');

		// Extract trackIDs from the query result
		const trackIDs = queryResult.rows.map((row) => row.track_ids);

		// Create an object to store the trackIDs
		trackIDsArray = queryResult.rows.map((row) => row.track_ids).flat();

		// Respond with the trackIDs object
		res.json(trackIDsArray);
	} catch (error) {
		console.error('Error fetching trackIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

router.get('/from-albums/:artistID', async (req, res, next) => {
	const { artistID } = req.params;

	try {
		const queryResult = await pool.query('SELECT track_ids FROM albums WHERE artist_id = $1', [artistID]);

		// Extract trackIDs from the query result
		const trackIDsArray = queryResult.rows.map((row) => row.track_ids).flat();

		// Respond with the trackIDs array
		res.json(trackIDsArray);
	} catch (error) {
		console.error('Error fetching trackIDs:', error);
		res.status(500).send('Internal Server Error');
	}
});

module.exports = router;

module.exports = router;
