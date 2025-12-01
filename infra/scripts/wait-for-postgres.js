const { exec } = require("node:child_process");

function checkPostgres() {
  exec(
    "docker exec postgres-dev pg_isready --host localhost",
    (error, stdout) => {
      if (stdout.search("accepting connections") === -1) {
        process.stdout.write(".");
        checkPostgres();
        return;
      }

      console.log("\n🟢 Postgres is ready and waiting for connections!");
    },
  );
}

process.stdout.write("\n\n🔴 Waiting for Postgres to accept connections");

checkPostgres();
