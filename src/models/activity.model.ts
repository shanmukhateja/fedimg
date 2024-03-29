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
	"actor": string,
	"object": string,
  }
  