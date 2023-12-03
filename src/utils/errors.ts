export enum APIErrorCodes {
    ERR_ACCEPTED = "ERR_ACCEPTED",
    ERR_INVALID = "ERR_INVALID",
    ERR_TAKEN = "ERR_TAKEN",
    ERR_ACCOUNT = "ERR_ACCOUNT",
    ERR_PASSWORD = "ERR_PASSWORD"
}

export interface APIError {
    error: APIErrorCodes
    key: string,
    description: string,
}


const APIErrorList: APIError[] = [
    {
        error: APIErrorCodes.ERR_ACCEPTED,
        key: 'agreement',
        description: 'Agreement needs to be accepted to continue.',
    },
    {
        error: APIErrorCodes.ERR_INVALID,
        key: 'invalid',
        description: 'Invalid data was provided.'
    },
    {
        error: APIErrorCodes.ERR_TAKEN,
        key: 'alreadyExists',
        description: 'This email account is already in use.'
    },
    {
        error: APIErrorCodes.ERR_ACCOUNT,
        key: 'invalidAccount',
        description: 'This account does not exist.',
        
    },
    {
        error: APIErrorCodes.ERR_PASSWORD,
        key: 'password',
        description: 'Invalid password'
    }
]

export function generateErrorResponse(errorCode: APIErrorCodes): APIError {

    return APIErrorList.find(e => e.error == errorCode);
}