# FilmRecension

FilmRecension is a REST API for a backend course assignment. Users can browse sample movies, write and edit their own reviews, and save movies to a personal watchlist.

## Technologies and requirements

The API uses JavaScript, Express, and MySQL through `mysql2`. It uses bcrypt to hash passwords, JWTs for authentication, and dotenv to load configuration.

Use Node.js 24 with npm and MySQL 8 with the `mysql` command-line client.

## Install and configure

Run this from the project folder.

```sh
npm ci
```

Copy `.env.example` to `.env` in the project folder. Set `DB_PASSWORD` to the password you choose for the MySQL app account below and generate a value for `JWT_SECRET` with this command.

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
JWT_SECRET=your_generated_secret
```

Keep `.env` private.

## Set up MySQL

Start MySQL. From the project folder, open the MySQL client as an administrator and enter your password when prompted.

```sh
mysql --user=root --password
```

**Warning:** `setup.sql` drops and recreates the four FilmRecension tables. Running it again deletes existing users, movies, reviews, and watchlist entries, then reloads the sample movies.

At the `mysql>` prompt, run the setup script.

```sql
SOURCE database/setup.sql;
```

Create the local app account and grant it access to the `filmrecension` database. Replace `your_local_password` with the same password you set in `.env`. If the account already exists, skip `CREATE USER` and use its existing password in `.env`.

```sql
CREATE USER 'filmrecension_app'@'localhost' IDENTIFIED BY 'your_local_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON filmrecension.* TO 'filmrecension_app'@'localhost';
```

## Start the server

Exit the MySQL client with `exit` and run this from the project folder.

```sh
npm start
```

Open `http://localhost:3000/api/movies` to check that the API returns the sample movies. Use your configured `PORT` if you changed it.

## API routes

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create an account |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/movies` | Public | List movies |
| GET | `/api/movies/:id` | Public | Get one movie |
| GET | `/api/movies/:movieId/reviews` | Public | List a movie's reviews |
| POST | `/api/movies/:movieId/reviews` | JWT | Add a review |
| PUT | `/api/reviews/:id` | JWT, owner only | Update your own review |
| GET | `/api/watchlist` | JWT | List your saved movies |
| POST | `/api/watchlist/:movieId` | JWT | Save a movie |
| DELETE | `/api/watchlist/:movieId` | JWT | Remove a saved movie |

## Authentication and example requests

Set `Content-Type: application/json` when sending a JSON body. Use an email and password to register and log in.

```json
{ "email": "alice@example.com", "password": "example-password" }
```

Login returns a `token`. Send it as `Authorization: Bearer <token>` on routes marked JWT.

To add or update a review, send a whole-number rating from 1 to 10 and a non-empty comment.

```json
{ "rating": 8, "comment": "A thoughtful and enjoyable film." }
```

## Classes and database diagram

`Movie` formats database rows for movie and watchlist responses. `Review` represents review data and checks the rating and comment when a review is created or updated.

See the [ER diagram](database/er-diagram.md) for the database relationships.
