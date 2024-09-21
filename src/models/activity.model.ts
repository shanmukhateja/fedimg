export enum ActivityStreamTypes {
    CREATE = 'Create',
    FOLLOW = 'Follow',
	ACCEPT = 'Accept',
    UNDO = 'Undo'
}

export interface CreateActivityModel {
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": ActivityStreamTypes.CREATE,
    "actor": any,
    "object": any
}

export interface FollowActivityModel {
	"@context": "https://www.w3.org/ns/activitystreams",
	"type": ActivityStreamTypes.FOLLOW,
    id?: string,
	"actor": string,
	"object": string,
}

export interface AcceptActivityModel {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: 'https://social.linux.pizza/users/shanmukhateja#accepts/follows/395330',
    type: ActivityStreamTypes.ACCEPT,
    actor: string,
    object: FollowActivityModel
  }
  

export enum FollowActivityTypes {

    // A user from our domain wants to follow user from our domain
    LOCAL_TO_LOCAL,

    // A user from our domain wants to follow foreign user 
    LOCAL_TO_FOREIGN,

    // A foreign user wants to follow a user from our instance
    FOREIGN_TO_LOCAL,

    // A foreign user wants to follow another foreign user
    // Safe to assume the user is not from our domain.
    FOREIGN_TO_FOREIGN
}