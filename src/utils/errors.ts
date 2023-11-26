export enum APIErrorCodes {
    ERR_ACCEPTED = "ERR_ACCEPTED",
    ERR_INVALID = "ERR_INVALID",
    ERR_TAKEN = "ERR_TAKEN"
}

export interface APIErrorListItem {
    code: APIErrorCodes,
    key: string,
    description: string,
    value: APIErrorDetails
}


const APIErrorList: APIErrorListItem[] = [
    {
        code: APIErrorCodes.ERR_ACCEPTED,
        key: 'agreement',
        description: 'Agreement needs to be accepted to continue.',
        value: {
            error: APIErrorCodes.ERR_ACCEPTED,
            description: "Agreement not accepted."
        }
    },
    {
        code: APIErrorCodes.ERR_INVALID,
        key: 'invalid',
        description: 'Invalid data was provided.',
        value: {
            error: APIErrorCodes.ERR_INVALID,
            description: "must contain only letters, numbers and underscores."
        }
    },
    {
        code: APIErrorCodes.ERR_TAKEN,
        key: 'alreadyExists',
        description: 'This email account is already in use.',
        value: {
            error: APIErrorCodes.ERR_TAKEN,
            description: "This email account is already in use."
        }
    },
]
 
class APIError {
    error: string;
    details: {
        [x: string]: APIErrorDetails
    }[]
}

class APIErrorDetails {
    error: string;
    description: string
}

export function generateErrorResponse(code: APIErrorCodes): APIError {

    let base: APIError = {
        error: "",
        details: []
    }
    let response = { ...base };

    const apiErrorItem = APIErrorList.find(e => e.code == code);

    response.error += apiErrorItem.value.description;
    response.details.push({
        [apiErrorItem.key]: apiErrorItem.value
    })

    return response;
}