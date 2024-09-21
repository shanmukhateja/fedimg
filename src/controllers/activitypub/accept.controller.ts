import { Response } from "express";
import { User } from "../../entity/User";
import { AcceptActivityModel, ActivityStreamTypes } from "../../models/activity.model";
import { ServerInfo } from "../../models/server-info.model";
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/user.service";
import { generateEmailAndUsernameFromId, verifyUserIsLocal } from "../../utils/user";

export class AcceptActivityController {

	static async handleAcceptEvent(activity: AcceptActivityModel, res: Response) {

		// The idea is to add `destActor` in srcActor's followers list. 
		let srcActor: User = null;
		let destArctor: User = null;

		const serverInfo: ServerInfo = res.req.app.get('serverInfo');

		const {object: {type, actor, object} } = activity;

		if (type == ActivityStreamTypes.FOLLOW) {

			const actorData = generateEmailAndUsernameFromId(actor);
			const objectData = generateEmailAndUsernameFromId(object);

			// Cannot have 2 accounts one for email with '@' and one w/o '@'
			if (objectData.email.startsWith('@')) {
				objectData.email = objectData.email.substring(1);
				objectData.username = objectData.username.substring(1);
			}

			const actorEmail = actorData.email;
			const objectEmail = objectData.email;
			const isActorLocal = await verifyUserIsLocal(actorEmail);
			const isObjectLocal = await verifyUserIsLocal(objectEmail);

			console.log('OBJECT EMAIL -> '+objectEmail);
			console.log('ACTOR EMAIL  -> '+actorEmail);

			console.log('locate local account for actor email -> ', actorEmail);
			srcActor = await UserService.getUserByKey('email', actorEmail);
			if (isObjectLocal) {
				console.log('trying to locate remote account for email '+objectEmail + 'from our db');
				destArctor = await UserService.getUserByKey('email', objectEmail);
			} else {
				// It seems objectEmail is a foreign user BUT we might have a `xxx-remote` account
				// created previously. 
				// Let's check the db first before creating account.

				destArctor = await UserService.getRemoteUserByKey('email', objectEmail);

				console.log('found destActor remote account', destArctor);

				if (!destArctor) {
					// need to create user acc for destActor.
					console.log('remote account not found, creating one..');
					destArctor = await AuthService.registerUserAPI(serverInfo, {
						agreement: 'TRUE',
						email: objectEmail,
						locale: 'en',
						// FIXME: need to generate secure password
						password: 'changeme',
						// this way we don't interfere with local accounts
						username: objectData.username + '-remote',
						isLocal: false
					});
				}

			}

			const isAlreadyFollowing = await UserService.checkUserIsFollower(destArctor.id, srcActor.id);

			if (isAlreadyFollowing) {
				res.sendStatus(204);
				return;
			}

			// Append user to followers collection
			await UserService.appendToFollowingCollection(srcActor, destArctor);
		} else {
			// Unknown Accept request received.
			console.log(`BLINDLY SENDIN 200 RESPONSE FOR UNKNOWN ACCEPT REQUEST TYPE: '${type}'`);
			res.send(200);
		}

	}

}