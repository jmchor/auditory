const pool = require('./db');
const fs = require('fs');
const readline = require('readline');
const { Pool } = require('pg');

// Replace with your PostgreSQL connection detail

const filePath = './artist.txt'; // Replace with the path to your text file

async function updateHarddriveColumn() {
	const fileStream = fs.createReadStream(filePath);
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	});

	for await (const artistNameFromFile of rl) {
		const normalizedArtistFromFile = artistNameFromFile.toLowerCase(); // Convert to lowercase

		try {
			// Check if the artist exists in the "artists" table (ignoring case)
			const result = await pool.query(
				'UPDATE artists SET harddrive = TRUE WHERE LOWER(artist) = $1 RETURNING *',
				[normalizedArtistFromFile]
			);

			if (result.rows.length > 0) {
				console.log(`Updated harddrive status for artist: ${artistNameFromFile}`);
			} else {
				console.log(`Artist not found: ${artistNameFromFile}`);
			}
		} catch (error) {
			console.error(`Error updating artist: ${artistNameFromFile}`, error);
		}
	}

	pool.end(); // Close the connection pool after processing
}

updateHarddriveColumn();
