import { Response } from "express";
import { ActivityStreamTypes, FollowActivityModel } from "../models/activity.model";
import { User } from "../entity/User";
import { generateEmailAndUsernameFromId, verifyUserIsLocal } from "../utils/user";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { ServerInfo } from "../models/server-info.model";

export class ActivityController {

	/**
	 * This function determines whether the given `object` is ActivityStreams object or
	 * a generic activity+ld/json object
	 */
	static determineActivityType(type: ActivityStreamTypes) {
		if (Object.values(ActivityStreamTypes).includes(type)) {
			return 'AS'
		}

		return 'AP'
	}

	static handleActivityStreamEvent(activity, res: Response) {
		const { type } = activity;
		switch (type) {

			case "Create":
				return this.handleCreateEvent(activity, res);

			case "Follow":
				return this.handleFollowEvent(activity, res);

			default:
				console.log('sending 400 response');
				res.sendStatus(400);
		}
	}

	private static async handleCreateEvent(activity: {object: {type: string, content: string }, type: string}, res: Response) {

		const activityObject = activity.object;
		// Create object inside Activity
		const { type: objectType } = activityObject;

		// Image, comment are the only supported events
		if (!['Image', 'Note'].includes(objectType)) {
			res.sendStatus(400);
			return;
		}

		// user comment
		if (activityObject.type == 'Note') {
			res.status(422).send({ error: 'Under construction' });
			return;
		}

		// FIXME: This might be incorrect.
		res.sendStatus(400);
	}

	private static async handleFollowEvent(activity: FollowActivityModel, res: Response) {		
		const { actor, object } = activity;

		if (activity.to !== object.id) {
			res.sendStatus(400);
		}

		const serverInfo: ServerInfo = res.req.app.get('serverInfo');

		const actorData = generateEmailAndUsernameFromId(actor.id);
		const objectData = generateEmailAndUsernameFromId(object.id);
		
		const actorEmail = actorData.email;
		const isActorLocal = await verifyUserIsLocal(serverInfo, actorEmail);
		const objectEmail = objectData.email;
		const isObjectLocal = await verifyUserIsLocal(serverInfo, objectEmail);

		if (!isActorLocal) {
			res.status(400).json({error: "User don't belong to this domain."});
			return;
		}

		// The idea is to add `destActor` in srcActor's followers list. 
		let srcActor: User = null;
		let destArctor = null;

		if (isActorLocal) {
			srcActor = await UserService.getUserByKey('email', actorEmail);
			if (isObjectLocal) {
				destArctor = await UserService.getUserByKey('email', objectEmail);
			} else {
				// need to create user acc for destActor.
				destArctor = await AuthService.registerUserAPI(serverInfo, {
					agreement: 'TRUE',
					email: objectEmail,
					locale: 'en',
					// FIXME: need to generate secure password
					password: 'changeme',
					username: objectData.username,
					isLocal: false
				});
			}
		}

		// Add follower & save to db
		await UserService.addFollower(srcActor, destArctor);

		// FIXME: we always reply with "Accept"
		// Send "Accept" message
		const acceptMessage = {
			"@context" : "https://www.w3.org/ns/activitystreams",
			"id"       : srcActor.id,
			"type"     : "Accept",
			"actor"    : srcActor.id,
			"object"   : {
				"@context" : "https://www.w3.org/ns/activitystreams",
				"id"       :  srcActor.id,
				"type"     :  ActivityStreamTypes.FOLLOW,
				"actor"    :  destArctor,
				"object"   : srcActor.id,
			}
		};

		res.json(acceptMessage);
	}
}