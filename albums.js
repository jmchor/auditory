const axios = require('axios');
const getAccessToken = require("./accessToken")

async function getAlbums(id) {

    const accessToken = await getAccessToken();

    function formatReleaseDate(releaseDate) {
        // If the release date has only the year
        if (releaseDate.length === 4) {
          // Assuming January 1 as the default day and month
          return `${releaseDate}-01-01`;
        }
      
        // If the release date is in another format or already includes the full date
        return releaseDate;
      }



    try {
      const response = await axios.get(`https://api.spotify.com/v1/albums/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

       const {label, name, release_date, total_tracks, artists} = response.data


       const albumObject = {albumId: id, label, albumName: name, artist: artists[0].name, releaseDate: formatReleaseDate(release_date), trackCount: total_tracks}
       return albumObject

    } catch (error) {
      console.error('Error getting playlists:', error.message);
      return null;
    }
  }




  module.exports = getAlbums;

