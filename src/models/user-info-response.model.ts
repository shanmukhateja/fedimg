export interface UserInfoResponseModel {
    // FIXME: Need to improve types once we have
    // better understanding of what `@context` does.
    "@context":                Array<any>;
    id:                        string;
    type:                      string;
    following:                 string;
    followers:                 string;
    inbox:                     string;
    outbox:                    string;
    featured:                  string;
    featuredTags:              string;
    preferredUsername:         string;
    name:                      string;
    summary:                   string;
    url:                       string;
    manuallyApprovesFollowers: boolean;
    discoverable:              boolean;
    indexable:                 boolean;
    published:                 Date;
    memorial:                  boolean;
    devices:                   string;
    publicKey:                 PublicKey;
    tag:                       Tag[];
    attachment:                Attachment[];
    endpoints:                 Endpoints;
    icon:                      Icon;
}

export interface AlsoKnownAs {
    "@id":   string;
    "@type": string;
}

export interface FocalPoint {
    "@container": string;
    "@id":        string;
}

export interface Attachment {
    type:  string;
    name:  string;
    value: string;
}

export interface Endpoints {
    sharedInbox: string;
}

export interface Icon {
    type:      string;
    mediaType: string;
    url:       string;
}

export interface PublicKey {
    id:           string;
    owner:        string;
    publicKeyPem: string;
}

export interface Tag {
    type: string;
    href: string;
    name: string;
}
