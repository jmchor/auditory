const axios = require('axios');
const getAccessToken = require('./accessToken');

const clientID = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// Function to get playlists and their IDs
async function getPlaylists(accessToken) {
	try {
		const response = await axios.get(
			'https://api.spotify.com/v1/users/3157dolwsbzippqyy6yrbbjislx4/playlists',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const allPlaylists = response.data.items.map((playlist) => ({ id: playlist.id, name: playlist.name }));

		return allPlaylists;
	} catch (error) {
		console.error('Error getting playlists:', error.message);
		return null;
	}
}

// Function to convert MS to m and s
function millisToMinutesAndSeconds(millis) {
	let minutes = Math.floor(millis / 60000);
	let seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

// Function to get playlist details and tracks for a given playlist ID
async function getPlaylistDetails(accessToken, playlistId) {
	const allTrackInfo = [];
	try {
		const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		response.data.items.map((item) => {
			const track = item.track;
			const track_id = track.id;
			const artists = track.artists.map((artist) => artist.name).join(', '); // Join multiple artists if there are any
			const artistId = track.artists.map((artist) => artist.id)[0];
			const { name, id } = track.album;

			const duration = track.duration_ms;
			const durationMinutesSeconds = millisToMinutesAndSeconds(duration);

			const songObject = {
				artist: artists,
				artist_id: artistId,
				track: track.name,
				track_id,
				duration: durationMinutesSeconds,
				albumName: name,
				albumID: id,
			};

			allTrackInfo.push(songObject); // Push the songObject to the array
		});

		return allTrackInfo;
	} catch (error) {
		console.error(`Error getting playlist details for playlist ${playlistId}:`, error.message);
		return [];
	}
}

// Main function
async function main() {
	// Get access token
	const accessToken = await getAccessToken();

	// Proceed only if access token is obtained
	if (accessToken === null) {
		console.log('Unable to obtain access token. Exiting.');
		process.exit(1);
	}

	// // Get playlists
	const playlists = await getPlaylists(accessToken);
	const allTracks = [];

	// Iterate through playlists
	for (const playlist of playlists) {
		const tracks = await getPlaylistDetails(accessToken, playlist.id);
		allTracks.push(...tracks);

		// Add tracks to the playlist object
		// playlist.tracks = tracks;
		// return tracks;
	}
	return allTracks;
}

module.exports = { main, millisToMinutesAndSeconds };
