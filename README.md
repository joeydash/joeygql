# jsonwebtoken

| **Version** | **Build** | **Dependency** |
|-----------|-----------|---------------|
| [![npm version](https://badge.fury.io/js/joeygql.svg)](https://badge.fury.io/js/joeygql) | [![Build Status](https://secure.travis-ci.org/auth0/node-jsonwebtoken.svg?branch=master)](http://travis-ci.org/auth0/node-jsonwebtoken) | [![Dependency Status](https://david-dm.org/joeydash/joeygql.svg)](https://david-dm.org/auth0/node-jsonwebtoken) |

##### This is used as a additional supportive library above hasura-graphql-engine (open-source)

* [Deploy hasura server](https://docs.hasura.io/1.0/graphql/manual/index.html)

* Then make a table (postgres)
 ```postgresql
CREATE TABLE public.user_auth (
	id serial NOT NULL,
	h_id text NOT NULL,
	auth_token text NOT NULL,
	"role" text NOT NULL DEFAULT 'user'::text,
	CONSTRAINT user_auth_auth_token_key UNIQUE (auth_token),
	CONSTRAINT user_auth_h_id_key UNIQUE (h_id),
	CONSTRAINT user_auth_id_key UNIQUE (id),
	CONSTRAINT user_auth_pkey PRIMARY KEY (id, h_id)
);

```

* metadata.json (hasura)
```json
{"functions":[],"remote_schemas":[],"query_collections":[],"allowlist":[],"tables":[{"table":"user_auth","object_relationships":[],"array_relationships":[],"insert_permissions":[{"role":"google","comment":null,"permission":{"set":{},"check":{},"columns":["auth_token","h_id","role"]}}],"select_permissions":[{"role":"google","comment":null,"permission":{"allow_aggregations":false,"columns":["auth_token","h_id","id","role"],"filter":{"h_id":{"_eq":"X-HASURA-USER-H-ID"}}}}],"update_permissions":[{"role":"google","comment":null,"permission":{"set":{},"columns":["auth_token","role"],"filter":{"h_id":{"_eq":"X-HASURA-USER-H-ID"}}}}],"delete_permissions":[],"event_triggers":[]}],"query_templates":[]}
```
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