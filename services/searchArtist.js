const axios = require('axios');
const getAccessToken = require('./accessToken');
const getArtist = require('./getArtist');

async function searchArtist(query) {
	try {
		// Get access token
		const accessToken = await getAccessToken();

		// Encode the query to replace spaces with %20
		const encodedQuery = encodeURIComponent(query);

		// Search for artists on Spotify
		const response = await axios.get(
			`https://api.spotify.com/v1/search?q=${encodedQuery}&type=artist&limit=10`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const dataPoints = response.data.artists.items;
		console.log('LOOK HERE', dataPoints);

		// Filter results based on an exact match with the query
		const matchingArtists = dataPoints.filter(
			(dataPoint) => dataPoint.name.toLowerCase() === query.toLowerCase()
		);

		if (matchingArtists.length === 0) {
			// No matching artist found
			return null;
		}

		// Get albums for the first matching artist
		const artistObject = await getArtistDetails(matchingArtists[0], accessToken);

		return artistObject;
	} catch (error) {
		console.error('Error searching for artists:', error.message);
		throw error; // Throw the error to be handled by the calling code
	}
}

async function getArtistDetails(artist, accessToken) {
	// Get all albums for the artist
	const allAlbums = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/albums`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const { items } = allAlbums.data;

	const albums = items.map((item) => item.id);

	// Ensure the artist has an images array before accessing the first element
	const image = artist.images && artist.images.length > 0 ? artist.images[0].url : null;

	return {
		artist_id: artist.id,
		artist: artist.name,
		genres: artist.genres,
		image,
		album_ids: albums,
	};
}

module.exports = searchArtist;
