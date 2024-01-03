export class UserLookupService {
    
    static parseUserInputString(userNameOrEmail: string) {
        const split = userNameOrEmail.split('@');
        // FIXME: find a better way
        const usernameIndex = userNameOrEmail.startsWith('@') ? 1 : 0;
        const domainIndex = userNameOrEmail.startsWith('@') ? 2 : 1;
        const username = split[usernameIndex];
        // FIXME: domain must NOT include port number
        const domain = split[domainIndex];
    
        // Ask domain about the user
        let strippedEmail = userNameOrEmail;
        if (userNameOrEmail.startsWith('@')) {
            strippedEmail = userNameOrEmail.slice(1);
        }
    
        return {
            split, username, domain, strippedEmail
        }
    }
}
