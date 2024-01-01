export function isProduction() {
    return process.env.NODE_ENV == 'production'
}

export function isTesting() {
    return process.env.NODE_ENV == 'testing'
}