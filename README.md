# Auditory

- the backend witchcraft for the [reactitory frontend magic](https://github.com/jmchor/reactitory)

Auditory is a CRUD API project designed to facilitate the integration of Spotify data into a PostgreSQL database through RESTful API endpoints. By leveraging the Spotify API, Auditory provides a set of endpoints for fetching specific information, such as artists, albums, tracks, and playlists, and seamlessly inserts this data into your database.

The point of it all was to scratch an itch (of course), which was - brushing up on Node again - using PostgreSQL - finally having a way of knowing what music I have and which I don't

This is pure backend, and you can operate it using Postman.

#### You need a Spotify Developer Account as well as a Google Developer account (for all the keys)

## Endpoints

<details>
    <summary>Search Endpoints</summary>

- **Endpoint:** `POST search/single-track/:query`

     - **Example:** search/single-track/the unforgiven

     - **Description:** Searches for a single track on Spotify based on the provided query and inserts or updates the track information in the PostgreSQL database.

- **Endpoint:** `POST search/single-artist/:query`

     - **Example:** search/single-artist/metallica

     - **Description:** Searches for a single artist on Spotify based on the provided query and inserts or updates the artist information in the PostgreSQL database.

- **Endpoint:** `GET search/genre/all`

     - **Description:** Retrieves all genres from the artists in the database.

- **Endpoint:** `GET search/genre/:query`

     - **Example:** search/genre/hardrock

     - **Description:** Retrieves artists from the database based on a specific genre.

- **Endpoint:** `GET search/artist/:query`

     - **Example:** search/artist/sia

     - **Description:** Retrieves an artist from the database based on the provided name.

- **Endpoint:** `GET search/album/:query`

     - **Example:** search/album/the black album

     - **Description:** Retrieves an album and its tracks from the database based on the provided album name.

- **Endpoint:** `GET search/track/:query`

     - **Example:** search/track/last christmas

     - **Description:** Retrieves a track from the database based on the provided track name.

- **Endpoint:** `GET search/artist/:query/albums`

     - **Example:** search/artist/limp bizkit/albums

     - **Description:** Retrieves all albums with metadata associated with a specific artist.

</details>

<details>
    <summary>Albums Endpoints</summary>

- **Endpoint:** `GET albums/album_ids`

     - **Example:** `albums/album_ids`

     - **Description:** Fetch Album IDs from the albums table in your database and put them in an array

- **Endpoint:** `GET albums/for/:artist_id`

     - **Example:** `albums/for/1dfeR4HaWDbWqFHLkxsg1d`

     - **Description:** Fetch all albums for an artist by artist_id

- **Endpoint:** `POST /with-trackids`

     - **Example:** `albums/with-trackids`

     - **Description:** Fetch Bulk API Album Data and Insert into Album Table (with Track IDs) (Uses the array of Album ID you just GOT with the previous route)

- **Endpoint:** `POST /single-trackids/:id`

     - **Example:** `/single-trackids/63SYDOduS7UPFCbRo7g9cy`

     - **Description:** Fetch Single Album API Data by Album ID and Insert into Album Table (with Track IDs)

- **Endpoint:** `POST /from-artists`

     **Note:** This endpoint does not contain track IDs.

</details>

<details>
    <summary>Artist Endpoint</summary>

- **Endpoint:** `POST artists/single/:id`

     - **Example:** `artists/single/789`

     - **Description:** Fetches information for a single artist based on the provided `id` parameter and populates the `artists` table in the database.

- **Endpoint:** `GET artists/bulk`

     - **Example:** `/artists/bulk`

     - **Description:** Fetches information for all artists from the `tracks` table, populates the `artists` table, and handles bulk operations. It may encounter errors for specific entries, which are logged in the `failedEntries` array.

</details>

<details>
    <summary>Catchall Endpoint</summary>

- **Endpoint:** `POST /catchall/:query`

     - **Example:** `/catchall/JohnDoe`
     - **Description:** Bundles routes to insert an artist, albums, and tracks into the database in one go. It performs the following steps:

          1. Searches for an artist using the `search/single-artist` route.
          2. Inserts the artist information into the `artists` table.
          3. Fetches album information using the artist's `album_ids`.
          4. Inserts the albums with track IDs into the `albums` table using the `albums/with-trackids` route.
          5. Fetches track information from albums using the `tracks/from-albums` route.
          6. Inserts the tracks into the `tracks` table using the `tracks/multiple-albums` route.

     - **Note:** The endpoint expects a search query `:query` as a parameter.

     - **Response:** Returns a JSON object with information about the inserted artist, albums, and tracks.

     - **Error Handling:** If any step encounters an error, it responds with a 500 Internal Server Error and provides details in the response.

</details>

<details>
    <summary>Playlists Endpoint</summary>

- **Endpoint:** `POST /`

     - **Example:** `/`
     - **Description:** Inserts tracks from a playlist into the database. It performs the following steps:

          1. Fetches all tracks from the playlist using the `playListTracks` function.
          2. Iterates through each track and checks if it already exists in the database.
          3. If the track doesn't exist, inserts it into the `songs` table.
          4. Responds with a success message if the tracks are inserted successfully.

     - **Note:** This endpoint uses the HTTP GET method, which may not be semantically correct for insert operations. Consider using a POST request for insertions.

     - **Response:** Returns a message indicating whether the tracks were successfully inserted into the database.

     - **Error Handling:** If any step encounters an error, it responds with a 500 Internal Server Error and provides details in the response.

</details>

<details>
    <summary>YouTube URL Endpoint</summary>

- **Endpoint:** `POST ytupdate/single-track/:id`

     - **Example:** `ytupdate/single-track/123`
     - **Description:** Updates the YouTube URL for a single track identified by its `track_id`. It performs the following steps:

          1. Fetches the track information from the `tracks` table based on the provided `track_id`.
          2. Constructs a search query using the artist and track name.
          3. Searches YouTube for videos matching the query to obtain a YouTube URL.
          4. Updates the `youtube_url` column in the `tracks` table with the obtained YouTube URL.
          5. Responds with a success message and the updated track information.

     - **Note:** The correct way to get the parameter value is corrected in the code (`const id = req.params.id`).

     - **Response:** Returns a success message and the updated track information if the YouTube URL is updated successfully. If no matching track is found for the provided `track_id`, it responds with a 404 Not Found error.

     - **Error Handling:** If any step encounters an error, it responds with a 500 Internal Server Error and provides details in the response.

- **Endpoint:** `POST ytupdate/album/:albumId`

     - **Example:** `/album/456`
     - **Description:** Updates the YouTube URLs for all tracks associated with a specific album identified by `albumId`. It performs the following steps:

          1. Fetches associated artist and track information from the `tracks` and `artists` tables.
          2. Constructs a search query for each track using the artist and track name.
          3. Searches YouTube for videos matching each query to obtain YouTube URLs.
          4. Updates the `youtube_url` column for each track in the `tracks` table.
          5. Responds with a success message once all YouTube URLs are updated.

     - **Response:** Returns a success message once all YouTube URLs are updated successfully.

     - **Error Handling:** If any step encounters an error, it responds with a 500 Internal Server Error and provides details in the response.

     - **Note:** The base route for this endpoint is `/ytupdate`.

</details>

<details>
    <summary>Tracks Endpoint</summary>

- **Endpoint:** `GET /tracks/from-tracks`

     - **Description:** Fetches distinct `track_id` values from the `tracks` table.
     - **Example:** `/tracks/from-tracks`
     - **Response:** Returns an array of unique `track_id` values.

- **Endpoint:** `POST tracks/multiple-albums`

     - **Description:** Processes track information from multiple albums and updates the `tracks` table. It performs the following steps:
          1. Collects track IDs in `trackIDsArray` from the request body.
          2. Uses the collected track IDs to fetch track information from external services.
          3. Updates or inserts track information into the `tracks` table based on existing records.
          4. Responds with a success message and information about any failed entries.
     - **Example:** `tracks/multiple-albums`
     - **Request Body:** Array of track IDs.
     - **Response:** Returns a success message and information about failed entries, if any.

- **Endpoint:** `GET tracks/from-albums`

     - **Description:** Fetches `track_ids` from the `albums` table and flattens the arrays.
     - **Example:** `/tracks/from-albums`
     - **Response:** Returns an array of `track_ids`.

- **Endpoint:** `GET /tracks/from-albums/:artistID`
     - **Description:** Fetches `track_ids` from the `albums` table for a specific artist using `artistID`.
     - **Example:** `/tracks/from-albums/123`
     - **Response:** Returns an array of `track_ids` for the specified artist.

**Note:** The base route for these endpoints is `/tracks`.

</details>

## Getting Started

1. **Clone the Repository:**
      ```bash
      git clone https://github.com/your-username/Auditory.git
      cd Auditory
      ```
2. **Install all dependencies:**
   `bash
npm install
`

## Project Setup

### Setting up your PostgreSQL database

In order to use PostgreSQL, you need to install it via:

```bash
brew install postgresql
brew services start postgresql
```

on a Mac, or for Linux by visiting this link:

[Installing PostgreSQL on Linux](https://www.postgresql.org/download/linux/ubuntu/)

After installation, connect to default database via

```bash
psql postgres
```

Now, create a new role with a new password - those data points should be put into the .env file

```bash
postgres=# CREATE ROLE DB_USER WITH LOGIN PASSWORD 'password';
```

and then

```bash
postgres=# ALTER ROLE DB_USER CREATEDB;
```

run

```bash
postgres=#\du
```

and then exit the default session with

```bash
postgres=#\q
```

Now, you can connect your new user "me" to the database

```bash
psql -d postgres -U me
```

With the new user, you can go ahead an create a new database - also save the name as DB_DATABASE in your .env file

```bash
postgres=> CREATE DATABASE DB_DATABASE;
```

and connect to it

```bash
postgres=>\c DB_DATABASE;
```

With the `CREATE TABLE` command you now have to create at least three tables: **artists**, **albums** and **tracks**

Here is an example:

```bash
CREATE TABLE artists (
    artist_id VARCHAR(255) PRIMARY KEY,
    artist VARCHAR(255),
    genres VARCHAR[],
    album_ids VARCHAR[],
    more_info VARCHAR(255),
    harddrive BOOLEAN DEFAULT FALSE
);
```

### Artist Table

| artist_id (VARCHAR(255), PRIMARY KEY) | artist (VARCHAR(255)) | genres (VARCHAR[]) | album_ids (VARCHAR[]) | more_info (VARCHAR(255)) | harddrive (VARCHAR(255))                            |
| ------------------------------------- | --------------------- | ------------------ | --------------------- | ------------------------ | --------------------------------------------------- |
| The artist's ID                       | The artist's name     | An array of genres | an array of album IDs | an href value            | a Boolean if that artist is saved on your harddrive |

### Tracks Table

| artist_id (VARCHAR(255)) | track (VARCHAR(255)) | duration (VARCHAR(255))   | albumid (VARCHAR(255))              | youtube_url (VARCHAR(255))     | track_id (VARCHAR(255), PRIMARY KEY) |
| ------------------------ | -------------------- | ------------------------- | ----------------------------------- | ------------------------------ | ------------------------------------ |
| The artist's ID          | the track title      | Duration in mins and secs | the id of the album the track is on | the songs probably youtube url | the track's ID                       |

### Albums Table

| albumid (VARCHAR(255), PRIMARY KEY) | albumname (VARCHAR(255)) | artist_id (VARCHAR(255)) | tracks (VARCHAR(255)) | releasedate (DATE)              | track_ids (VARCHAR[])                   | album_type (VARCHAR(255))    | harddrive (VARCHAR(255))                            | image (VARCHAR(255)) |
| ----------------------------------- | ------------------------ | ------------------------ | --------------------- | ------------------------------- | --------------------------------------- | ---------------------------- | --------------------------------------------------- | -------------------- |
| the album's ID                      | the album's name         | The artist's ID          | Number of tracks      | the date of the album's release | an array of all the album's tracks' IDs | single, album or compilation | a Boolean if that artist is saved on your harddrive | an image url         |

### Environment

In order to use the endpoints, you need to create a .env file for your secrets.
There you need to save the following data:

      - API_KEY (for YouTube API)
      - SPOTIFY_CLIENT_ID (Spotify Developer Account)
      - SPOTIFY_CLIENT_SECRET
      - DB_PASSWORD (for your PostgreSQL database)
      - DB_USER
      - DB_HOST
      - DB_DATABASE
      - DB_PORT

### Using the CRUD

I mean, have fun with it! I'm using it on localhost, of course, since it's purely for personal database reasons I wrote this.
The next step would be a nice front end so that Postman can rest for a while (pun intended.)
