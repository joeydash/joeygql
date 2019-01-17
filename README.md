# joeygql

#### This is used as a additional supportive library above hasura-graphql-engine (open-source)

* First install docker compose

* Then make a docker-compose file like this 

```yml 
version: '3.6'
 services:
   postgres:
     image: postgres
     restart: always
     volumes:
       - db_data:/var/lib/postgresql/data
   graphql-engine:
     image: hasura/graphql-engine:v1.0.0-alpha34
     ports:
       - 8080:8080
     depends_on:
       - postgres
     restart: always
     environment:
       HASURA_GRAPHQL_DATABASE_URL: postgres://postgres:@postgres:5432/postgres
       HASURA_GRAPHQL_ENABLE_CONSOLE: 'true'
       HASURA_GRAPHQL_ACCESS_KEY: joeydash
     command:
       - graphql-engine
       - serve
       - --enable-console
   main:
     build: ./main
     restart: always
     ports:
       - 3100:3000
     depends_on:
       - graphql-engine
     environment:
       GRAPHQL_ENGINE_DATABASE_HOST: graphql-engine
       HASURA_GRAPHQL_ACCESS_KEY: joeydash
     links:
       - graphql-engine
 volumes:
   db_data:
```

* Install 
```bash 
npm -i joeyql
```

* Import module

```node
const joeygql = require('joeygql');
```


