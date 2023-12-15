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

let trackIDsArray = []; // Declare the array outside of the route handlers

let albumIDsArray = []; // Declare the array outside of the route handlers
let albumIDsFromArtistsArray = [];

//the base route is /catchall

//===================================================================================================
//===========================  Here We Catch all Data in one go =====================================
//===================================================================================================

//Here, we bundle routes to insert an artist, album, and tracks in one go

// use the search/artist/:query route to search for an artist --> get the artist id --> insert the artist in DB
//with that array, we use the post /with-trackids route to insert the albums with trackIDs
//then, we use the /tracks/from-albums route to get the trackIDs of all albums as an array
//with that array, we use the post /multiple-albums route to insert the tracks into the DB

router.post('/:query', async (req, res, next) => {
	const query = req.params.query;

	try {
		console.log('Running the artist search route');
		const artistResponse = await axios.post(`${api}/search/single-artist/${query}`);

		const artistObject = {
			artist_id: artistResponse.data.artist.artist_id,
			artist: artistResponse.data.artist.artist,
			genres: artistResponse.data.artist.genres,
			album_ids: artistResponse.data.artist.album_ids,
			image: artistResponse.data.artist.image,
		};

		// Make a request to fetch album information using album_ids
		console.log('Running the album search route');
		const albumResponse = await axios.post(`${api}/albums/with-trackids`, artistObject.album_ids);

		//Wait for 3 seconds to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Now, make a request to fetch tracks from albums
		console.log('Running the track search route');
		const trackResponse = await axios.get(`${api}/tracks/from-albums/${artistObject.artist_id}`);

		// Process trackResponse as needed

		// Make a request to process tracks from multiple albums
		const processedTracks = await axios.post(`${api}/tracks/multiple-albums`, trackResponse.data);

		// Process processedTracks as needed

		// Respond to the client or continue with additional logic
		res.json({
			success: true,
			artist: artistResponse.data.artist,
			albums: albumResponse.data,
			tracks: processedTracks.data,
		});
	} catch (error) {
		// Handle errors from the requests
		console.error('Error processing requests:', error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
});

module.exports = router;
