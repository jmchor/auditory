const axios = require('axios');
const getAccessToken = require('./accessToken');
const getArtist = require('./getArtist');

async function searchArtist(query) {
	const accessToken = await getAccessToken();

	try {
		// Encode the query to replace spaces with %20
		const encodedQuery = encodeURIComponent(query);

		const response = await axios.get(
			`https://api.spotify.com/v1/search?q=${encodedQuery}&type=artist&limit=10`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const dataPoints = response.data.artists.items;

		// Filter results based on an exact match with the query
		const artistObject = dataPoints
			.filter((dataPoint) => dataPoint.name.toLowerCase() === query.toLowerCase())
			.map((dataPoint) => ({
				artist_id: dataPoint.id,
				artist: dataPoint.name,
				genres: dataPoint.genres,
				image: dataPoint.images[0].url,
			}));

		if (artistObject.length === 0) {
			// No matching artist found
			return null;
		}

		// Get all albums for the artist

		const allAlbums = await axios.get(
			`https://api.spotify.com/v1/artists/${artistObject[0].artist_id}/albums`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const { items } = allAlbums.data;

		const albums = items.map((item) => {
			return item.id;
		});

		artistObject[0].album_ids = albums;

		return artistObject[0];
	} catch (error) {
		console.error('Error searching for artists:', error.message);
		throw error; // Throw the error to be handled by the calling code
	}
}

module.exports = searchArtist;
