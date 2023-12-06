const axios = require('axios');
const getAccessToken = require("./accessToken")


async function getArtist(id) {

    const accessToken = await getAccessToken();

    try {

        const response = await axios.get(`https://api.spotify.com/v1/artists/${id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });



        const { name, genres, href } = response.data

        const allAlbums = await axios.get(`https://api.spotify.com/v1/artists/${id}/albums`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const { items } = allAlbums.data

        const albums = items.map(item => {
            return item.id
        })

        const artistObject = { spotifyID: id, artist: name, genres, albumids: albums, more_info: href }

        return artistObject

    } catch (error) {
        console.error('Error getting playlists:', error.message);
        return null;
    }
}


module.exports = getArtist;

