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
//===========================  FETCH ALBUMIDS FROM ALBUMS TABLE =====================================
//===================================================================================================

router.get('/album_ids', async (req, res, next) => {
	try {
		const allAlbums = await pool.query('SELECT DISTINCT albumid FROM albums');

		const albumIDs = allAlbums.rows.map((row) => row.albumid).flat();

		albumIDsArray = albumIDs;

		res.json(albumIDsArray);
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
		const delayDuration = 1000;
		let iterationCounter = 0;

		albumIDsArray = [
			'4Vv2AV5fDsjzOume79vXqK',
			'4uG8q3GPuWHQlRbswMIRS6',
			'7DOfHJBR8vjFnOeg2q3ich',
			'6deiaArbeoqp1xPEGdEKp1',
			'2Sjpjtk2LrVs4djFTr2RmJ',
			'4JmrIJbpHWHZxOJg4awGh4',
			'2qnnUYHObTYAYhUEL4MC43',
			'58alCatewkjNm9IM1Ucj67',
			'28q2N44ocJECgf8sbHEDfY',
			'13sWe0tYKenwLd2t25bHIi',
			'0CA2EVHhRPR5VPV78KZw89',
			'5OubC3vkQNuA3rVu6iD6xa',
			'2XdVmzy6wBoXxqmvBrPB0x',
			'3rxF05Aux0QTrN533Kjc91',
			'7IDywTRaCI8qzS3X8tNU3x',
			'1QZi8laY96nhaeGSklvN4D',
			'3sxJpkdsLs0F2D3cSsrYEB',
			'3J6Tc1cPw8LovadG8LkcFP',
			'2QgGoL5VSQhPHudTObS7zK',
			'1tWgv9v78StWukBRBVNyxA',
			'2DumvqHl78bNXuvU9kQfPN',
			'2UqJjz5eMYRzbbKToD3Peh',
			'42QVkdlfEk9uaG0NboeKpq',
			'652N05EcNH1a4bIlUixQE2',
			'3R6Z3Hp8EMdhgkA5t89NiL',
			'6AnpM7DFltgJLIjlToxYJ1',
			'7IoPLwGpntUE7VaEXEU67i',
			'0NufsuTuf3U0BY0p6jFdxV',
			'3CFswsRArMIduymEMdBaHi',
			'4KZGe18wZJbXL6JLW4KyLc',
			'2AcYgdvD5Fmfa27CsNoCAS',
			'3dLKM8bD8R3H3XnSOXGjTF',
			'1H9g6j4Wwj6wh6p8YHVtkf',
			'70GAqt2avSiKBJ2IEymou1',
			'67v63ubEsvDUQkYMzI7A9t',
			'72qrnM4yUNMDDlWiqKc8iY',
			'4J79cxsmRqZbI0BKmNFDy2',
			'2TAeZbcOfhZnaL2wLNtPyj',
			'4ZDBQSIDIZRUBOG2OHcN3T',
			'6N9IuJzAOwbzPx9oM0ar0j',
			'6XiOgru3HoBvQt2oybb383',
			'6GLHwIp1K3u1zdLOdPRG0W',
			'2BCI4Oj05SiqooWWBqUqjT',
			'2kHGB7mHwxG9iJ9X9Ex3Q3',
			'6Ef4yClroC8pMGktYOUd5n',
			'6jmesEKzKTLAa3oI96jWow',
			'4X87hQ57jTYQTcYTaJWK5w',
			'2fThnKRzs6iudIAzHP9VOa',
			'52kEF3wvknVbIAk28VStyL',
			'1ja2qzCrh6bZykcojbZs82',
			'6ZizJ3rk1Eok7JOKL6UMwv',
			'6SS8I9qRTwh0tMdAYoTbat',
			'1S7mumn7D4riEX2gVWYgPO',
			'6Rk2VghhfqeYrgKxS21eBh',
			'55tK4Ab7XHTOKkw0xDz3AA',
			'1n8QZFcwx5aQ2LIIlj0iYe',
			'6zWmAA39H0c4SjnD4MB1Dm',
			'6bzqUICBtzct7TiQC8if9s',
			'5yrouz3mmUWSsCufl1tLUJ',
			'08mPxuP35Db56jUUgRvGFs',
			'5nbEy2Nx0M5S8Mtnf3pCEw',
			'7xCSZZQEnMSSpzTgWzrPhG',
			'2o2G49EPi4lua5zgxUKhLL',
			'6GDFV4kWsQDYuah6tSqmu2',
			'4NDM4HzjJYI27hwvwmKj6s',
			'44Ig8dzqOkvkGDzaUof9lK',
			'1cM3r0WQZWNkCpEbmFjLln',
			'1pL7ML56e7X0a0FdEGHO5W',
			'5l5m1hnH4punS1GQXgEi3T',
			'2bjTVISSsvwia7uxrrEsuQ',
			'2x2VoPa1pG2jSElA73a9Xa',
			'25JdFEbKXocMQyJdlBzD5d',
			'0YCraVqAWvJHiBYP2AXgV6',
			'16VJRQuM2mXHkuppi3SNAh',
			'7IFxOeu4nvoZlVPkE8GCf1',
			'7gesblPNpHD2mhMQyKd6MS',
			'2QAUtHFOqfnkOVZgRKXlGr',
			'1ijkFiMeHopKkHyvQCWxUa',
			'03GeIP6sDuMEQydiQgwJ9M',
			'2HTLCIs9enszF8Wj4fm3IP',
			'3nUNxSh2szhmN7iifAKv5i',
			'1gTvJG5YnrTiwr0uDuzaoA',
			'4DaRuYVybHMarhtdNWN0Bv',
			'3rHeq4F5wnaLBjNtuz7Yvh',
			'3gz1CZk5wFg2inBuUWDa8x',
			'3REUXdj5OPKhuDTrTtCBU0',
			'1jWoSWzUjyq2v2jnmRv3p8',
			'3zMAFbz27Bd7gtmPFAq46b',
			'6LByYePPTwk8mGhg01em17',
			'0hqgU6C8MRpj88oJzazVyI',
			'5r4qa5AIQUVypFRXQzjaiu',
		];

		// Fetch albums and push them to albumObjects
		for (const albumID of albumIDsArray) {
			try {
				const album = await getSingleAlbum(albumID);
				// Perform operations with the fetched album data
				albumObjects.push(album);

				iterationCounter++;

				// Add a delay after every 10 iterations
				if (iterationCounter % 5 === 0) {
					console.log('Delaying...');
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
// This API call contains TRACK_IDS, since it's the SINGLE-ALBUM-API and uses a different function

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
//===========================  FETCH ALBUMIDS FROM ARTISTS TABLE ====================================
//===================================================================================================

// router.get('/from-artists', async (req, res, next) => {
// 	try {
// 		const allAlbums = await pool.query('SELECT DISTINCT album_ids FROM artists');

// 		const albumIDs = allAlbums.rows.map((row) => row.album_ids).flat();

// 		albumIDsFromArtistsArray = albumIDs;

// 		res.json(albumIDsFromArtistsArray);
// 	} catch (error) {
// 		console.error('Error fetching albumIDs:', error);
// 		res.status(500).send('Internal Server Error');
// 	}
// });

//===================================================================================================
//===== USE ALBUMIDS FROM ARTISTS TABLE TO FETCH BULK API ALBUM DATA AND INSERT INTO ALBUM TABLE ====
//===================================================================================================
// This API call does NOT contain TRACK_IDS, since it's the SEVERAL-ALBUM-API

router.post('/from-artists', async (req, res, next) => {
	const albumObjects = [];
	const failedFetches = [];

	try {
		// Fetch albums and push them to albumObjects

		try {
			const album = await getAlbums(albumIDsArray);

			albumObjects.push(album);
			console.log('Preparing album Objects array');
		} catch (error) {
			// Log the error, push the failed ID to the array, and continue with the next item
			console.error('Error fetching or processing album:', error);
			failedFetches.push(album.albumName);
		}

		// Process each albumObject
		for (const albumObject of albumObjects.flat()) {
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
							'UPDATE albums SET label = $2, tracks = $3, releasedate = $4, album_type = $5, albumname = $6 WHERE albumid = $1 RETURNING *   ',
							[albumId, label, trackCount, releaseDate, album_type, albumName]
						);

						console.log(`Updated album '${albumName}'`);
					} else {
						// Information is the same, skip
						console.log(`Album '${albumName}' already exists. Skipping insertion.`);
					}
				} else {
					// If the album doesn't exist, insert it
					const result = await pool.query(
						'INSERT INTO albums (albumid, label, albumname, artist, tracks, releasedate, album_type) ' +
							'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
						[albumId, label, albumName, artist, trackCount, releaseDate, album_type]
					);

					// Optionally, you can log the result or perform additional actions
					console.log('Inserted album:', albumName);
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

//===================================================================================================
//============= HELPER ROUTES & FUNCTIONS TO CLEAN UP DB RECORDS ====================================
//===================================================================================================

// async function getEmptyTrackIds() {
// 	try {
// 		// Execute the query
// 		const result = await pool.query('SELECT albumid FROM albums WHERE track_ids = ARRAY[]::VARCHAR[]');

// 		// Extract the values from the result rows and store in the 'empties' array
// 		const empties = result.rows.map((row) => row.albumid);

// 		// Return the 'empties' array
// 		return empties;
// 	} catch (error) {
// 		console.error('Error executing query:', error);
// 		throw error; // Handle the error as needed
// 	}
// }

// router.get('/empty-trackids', async (req, res, next) => {
// 	try {
// 		const empties = await getEmptyTrackIds();

// 		res.json(empties);
// 	} catch (error) {
// 		console.error('Error fetching empty track_ids:', error);

// 		res.status(500).send('Internal Server Error');
// 	}
// });

module.exports = router;
