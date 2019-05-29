# joeygql

[![npm version](https://badge.fury.io/js/joeygql.svg)](https://badge.fury.io/js/joeygql)
##### This is used as a additional supportive library above hasura-graphql-engine (open-source)

* [Deploy hasura server](https://docs.hasura.io/1.0/graphql/manual/index.html)

* Install 
```bash 
npm -i joeyql
```

* Import module
```node
const joeygql = require('joeygql');
```

* Set hasura graphql url
```node
joeygql.setHasuraGraphqlUrl("<HASURA_GRAPHQL_URL>","<HASURA_GRAPHQL_ACCESS_KEY>");
```

* Set hasura graphql url
```node
joeygql.setHasuraGraphqlUrl("<HASURA_GRAPHQL_URL>","<HASURA_GRAPHQL_ACCESS_KEY>");
joeygql.setGoogleApiClientId("<GOGGLE_CLIENT_ID>");
joeygql.setCloudinaryUrl("<CLOUDINARY_API_ID>")
```

* If you are using express then this is how you use sign in
```node
router.post('/sign_in', function (req, res, next) {
    joeygql.signInGoogle(req.body.id_token).then(data => res.json(data)).catch(e => res.json(e));
});
```