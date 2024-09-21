import { Response } from "express";

export class CreateActivityController {

	static async handleCreateEvent(activity: { object: { type: string, content: string }, type: string }, res: Response) {

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
}