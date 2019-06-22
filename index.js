const fetch = require('node-fetch');
const verifier = require('google-id-token-verifier');
const hash = require('object-hash');
const cloudinary = require('cloudinary');
const _ = require('underscore');


let mHasuraGraphqlUrl = mGoogleApiClientId = mHasuraAccessKey = mCloudinaryApiId = "";
let isDebug = false;

let joeygql = {
    setDebugMode: (bool) => {
        isDebug = bool
    },
    setHasuraGraphqlUrl: (hasuraGraphqlUrl, hasuraAccessKey) => {
        mHasuraGraphqlUrl = hasuraGraphqlUrl;
        mHasuraAccessKey = hasuraAccessKey;
    },
    setGoogleApiClientId: (googleApiClientId) => {
        mGoogleApiClientId = googleApiClientId
    },
    setCloudinaryApiId: (cloudinaryApiId) => {
        mCloudinaryApiId = cloudinaryApiId;
        cloudinary.config(cloudinaryApiId);
    },
    signInGoogle(idToken) {
        return new Promise(function (resolve, reject) {
            verifier.verify(idToken, mGoogleApiClientId, function (err, tokenInfo) {
                if (err) {
                    reject(err);
                    console.log(err);
                } else {
                    let query =
                        'mutation {\n' +
                        '  insert_user_auth(objects: {h_id: "' + tokenInfo.sub + '", auth_token: "' + hash(idToken) + '", email: "' + tokenInfo.email + '", username: "' + tokenInfo.name + '", dp: "' + tokenInfo.picture + '"}, on_conflict: {constraint: user_auth_h_id_key, update_columns: auth_token}) {\n' +
                        '    returning {\n' +
                        '      id\n' +
                        '      h_id\n' +
                        '      auth_token\n' +
                        '      email\n' +
                        '      username\n' +
                        '      carrier\n' +
                        '      dp\n' +
                        '    }\n' +
                        '    affected_rows\n' +
                        '  }\n' +
                        '}';
                    if (isDebug) console.log("query_string: ", query);
                    fetch(mHasuraGraphqlUrl, {
                        method: "POST",
                        headers: {
                            'x-Hasura-role': 'google',
                            'x-hasura-access-key': mHasuraAccessKey,
                            'x-hasura-user-h-id': tokenInfo.sub
                        },
                        body: JSON.stringify({query: query, variables: null})
                    })
                        .then(data => data.json())
                        .then(data => {
                            let roles_mapping_query =
                                'mutation {\n' +
                                '  insert_t_roles_users_mapping(objects: {role_id: 1, user_id: ' + data.data.insert_user_auth.returning[0].id + '}, on_conflict: {constraint: t_roles_users_mapping_un, update_columns: role_id}) {\n' +
                                '    affected_rows\n' +
                                '  }\n' +
                                '}\n';
                            if (isDebug) console.log("query_string: ", roles_mapping_query);
                            fetch(mHasuraGraphqlUrl, {
                                method: "POST",
                                headers: {
                                    'x-Hasura-role': 'admin',
                                    'x-hasura-access-key': mHasuraAccessKey,
                                    'x-hasura-user-h-id': tokenInfo.sub
                                },
                                body: JSON.stringify({query: roles_mapping_query, variables: null})
                            })
                                .then(second_data => second_data.json())
                                .then(second_data => {
                                    if (isDebug) console.log("result: ", JSON.stringify(second_data));
                                    resolve(data);
                                }).catch(err => reject(err));
                        }).catch(err => reject(err));
                }
            });

        });
    },
    checkRole: (role, authToken) => {
        return new Promise(function (resolve, reject) {
            if (isDebug) console.log("role: ", role);
            if (isDebug) console.log("auth_token: ", authToken);
            let query = '{\n' +
                '  user_auth(where: {auth_token: {_eq: "' + authToken + '"}, t_roles_users_mappings: {t_enum_role: {name: {_eq: "' + role + '"}}}}) {\n' +
                '    auth_token\n' +
                '  }\n' +
                '}';
            console.log(query);
            if (isDebug) console.log("query_string: ", query);
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'x-Hasura-role': 'admin',
                    'x-hasura-access-key': mHasuraAccessKey,
                    'x-hasura-user-auth-token': authToken
                },
                body: JSON.stringify({query: query, variables: null})
            }).then(data => data.json())
                .then(data => {
                    if (isDebug) console.log("result: ", JSON.stringify(data));
                    if (data.data.user_auth.length > 0) {
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
            if (isDebug) console.log("body: ", body);
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'x-Hasura-role': 'anonymous',
                    'x-hasura-access-key': mHasuraAccessKey,
                },
                body: JSON.stringify({query: body, variables: null})
            }).then(data => {
                if (isDebug) console.log("result: ", JSON.stringify(data));
                resolve(data.json());
            }).catch(err => reject(err));
        });

    },
    requestDBWithRole: (role, authToken, body) => {
        return new Promise(function (resolve, reject) {
            if (isDebug) console.log("role: ", role);
            if (isDebug) console.log("auth_token: ", authToken);
            if (isDebug) console.log("body: ", body);
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'x-Hasura-role': role,
                    'x-hasura-access-key': mHasuraAccessKey,
                    'x-hasura-user-auth-token': authToken
                },
                body: JSON.stringify({query: body, variables: null})
            }).then(data => {
                if (isDebug) console.log("result: ", JSON.stringify(data));
                resolve(data.json())
            }).catch(err => reject(err));
        });

    },
    checkifExist: (value, arr) => {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === value) {
                return true;
            }
        }
        return false;
    },
    uploadToCloudinary: (folderName, file) => {
        return new Promise(function (resolve, reject) {
            cloudinary.v2.uploader.upload(file,
                {folder: folderName},
                function (error, result) {
                    if (!error) {
                        if (isDebug) console.log("result: ", JSON.stringify(data));
                        resolve(result.json());
                    } else {
                        reject(error);
                    }
                });
        });
    },
    getObjectFromArray: (array) => {
        let object = {};
        _.each(array, (item) => {
            object[item.key] = item.value;
        });
        return object;
    },
    getSiteData: (host) => {
        return new Promise(function (resolve, reject) {
            if (isDebug) console.log("host: ", host);
            let mQuery = '{\n' +
                '  site_data {\n' +
                '    key\n' +
                '    value\n' +
                '  }\n' +
                '}\n';
            if (isDebug) console.log("body: ", mQuery);
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'x-Hasura-role': 'website',
                    'x-hasura-access-key': mHasuraAccessKey,
                    'X-Hasura-Website-host': '%' + host + '%'
                },
                body: JSON.stringify({query: mQuery, variables: null})
            })
                .then(data => data.json())
                .then(data => {
                    if (isDebug) console.log("result: ", JSON.stringify(data));
                    resolve(joeygql.getObjectFromArray(data.data.site_data));
                }).catch(err => reject(err));
        });
    }
};
module.exports = joeygql;