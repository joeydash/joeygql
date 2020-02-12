const fetch = require('node-fetch');
const verifier = require('google-id-token-verifier');
const hash = require('object-hash');
const cloudinary = require('cloudinary');
const _ = require('lodash');


let mHasuraGraphqlUrl = "";
let mGoogleApiClientId = "";
let mHasuraAccessKey = "";
let mCloudinaryApiId = "";
let mQueryUrl = "";
let isDebug = false;

let joeygql = {
    setDebugMode: (bool) => {
        isDebug = bool
    },
    setHasuraGraphqlUrl: (hasuraGraphqlUrl, hasuraAccessKey) => {
        mHasuraGraphqlUrl = hasuraGraphqlUrl;
        mHasuraAccessKey = hasuraAccessKey;
    },
    setQueryUrl: (query_url) => {
        mQueryUrl = query_url;
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
                    let _query = 'query MyQuery {\n' +
                        '  __typename\n' +
                        '  user_auth_aggregate {\n' +
                        '    aggregate {\n' +
                        '      count(distinct: true, columns: id)\n' +
                        '    }\n' +
                        '  }\n' +
                        '}';

                    fetch(mHasuraGraphqlUrl, {
                        method: "POST",
                        headers: {
                            'X-Hasura-Role': 'google',
                            'X-Hasura-Access-Key': mHasuraAccessKey,
                            'X-Hasura-User-H-Id': tokenInfo.sub
                        },
                        body: JSON.stringify({query: _query, variables: null})
                    })
                        .then(_data => {
                            return _data.json()
                        })
                        .then(_data => {
                            if (isDebug) console.log(JSON.stringify(_data));
                            if (_data.data.user_auth_aggregate.aggregate.count > 0) {
                                let __query = 'mutation MyMutation {\n' +
                                    '  __typename\n' +
                                    '  update_user_auth(_set: {auth_token: "' + hash(idToken) + '"}, where: {h_id: {_eq: "' + tokenInfo.sub + '"}}) {\n' +
                                    '    returning {\n' +
                                    '      h_id\n' +
                                    '      id\n' +
                                    '      carrier\n' +
                                    '      auth_token\n' +
                                    '      dp\n' +
                                    '      email\n' +
                                    '      username\n' +
                                    '    }\n' +
                                    '  }\n' +
                                    '}';

                                fetch(mHasuraGraphqlUrl, {
                                    method: "POST",
                                    headers: {
                                        'X-Hasura-Role': 'google',
                                        'X-Hasura-Access-Key': mHasuraAccessKey,
                                        'X-Hasura-User-H-Id': tokenInfo.sub
                                    },
                                    body: JSON.stringify({query: __query, variables: null})
                                })
                                    .then(__data => {
                                        return __data.json()
                                    })
                                    .then(__data => {
                                        if (isDebug) console.log(JSON.stringify(__data));
                                        resolve(__data.data.update_user_auth.returning[0]);
                                    })
                                    .catch(err => reject(err));
                            } else {
                                let __query = 'mutation MyMutation {\n' +
                                    '  __typename\n' +
                                    '  insert_user_auth(objects: {h_id: "' + tokenInfo.sub + '", auth_token: "' + hash(idToken) + '", email: "' + tokenInfo.email + '", username: "' + tokenInfo.name + '", dp: "' + tokenInfo.picture + '", carrier: "google"}, on_conflict: {constraint: user_auth_h_id_key, update_columns: auth_token}) {\n' +
                                    '    returning {\n' +
                                    '      id\n' +
                                    '    }\n' +
                                    '    affected_rows' +
                                    '  }\n' +
                                    '}';
                                if (isDebug) console.log("query_string: ", __query);
                                fetch(mHasuraGraphqlUrl, {
                                    method: "POST",
                                    headers: {
                                        'X-Hasura-Role': 'google',
                                        'X-Hasura-Access-Key': mHasuraAccessKey,
                                        'X-Hasura-User-H-Id': tokenInfo.sub
                                    },
                                    body: JSON.stringify({query: __query, variables: null})
                                })
                                    .then(__data => {
                                        return __data.json()
                                    })
                                    .then(__data => {
                                        if (isDebug) console.log(JSON.stringify(__data));
                                        let ___query = 'mutation MyMutation {\n' +
                                            '  __typename\n' +
                                            '  insert_t_roles_users_mapping(objects: {role_id: 1, user_id: '+__data.data.insert_user_auth.returning[0].id+'}) {\n' +
                                            '    returning {\n' +
                                            '      user_auth {\n' +
                                            '        auth_token\n' +
                                            '        carrier\n' +
                                            '        dp\n' +
                                            '        email\n' +
                                            '        h_id\n' +
                                            '        id\n' +
                                            '        username\n' +
                                            '      }\n' +
                                            '    }\n' +
                                            '  }\n' +
                                            '}';
                                        if (isDebug) console.log("query_string: ", ___query);
                                        fetch(mHasuraGraphqlUrl, {
                                            method: "POST",
                                            headers: {
                                                'X-Hasura-Role': 'google',
                                                'X-Hasura-Access-Key': mHasuraAccessKey,
                                                'X-Hasura-User-H-Id': tokenInfo.sub
                                            },
                                            body: JSON.stringify({query: ___query, variables: null})
                                        })
                                            .then(___data => ___data.json())
                                            .then(___data => {
                                                if (isDebug) console.log(JSON.stringify(___data));
                                                resolve(___data.data.insert_t_roles_users_mapping.returning[0]);
                                            }).catch(err => reject(err));
                                    }).catch(err => reject(err));
                            }
                        })
                        .catch(err => reject(err));
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
            if (isDebug) console.log("query_string: ", query);
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'X-Hasura-Role': 'admin',
                    'X-Hasura-Access-Key': mHasuraAccessKey,
                    'X-Hasura-User-Auth-Token': authToken
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
                    'X-Hasura-Role': 'anonymous',
                    'X-Hasura-Access-Key': mHasuraAccessKey,
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
                    'X-Hasura-Role': role,
                    'X-Hasura-Access-Key': mHasuraAccessKey,
                    'X-Hasura-User-Auth-Token': authToken
                },
                body: JSON.stringify({query: body, variables: null})
            }).then(data => {
                if (isDebug) console.log("result: ", JSON.stringify(data));
                resolve(data.json())
            }).catch(err => reject(err));
        });

    },
    queryWithRole: (role, authToken, body) => {
        return new Promise(function (resolve, reject) {
            if (isDebug) console.log("role: ", role);
            if (isDebug) console.log("auth_token: ", authToken);
            if (isDebug) console.log("body: ", JSON.stringify(body));
            fetch(mQueryUrl, {
                method: "POST",
                headers: {
                    'X-Hasura-Role': role,
                    'X-Hasura-Access-Key': mHasuraAccessKey,
                    'X-Hasura-User-Auth-Token': authToken
                },
                body: JSON.stringify(body)
            }).then(data => {
                if (isDebug) console.log("result: ", JSON.stringify(data));
                resolve(data.json());
            }).catch(err => reject(err));
        });

    },
    queryWithRoleAndSiteHostName: (role, authToken, hostName, body) => {
        return new Promise(function (resolve, reject) {
            if (isDebug) {
                console.log("role: ", role);
                console.log("auth_token: ", authToken);
                console.log("host_name: ", hostName);
                console.log("body: ", JSON.stringify(body))
            }
            fetch(mQueryUrl, {
                method: "POST",
                headers: {
                    'X-Hasura-Role': role,
                    'X-Hasura-Access-Key': mHasuraAccessKey,
                    'X-Hasura-User-Auth-Token': authToken,
                    'X-Hasura-Site-Host-Name': '%' + hostName + '%'
                },
                body: JSON.stringify(body)
            }).then(data => {
                if (isDebug) console.log("result: ", JSON.stringify(data));
                resolve(data.json());
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
                        if (isDebug) console.log("result: ", JSON.stringify(result));
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
                '  t_site_data {\n' +
                '    key\n' +
                '    value\n' +
                '  }\n' +
                '}\n';
            if (isDebug) console.log("body: ", mQuery);
            fetch(mHasuraGraphqlUrl, {
                method: "POST",
                headers: {
                    'X-Hasura-Role': 'website',
                    'X-Hasura-Access-Key': mHasuraAccessKey,
                    'X-Hasura-Website-Host': '%' + host + '%'
                },
                body: JSON.stringify({query: mQuery, variables: null})
            })
                .then(data => data.json())
                .then(data => {
                    if (isDebug) console.log("result: ", JSON.stringify(data));
                    resolve(joeygql.getObjectFromArray(data.data.t_site_data));
                }).catch(err => reject(err));
        });
    }
};
module.exports = joeygql;
