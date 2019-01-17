const fetch = require('node-fetch');
const verifier = require('google-id-token-verifier');
const hash = require('object-hash');
let mHasuraGraphqlUrl = "";
let mGoogleApiClientId = "";
let mHasuraAccessKey = "";

let joeyHasuraHelper = {
    setHasuraGraphqlUrl: (hasuraGraphqlUrl) => {
        mHasuraGraphqlUrl = hasuraGraphqlUrl
    },
    setGoogleApiClientId: (googleApiClientId) => {
        mGoogleApiClientId = googleApiClientId
    },
    setHasuraAccessKey: (hasuraAccessKey) => {
        mHasuraAccessKey = hasuraAccessKey
    },
    signInGoogle(idToken) {
        return new Promise(function (resolve, reject) {
            verifier.verify(idToken, mGoogleApiClientId, function (err, tokenInfo) {
                if (err) {
                    reject(err);
                    console.log(err);
                } else {
                    let query = 'mutation {\n' +
                        '  insert_joey_user(objects: [{h_id: "' + tokenInfo.sub + '", auth_token: "' + hash(idToken) + '"}], on_conflict: {constraint: joey_user_h_id_key, update_columns: [auth_token]}) {\n' +
                        '    affected_rows\n' +
                        '    returning {\n' +
                        '      h_id\n' +
                        '      auth_token\n' +
                        '      id\n' +
                        '      role\n' +
                        '    }\n' +
                        '  }\n' +
                        '}';
                    fetch(mHasuraGraphqlUrl, {
                        method: "POST",
                        headers: {
                            'x-Hasura-role': 'google',
                            'x-hasura-access-key': mHasuraAccessKey,
                            'x-hasura-user-h-id': tokenInfo.sub
                        },
                        body: JSON.stringify({query: query, variables: null})
                    }).then(data => resolve(data.json())).catch(err => reject(err));
                }
            });

        });
    },
    checkRole: (role, authToken) => {
        return new Promise(function (resolve, reject) {

            let query = '{\n' +
                '  joey_user(where: {role: {_eq: "' + role + '"}, auth_token: {_eq: "' + authToken + '"}}) {\n' +
                '    auth_token\n' +
                '  }\n' +
                '}';
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'x-Hasura-role': 'user',
                    'x-hasura-access-key': mHasuraAccessKey,
                    'x-hasura-user-auth-token': authToken
                },
                body: JSON.stringify({query: query, variables: null})
            }).then(data => data.json())
                .then(data => {
                    if (data.data.joey_user.length > 0) {
                        resolve(data);
                    } else {
                        reject({error: "no user found"});
                    }
                })
                .catch(err => reject(err));
        });
    },
    requestDBAnonymous: (body) => {
        return new Promise(function (resolve, reject) {
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'x-Hasura-role': 'anonymous',
                    'x-hasura-access-key': mHasuraAccessKey,
                },
                body: JSON.stringify({query: body, variables: null})
            }).then(data => resolve(data.json())).catch(err => reject(err));
        });

    },
    requestDBWithRole: (role, authToken, body) => {
        return new Promise(function (resolve, reject) {
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'x-Hasura-role': role,
                    'x-hasura-access-key': mHasuraAccessKey,
                    'x-hasura-user-auth-token': authToken

                },
                body: JSON.stringify({query: body, variables: null})
            }).then(data => resolve(data.json())).catch(err => reject(err));
        });

    }
};
module.exports = joeyHasuraHelper;