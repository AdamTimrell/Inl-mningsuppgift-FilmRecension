# FilmRecension

FilmRecension is a REST API for a backend course assignment. Users can browse sample movies, write and edit their own reviews, and save movies to a personal watchlist.

## Technologies and requirements

The API uses JavaScript, Express, and MySQL through `mysql2`. It uses bcrypt to hash passwords, JWTs for authentication, and dotenv to load configuration.

Use Node.js 24 with npm and MySQL 8 with the `mysql` command-line client.

## Install Node.js and MySQL

### Windows

1. Run the Windows `.msi` for Node.js 24. Keep npm and the PATH option enabled. [Node.js downloads](https://nodejs.org/en/download)
2. Run the MySQL Community Server 8.4 MSI. In MySQL Configurator, set a MySQL `root` password, keep port `3306` if available, and configure MySQL as a Windows service. [MySQL downloads](https://dev.mysql.com/downloads/mysql/8.4.html) · [MySQL Configurator guide](https://dev.mysql.com/doc/refman/8.4/en/mysql-configurator-workflow-server.html)
3. If the service is stopped, open **Services** (`services.msc`) and start the service you named in MySQL Configurator. Add the MySQL `bin` folder (usually `C:\Program Files\MySQL\MySQL Server 8.4\bin`) to your `Path` environment variable and open a new Command Prompt. [MySQL Windows service guide](https://dev.mysql.com/doc/refman/8.4/en/windows-start-service.html)

### macOS (Homebrew)

If needed, install Homebrew and follow the installer's steps to add `brew` to your PATH. [Homebrew installation guide](https://docs.brew.sh/Installation)

Install Node.js with npm and MySQL, add their commands to your terminal's PATH, and start MySQL. To keep the PATH change in new terminals, add the `export` line to `~/.zshrc` if you use the default zsh shell. [Node.js formula](https://formulae.brew.sh/formula/node@24) · [MySQL formula](https://formulae.brew.sh/formula/mysql@8.4)

```sh
brew install node@24 mysql@8.4
export PATH="$(brew --prefix node@24)/bin:$(brew --prefix mysql@8.4)/bin:$PATH"
brew services start mysql@8.4
```

### Linux (Ubuntu 24.04 LTS)

In a terminal, install MySQL with APT and start its service. [Ubuntu MySQL guide](https://ubuntu.com/server/docs/how-to/databases/install-mysql/)

```sh
sudo apt update
sudo apt install curl mysql-server
sudo systemctl start mysql.service
```

Follow the nvm installation guide and reopen your terminal. Then install Node.js 24, which includes npm. [nvm installation guide](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
nvm install 24
nvm use 24
```

## Install and configure the project

From the project folder, check that the tools are available and install the locked dependencies.

```sh
node --version
npm --version
mysql --version
npm ci
```

If `.env` does not exist yet, copy `.env.example` from the project folder.

| Terminal | Command |
| --- | --- |
| Windows Command Prompt | `copy .env.example .env` |
| Windows PowerShell | `Copy-Item .env.example .env` |
| macOS or Linux terminal | `cp .env.example .env` |

Set `DB_PASSWORD` to the password you choose for the MySQL app account below. Generate a random value for `JWT_SECRET` and paste it into `.env`.

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

If your database password contains `#`, enclose the entire password in quotes in `.env`. Dotenv treats an unquoted `#` as the start of a comment. For example, with a fictional password, write `DB_PASSWORD="fictional#password"`.

Keep `.env` private. If MySQL uses a port other than `3306`, set `DB_PORT` to that port.

## Set up MySQL

With MySQL running, open the MySQL client as an administrator from the project folder.

| Platform | Command |
| --- | --- |
| Windows, or any install with a MySQL root password | `mysql --user=root --password` (enter the password at the prompt) |
| macOS with a fresh Homebrew install | `mysql --user=root` |
| Ubuntu with the default root setup | `sudo mysql` |

If you changed the MySQL port on Windows, add `--port` with that port number to the login command.

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
