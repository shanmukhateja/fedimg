export enum ActivityStreamTypes {
    CREATE = 'Create',
    FOLLOW = 'Follow'
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
	"actor": {
	  "type": "Person",
	  "id": string,
	  "name": string
	},
	"object": {
	  "type": "Person",
	  "id": string,
	  "name": string
	},
	// matches `object.id`
	"to": string
  }
  