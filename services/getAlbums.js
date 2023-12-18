const axios = require('axios');
const getAccessToken = require('./accessToken');

async function getAlbums(array) {
	const accessToken = await getAccessToken();

	const MAX_REQUESTS_PER_SECOND = 10;
	const DELAY_BETWEEN_REQUESTS = 1000 / MAX_REQUESTS_PER_SECOND; // Milliseconds

	function formatReleaseDate(releaseDate) {
		if (releaseDate.length === 4) {
			return `${releaseDate}-01-01T00:00:00.000Z`;
		} else if (releaseDate.length === 7) {
			return `${releaseDate}-01T00:00:00.000Z`;
		} else {
			return new Date(releaseDate).toISOString().split('T')[0] + 'T00:00:00.000Z';
		}
	}

	try {
		const chunks = array.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index / 20);

			if (!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = [];
			}

			resultArray[chunkIndex].push(item);

			return resultArray;
		}, []);

		let albumObjects = [];
		let counter = 0;

		for (const innerArray of chunks) {
			const idsString = innerArray.join(',');

			const response = await axios.get(`https://api.spotify.com/v1/albums?ids=${idsString}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			const albums = response.data.albums;

			console.log(albums.length);

			for (const album of albums) {
				if (
					!album ||
					!album.id ||
					!album.name ||
					!album.release_date ||
					!album.artists ||
					!album.total_tracks ||
					!album.album_type ||
					!album.images
				) {
					console.error('Skipping invalid album:', album);
					continue;
				}

				const { id, name, release_date, artists, total_tracks, album_type, images } = album;
				const albumObject = {
					albumId: id,
					albumName: name,
					releaseDate: formatReleaseDate(release_date),
					artistId: artists[0].id,
					trackCount: total_tracks,
					album_type: album_type,
					image: images[0].url,
				};
				console.log('IS THE ID HERE?', albumObject);

				albumObjects.push(albumObject);
			}

			// Introduce delay to comply with rate limit

			counter += 1;
			console.log('Delaying requests...', counter);
			await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
		}

		console.log('Albums fetched:', albumObjects.length);

		return albumObjects;
	} catch (error) {
		// const retryAfter = error.response.headers['retry-after'];

		// if (retryAfter) {
		// 	console.log(`Retry-After header found. Retry after ${retryAfter} seconds.`);
		// 	// Implement your retry logic here (e.g., wait for the specified duration and then retry)
		// }
		console.error('Error getting albums:', error.message);

		// return {
		// 	error: true,
		// };
	}
}

module.exports = getAlbums;
