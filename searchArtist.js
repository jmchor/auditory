const axios = require('axios');
const getAccessToken = require("./accessToken")
const getArtist = require("./getArtist")


async function searchArtist(query) {
    const accessToken = await getAccessToken();

    try {
        // Encode the query to replace spaces with %20
        const encodedQuery = encodeURIComponent(query);
        console.log(encodedQuery)

        const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=artist&limit=5`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const items = response.data.artists.items;

        // Filter results based on an exact match with the query
        const artistObject = items
            .filter(item => item.name.toLowerCase() === query.toLowerCase())
            .map(item => ({
                spotifyID: item.id,
                artist: item.name,
                genres: item.genres,
                more_info: item.href,
            }));

        if (artistObject.length === 0) {
            // No matching artist found
            return null;
        }

        // Get the artist's albums
        const albums = await getArtist(artistObject[0].spotifyID);
        artistObject[0].albumids = albums.albumids;

        return artistObject[0];

    } catch (error) {
        console.error('Error searching for artists:', error.message);
        throw error; // Throw the error to be handled by the calling code
    }
}

module.exports = searchArtist;


module.exports = searchArtist;


