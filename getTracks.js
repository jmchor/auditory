const axios = require('axios');
const getAccessToken = require('./accessToken');

function millisToMinutesAndSeconds(millis) {
	let minutes = Math.floor(millis / 60000);
	let seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

async function getMultipleTracks(array) {
	try {
		const accessToken = await getAccessToken();

		const MAX_REQUESTS_PER_SECOND = 10;
		const DELAY_BETWEEN_REQUESTS = 1000 / MAX_REQUESTS_PER_SECOND; // Milliseconds

		// Split the array into chunks of 50 tracks and concatenate them into a string, where each track is separated by %2C
		const chunks = array.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index / 50);

			if (!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = [];
			}

			resultArray[chunkIndex].push(item);

			return resultArray;
		}, []);

		const IDs = chunks.map((innerArray) => innerArray.join(','));

		const trackObjects = [];

		for (const idsString of IDs) {
			const response = await axios.get(`https://api.spotify.com/v1/tracks?ids=${idsString}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			const tracks = response.data.tracks;

			for (const track of tracks) {
				if (
					!track ||
					!track.id ||
					!track.name ||
					!track.album ||
					!track.artists ||
					!track.duration_ms
				) {
					// Skip the track if it's empty or not valid
					console.error('Skipping invalid track:', track);
					continue;
				}
				const { id, name, album, artists, duration_ms } = track;
				const trackObject = {
					track_id: id,
					trackName: name,
					albumId: album.id,
					artistId: artists[0].id, // Assuming this is the artist ID
					duration: millisToMinutesAndSeconds(duration_ms),
				};

				trackObjects.push(trackObject);
			}

			// Introduce delay to comply with rate limit
			await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
		}

		return trackObjects;
	} catch (error) {
		const retryAfter = error.response.headers['retry-after'];

		if (retryAfter) {
			console.log(`Retry-After header found. Retry after ${retryAfter} seconds.`);
			// Implement your retry logic here (e.g., wait for the specified duration and then retry)
		}
		console.error('Error getting tracks:', error);
		return null;
	}
}

module.exports = getMultipleTracks;
