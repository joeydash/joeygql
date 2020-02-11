const fetch = require('node-fetch');
const verifier = require('google-id-token-verifier');
const hash = require('object-hash');
const _ = require('lodash');


class Authenticator {

    constructor(GraphQLURL, GraphQLPassword) {
        this.GraphQLURL = GraphQLURL;
        this.GraphQLPassword = GraphQLPassword;
        this.GoogleAuthCheckURL = "https://oauth2.googleapis.com";
    }

    googleSignIn(id_token) {
        return new Promise(function (resolve, reject) {
            let url = new URL(this.GoogleAuthCheckURL),
                params = {"tokeninfo": id_token};
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            console.log(url);
            fetch(url).then(data => {
                resolve(data.json())
            }).catch(err => reject(err));
        });

    }

}

module.exports = Authenticator;
module.exports.default = module.exports;
