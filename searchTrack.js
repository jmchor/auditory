const axios = require('axios');
const getAccessToken = require('./accessToken');

async function searchTrack(query) {
	const accessToken = await getAccessToken();

	try {
		// Encode the query to replace spaces with %20
		const encodedQuery = encodeURIComponent(query);

		const response = await axios.get(
			`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const dataPoints = response.data.tracks.items;

		// Filter results based on an exact match with the query
		const trackObject = dataPoints
			.filter((dataPoint) => dataPoint.name.toLowerCase() === query.toLowerCase())
			.map((dataPoint) => ({
				track_id: dataPoint.id,
				track: dataPoint.name,
				duration: millisToMinutesAndSeconds(dataPoint.duration_ms),
				albumid: dataPoint.album.id,
				artist_id: dataPoint.artists[0].id, // Assuming this is the artist ID
			}));

		if (trackObject.length === 0) {
			// No matching track found
			return null;
		}

		const artistResponse = await axios.get(
			`https://api.spotify.com/v1/artists/${trackObject[0].artist_id}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const artistData = artistResponse.data;

		const artistObject = {
			artist_id: artistData.id,
			artist: artistData.name,
			genres: artistData.genres,
			more_info: artistData.href,
		};

		return { trackObject, artistObject };
	} catch (error) {
		console.error('Error searching for tracks:', error.message);
		throw error; // Throw the error to be handled by the calling code
	}
}

// Utility function to convert milliseconds to minutes and seconds
function millisToMinutesAndSeconds(millis) {
	let minutes = Math.floor(millis / 60000);
	let seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

module.exports = searchTrack;
