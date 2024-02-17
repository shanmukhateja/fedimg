import { Response } from "express";
import { ActivityStreamTypes, FollowActivityModel } from "../models/activity.model";
import { User } from "../entity/User";
import { generateUserEmailFromId, verifyUserIsLocal } from "../utils/user";
import { UserService } from "../services/user.service";

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
				this.handleCreateEvent(activity, res);
				break;

			case "Follow":
				this.handleFollowEvent(activity, res);
				break;

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

		const serverInfo = res.req.app.get('serverInfo');
		const actorEmail = generateUserEmailFromId(actor.id);
		// FIXME: assuming it's always "Accept"

		const isActorLocal = verifyUserIsLocal(serverInfo, actorEmail);
		const objectEmail = generateUserEmailFromId(object.id);
		const isObjectLocal = verifyUserIsLocal(serverInfo, objectEmail);

		if (!isActorLocal && !isObjectLocal) {
			res.status(400).json({error: "User don't belong to this domain."});
			return;
		}

		

		/*if (isActorLocal) {
			const actorAccount = await UserService.getUserByKey('email', actorEmail);
			if (!actorAccount) {
				res.sendStatus(404);
				return;
			}

			// Create "local user" for remote user
			const user = new User();
			user

			if (!actorAccount.followers) actorAccount.followers = [];
			actorAccount.followers?.push(user);
		}*/

		res.sendStatus(200);
	}
}