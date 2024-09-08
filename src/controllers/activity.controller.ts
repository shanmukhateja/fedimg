import { Response } from "express";
import { ActivityStreamTypes, FollowActivityModel } from "../models/activity.model";
import { User } from "../entity/User";
import { generateEmailAndUsernameFromId, verifyUserIsLocal } from "../utils/user";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { ServerInfo } from "../models/server-info.model";
import { generateASId, getBaseURL, sendRequest } from "../utils/url.js";
import { HttpSignature } from "../models/http-signature.model";
import { AxiosError } from "axios";

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

			case "Undo":
				console.log('BLINDLY SENDING OK RESPONSE FOR UNDO REQUESTS.');
				res.sendStatus(200);
				break;

			default:
				console.log(`Unsupported activity '${activity.type}'`);
				res.sendStatus(422);
		}
	}

	private static async handleCreateEvent(activity: { object: { type: string, content: string }, type: string }, res: Response) {

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

		const serverInfo: ServerInfo = res.req.app.get('serverInfo');

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

		if (!isActorLocal && !isObjectLocal) {
			// A user from a foreign domain is following a user from another foreign domain.
			// FIXME: Why does this matter to us?
			res.status(400).json({ error: 'Unexpected request.' });
			return;
		}

		if (!isActorLocal) {
			// This means we are being informed by `object`'s server that a user
			// belonging to our domain was followed by them.
			// Need to save that user's info into `object.followers` collection.

			// failsafe
			if (!isObjectLocal) {
				res.status(400).send({ error: 'object user doesn\'t belong to our domain.' });
				return;
			}

			const objectUser = await UserService.getUserByKey('email', objectEmail);

			// Check if this user has an account with us already.
			let nonLocalAccountForActor = await UserService.getUserByKey('recovery_email', actorEmail);
			if (!nonLocalAccountForActor) {
				// Create a non-local user to save the user info.
				nonLocalAccountForActor = await AuthService.registerUserAPI(serverInfo, {
					agreement: 'TRUE',
					email: actorEmail,
					locale: 'en',
					// FIXME: need to generate secure password
					password: 'changeme',
					// this way we don't interfere with local accounts
					username: objectData.username + '-remote',
					isLocal: false
				});
			}

			const isAlreadyFollowing = await UserService.checkUserIsFollowingMe(objectUser.id, nonLocalAccountForActor.id);

			if (isAlreadyFollowing) {
				console.log(`User '${nonLocalAccountForActor.email}' is already following '${objectUser.email}', returning 204`);
				res.sendStatus(204);
				return;
			}

			// Update db
			await UserService.appendToFollowersCollection(objectUser, nonLocalAccountForActor);
		} else {
			// A user from our domain has followed a user from some other domain.
			// FIXME: Need to check and handle cases when users from same domain 
			// use Follow feature.

			// The idea is to add `destActor` in srcActor's followers list. 
			let srcActor: User = null;
			let destArctor: User = null;

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

			const isAlreadyFollowing = UserService.checkUserIsFollowingMe(srcActor.id, destArctor.id);

			if (isAlreadyFollowing) {
				res.sendStatus(204);
				return;
			}

			// Append user to followers collection
			await UserService.appendToFollowingCollection(srcActor, destArctor);
		}

		// 1. Send "Accept" message as another request
		// and return 204 No Content as response for this one.
		
		// FIXME: do we need to save this id in db?
		const followRequestAcceptedId = generateASId();
		const httpSignature = new HttpSignature(null);

		// 1.a create "Accept" response
		const data = {
			"@context": "https://www.w3.org/ns/activitystreams",
			"id": `${getBaseURL(serverInfo)}${followRequestAcceptedId}`,
			"type": ActivityStreamTypes.ACCEPT,
			"actor": activity.object,
			// In order for Mastodon to allow us as a follower, we can either send 2 things:
			// 1. original object in JSON object format (not JSON string)
			// 2. follow request `id` which Mastodon sent us (can be found in `activity` parameter)
			"object": JSON.parse(res.req['rawBody'])
		};

		// 1.b generate signature, digest headers
		const url = ''.concat(isActorLocal ? object : actor, '/inbox');
		const genSigHeaders = await httpSignature.generate({
			inboxUrl: url,
			serverInfo,
			senderId: isActorLocal ? actor : object,
			recipientId: isActorLocal ? object: actor,
			data
		});

		// 1.c send the signed payload to receipient.
		await sendRequest(url, 'POST', genSigHeaders, data)
		.then(response => {
			console.log('GOT RESPONSE FOR FOLLOW ACCEPT REQUEST.', response.headers);
			console.log('GOT RESPONSE FOR FOLLOW ACCEPT REQUEST.', response.status);
			console.log('GOT RESPONSE FOR FOLLOW ACCEPT REQUEST.', response.statusText);
		})
		.catch((error: AxiosError) => {
			delete error.response?.request;
			console.log('GOT ERROR FOR FOLLOW ACCEPT');
			console.error('error code: ', error.code)
			console.error('request headers: ', error.request?._header)
			console.error('generated headers: ', genSigHeaders)
			console.error('response data: ', error.response.data)
		});

		// 2
		res.sendStatus(204);
	}
}