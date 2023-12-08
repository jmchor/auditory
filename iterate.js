const pool = require('./db');

const readline = require('readline');
const { Pool } = require('pg');

// Replace with your PostgreSQL connection detail

const filePath = './artist.txt'; // Replace with the path to your text file

async function processLineByLine() {
	const fileStream = require('fs').createReadStream(filePath);
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	});

	for await (const line of rl) {
		// Assuming each line in the text file is the artist name you want to insert into the database
		const artistName = line.trim();

		// Check if the artist already exists in the database
		const existingArtist = await pool.query('SELECT * FROM artists WHERE artist = $1', [artistName]);

		if (existingArtist.rows.length > 0) {
			// Artist already exists, skip this line
			console.log(`Artist '${artistName}' already exists. Skipping insertion.`);
			continue;
		}

		// Insert data into the database
		try {
			const result = await pool.query('INSERT INTO artists (artist) VALUES ($1) RETURNING *', [
				artistName,
			]);
			console.log('Inserted into database:', result.rows[0]);
		} catch (error) {
			console.error('Error inserting into database:', error);
		}
	}
}

processLineByLine();

// async function fetchArtistsFromSongsTable() {
//     try {
//       const result = await pool.query('SELECT DISTINCT artist FROM tracks');
//       return result.rows.map(row => row.artist);
//     } catch (error) {
//       console.error('Error fetching artists FROM tracks table:', error);
//       throw error;
//     }
//   }

//   async function insertArtistsIntoArtistsTable(artists) {
//     try {
//       for (const artist of artists) {
//         // Check if the artist already exists in the artists table
//         const existingArtist = await pool.query('SELECT 1 FROM artists WHERE artist = $1 LIMIT 1', [artist]);

//         if (existingArtist.rows.length === 0) {
//           // Insert the artist into the artists table
//           await pool.query('INSERT INTO artists (artist) VALUES ($1)', [artist]);
//           console.log(`Inserted artist: ${artist}`);
//         } else {
//           console.log(`Artist already exists: ${artist}`);
//         }
//       }
//     } catch (error) {
//       console.error('Error inserting artists into artists table:', error);
//       throw error;
//     }
//   }

//   async function main() {
//     try {
//       const artistsFromSongs = await fetchArtistsFromSongsTable();
//       await insertArtistsIntoArtistsTable(artistsFromSongs);
//     } finally {
//       // Close the database connection
//       await pool.end();
//     }
//   }

//   main();
