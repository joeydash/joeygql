const Authenticator = require( "./authenticator");

class Joeygql {

    constructor(GraphQLURL, GraphQLPassword) {
        this.GraphQLURL = GraphQLURL;
        this.GraphQLPassword = GraphQLPassword;
        this.authenticator = new Authenticator(GraphQLURL, GraphQLPassword)

    }

    googleSignIn(idtoken){
        return this.authenticator.googleSignIn(idtoken);
    }

}

module.exports = Joeygql;
module.exports.default = module.exports;
