export interface MastodonUserLookup {
    subject: string;
    aliases: string[];
    links:   MastodonUserLookupLink[];
}

export interface MastodonUserLookupLink {
    rel:       string;
    type?:     string;
    href?:     string;
    template?: string;
}
