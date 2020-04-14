--
CREATE DATABASE jaorm;
CREATE USER jaorm_test WITH PASSWORD 'jaorm_test';
GRANT ALL PRIVILEGES ON DATABASE jaorm_test to jaorm;
ALTER DATABASE jaorm OWNER TO jaorm_test;