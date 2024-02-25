export interface RegisterUserApiPayload {
    username: string;
    email: string;
    password: string;
    agreement: 'TRUE';
    locale: string;
    isLocal?: boolean
}