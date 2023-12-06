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
  
            // Accessing and storing the result
            const items = response.data.items;
            const videoId = JSON.stringify(items.id.videoId);
            url = `https://www.youtube.com/watch?v=${videoId}`;
  
              
          } catch (error) {
            console.error('Request error', error.message);
          }
        }
      
 
module.exports = searchYouTubeVideos;