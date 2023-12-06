const axios = require('axios');
const apiKey = process.env.API_KEY;
const apiUrl = 'https://youtube.googleapis.com/youtube/v3/search';


async function searchYouTubeVideos(query) {
    
 
    try {
              const params = {
                part: 'snippet,id',
                maxResults: 1,
                q: query,
                key: apiKey,
              };
            const response = await axios.get(apiUrl, { params });
          
            const url = `https://www.youtube.com/watch?v=${response.data.items[0].id.videoId}`;

           console.log("The URL is here:" + url)
           return url;
  
              
          } catch (error) {
            console.error('Request error', error.message);
          }
        }
      
 
module.exports = searchYouTubeVideos;