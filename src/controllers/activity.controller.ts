import { Response } from "express";
import { ActivityStreamTypes } from "../models/activity.model";
import { FollowActivityController } from "./activitypub/follow.controller";
import { AcceptActivityController } from "./activitypub/accept.controller";
import { CreateActivityController } from "./activitypub/create.controller";

export class ActivityController {

	/**
	 * This function determines whether the given `object` is ActivityStreams object or
	 * a generic activity+ld/json object
	 * 
	 * FIXME: Investigate and delete this if not needed.
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
				return CreateActivityController.handleCreateEvent(activity, res);

			case "Follow":
				return FollowActivityController.handleFollowEvent(activity, res);

			case "Undo":
				console.log('BLINDLY SENDING OK RESPONSE FOR UNDO REQUESTS.');
				res.sendStatus(200);
				break;

			case "Accept":
				return AcceptActivityController.handleAcceptEvent(activity, res);

			default:
				console.log(`Unsupported activity '${activity.type}'`);
				res.sendStatus(422);
		}
	}

}