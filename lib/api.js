const { GraphQLClient, gql } = require('graphql-request');

const ROOT_URL = [process.env.API_URL, 'graphql'].join('/');

let graphQLClient;

const createClient = () => {
    if (!graphQLClient) {
        graphQLClient = new GraphQLClient(ROOT_URL, {
            headers: {
                authorization: ["Bearer", process.env.API_SYSTEM_TOKEN].join(' ')
            }
        })
    }
    return graphQLClient;
}

const createClassonUser = async (firstName, lastName, email, password, phoneNumber, lmsUserId, package) => {
    const mutation = gql`
    mutation registerUser($firstName: String!, $lastName: String!, $email: String!,
        $password: String!, $phoneNumber: String!, $lmsUserId: Int!, $package: ServicePackage!) {
        registerUser(
            input: {
                firstName: $firstName,
                lastName: $lastName,
                email: $email,
                password: $password,
                phoneNumber: $phoneNumber,
                lmsUserId: $lmsUserId,
                package: $package
            }
        ) {
            user {
                id
            }
        }
    }`
    const variables = {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        lmsUserId,
        package: package.toUpperCase()
    }
    return await createClient().request(mutation, variables);
}

module.exports = {
    createClassonUser
}