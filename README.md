# FilmRecension

FilmRecension is a backend-only movie review API. Users can register and log in,
browse sample movies, write and update their own reviews, and manage a personal
watchlist.

## Requirements

- Node.js 24 with npm (the version used for verification)
- MySQL 8 with the `mysql` command-line client
- PowerShell 7.3 or later for the Windows `curl.exe` examples below

## Install and configure

From the repository root, install the locked dependencies:

```sh
npm ci
```

In PowerShell, copy `.env.example` to `.env` with:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux, use `cp .env.example .env`. Set your local MySQL details in
`.env` and keep the file private. Replace the example `DB_PASSWORD` and generate
a fresh value for `JWT_SECRET` with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=filmrecension_app
DB_PASSWORD=your_local_password
DB_NAME=filmrecension
JWT_SECRET=your_long_random_secret
```

Start your MySQL service, then open the MySQL client from the repository root
with a MySQL administrator account. The client prompts for your password:

```sh
mysql --user=root --password
```

**Run the setup on a fresh database.** The script drops and recreates the four
FilmRecension tables and reloads the sample movies. Running it again deletes
existing FilmRecension users, reviews, and watchlist entries.

At the `mysql>` prompt, load the schema and seed data:

```sql
SOURCE database/setup.sql;
```

In the same MySQL session, create the dedicated account from the example
`.env` and grant it access. Replace the password before running these commands:

```sql
CREATE USER 'filmrecension_app'@'localhost' IDENTIFIED BY 'your_local_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON filmrecension.* TO 'filmrecension_app'@'localhost';
```

Set the same account and password in `.env` and leave `DB_NAME=filmrecension`
for the supplied schema. You can use an existing MySQL account if it already
has these permissions. Exit the MySQL client with `exit`.

## Start the server

```sh
npm start
```

The API listens on `http://localhost:3000` by default. It checks the MySQL
connection before starting. To confirm the sample data is available, open
`http://localhost:3000/api/movies` in a browser.

## API routes

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create an account |
| POST | `/api/auth/login` | Public | Verify credentials and receive a JWT |
| GET | `/api/movies` | Public | List movies |
| GET | `/api/movies/:id` | Public | Get one movie |
| GET | `/api/movies/:movieId/reviews` | Public | List a movie's reviews |
| POST | `/api/movies/:movieId/reviews` | JWT | Add a review |
| PUT | `/api/reviews/:id` | JWT, owner only | Update your own review |
| GET | `/api/watchlist` | JWT | List your saved movies |
| POST | `/api/watchlist/:movieId` | JWT | Save a movie |
| DELETE | `/api/watchlist/:movieId` | JWT | Remove a saved movie |

Protected routes expect `Authorization: Bearer <token>`. Register and log in
with JSON bodies such as:

```json
{ "email": "alice@example.com", "password": "example-password" }
```

Login returns a `token`. Send that token in the `Authorization` header for
review and watchlist requests. Review requests use a JSON body like:

```json
{ "rating": 8, "comment": "A thoughtful and enjoyable film." }
```

Ratings must be whole numbers from 1 to 10, and comments cannot be empty.
Duplicate accounts, reviews, and watchlist entries return `409 Conflict`.
Invalid input returns `400`, missing or invalid tokens return `401`, attempts to
edit another user's review return `403`, and unknown records return `404`.

## Manual test walkthrough

The following examples use `curl.exe` in PowerShell 7.3 or later. They create
sample users, reviews, and watchlist entries, so use a demo database.
Replace IDs with values returned by your API. Log in and copy the returned
token into `$token`.

Register two users so review ownership can be demonstrated:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"example-password"}'
curl.exe -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"bob@example.com","password":"example-password"}'
curl.exe -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"example-password"}'
$token = "PASTE_ALICE_TOKEN_HERE"
```

Browse movies, create a review, and read it:

```powershell
curl.exe http://localhost:3000/api/movies
curl.exe http://localhost:3000/api/movies/1
curl.exe -X POST http://localhost:3000/api/movies/1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"rating":8,"comment":"A thoughtful and enjoyable film."}'
curl.exe http://localhost:3000/api/movies/1/reviews
curl.exe -X PUT http://localhost:3000/api/reviews/1 -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"rating":9,"comment":"Updated after another viewing."}'
```

Log in as Bob and try to edit Alice's review ID; the API should return `403`.
Then restore Alice's token to test the watchlist:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"bob@example.com","password":"example-password"}'
curl.exe -X PUT http://localhost:3000/api/reviews/1 -H "Authorization: Bearer BOB_TOKEN" -H "Content-Type: application/json" -d '{"rating":9,"comment":"Trying another user's review."}'
$token = "PASTE_ALICE_TOKEN_HERE"
curl.exe -X POST http://localhost:3000/api/watchlist/2 -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/watchlist -H "Authorization: Bearer $token"
curl.exe -X DELETE http://localhost:3000/api/watchlist/2 -H "Authorization: Bearer $token"
```

Check important failures:

```powershell
curl.exe -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"wrong-password"}'
curl.exe -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"example-password"}'
curl.exe -X POST http://localhost:3000/api/movies/1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"rating":11,"comment":"Invalid rating."}'
curl.exe http://localhost:3000/api/movies/999999
curl.exe -X POST http://localhost:3000/api/movies/1/reviews -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"rating":8,"comment":"Duplicate review."}'
curl.exe -X POST http://localhost:3000/api/watchlist/2 -H "Authorization: Bearer $token"
curl.exe -X POST http://localhost:3000/api/watchlist/2 -H "Authorization: Bearer $token"
curl.exe http://localhost:3000/api/watchlist
```

The last request omits a token and should return `401`.

## Classes

`Movie` converts database movie rows into the JSON shape returned by movie and
watchlist routes. `Review` represents review data and keeps the shared rating
and comment validation in one place for creating and updating reviews.

See [database/er-diagram.md](database/er-diagram.md) for the relationships.
