const axios = require('axios');
const getAccessToken = require('./accessToken');

async function getSingleAlbum(albumID) {
	const accessToken = await getAccessToken();

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
		const response = await axios.get(`https://api.spotify.com/v1/albums/${albumID}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		const album = response.data;

		if (
			!album ||
			!album.id ||
			!album.name ||
			!album.release_date ||
			!album.artists ||
			!album.total_tracks ||
			!album.album_type ||
			!album.tracks
		) {
			console.error('Skipping invalid album:', album);
			return null;
		}

		const { id, name, release_date, artists, total_tracks, album_type, tracks } = album;

		const trackList = tracks.items.map((item) => {
			return item.id;
		});

		const albumObject = {
			albumId: id,
			albumName: name,
			releaseDate: formatReleaseDate(release_date),
			artist: artists[0].name,
			totalTracks: total_tracks,
			album_type: album_type,
			track_ids: trackList,
		};

		return albumObject;
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

module.exports = getSingleAlbum;
