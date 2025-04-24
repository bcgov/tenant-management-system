Tenant Management System API

There are two ways to run this API locally.

1. Use docker-compose (ensure docker-compose is installed and available) - refer to the end of the file for docker-compose debugging steps

    Update docker-compose.yaml to point to the correct SSO api credentials    

    cd <CLONE_FOLDER>/api/tms
   
    docker-compose up --build

    Verify that API and databases are up:
   
      1. API: http://localhost:4144/v1/health
      2. Database: connect via pgadmin to port 5454


3. Use without docker - call the run script directly  

    Start a postgres container - command with sample credentials below.

    docker run -d --name tms-postgres -p 5432:5432 -e POSTGRES_USER=tms -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=tmsdb postgres

    Copy env.sample to env and update the .env to the correct database parameters as above
    Update .env to include the correct SSO api credentials
    
    cd <CLONE_FOLDER>/api/tms

    npm install

    Run pre-requisite database migrations via cmd: (install npx if not available)

    npx typeorm-ts-node-commonjs migration:run -d ./src/common/db.connection.ts

    Verify tables are created and available

    npm run dev

    Verify API is up via: http://localhost:4144/v1/health

4. DEBUGGING STEPS - docker-compose:

    To clear the existing docker-compose images and configurations, run the following commands in sequence:

    1. docker compose down --volumes --remove-orphans
    2. docker compose down --rmi all
    3. docker volume prune -f

    4. docker compose up --build

5. Generate migration after entity changes:

    1. npx typeorm-ts-node-commonjs migration:generate -d ./src/common/db.connection.ts ./src/migrations/<name>