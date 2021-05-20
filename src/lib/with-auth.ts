import type { APIGatewayProxyHandler } from 'aws-lambda';
import { ServerResponse } from './response';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { getUser } from '../dynamo/users';

export function withAuth(fetchUser: boolean, handler: APIGatewayProxyHandler) {
	return (async (event, ...args) => {
		const JWT_SECRET = process.env['JWT_SECRET'] as string;
		const token = (event.headers['authorization'] || event.headers['Authorization']) as string;
		if (!token) return ServerResponse.error(401, `Missing authorization header`);

		if (!JWT_SECRET) {
			console.error(`Environment variable 'JWT_SECRET' not found. Check your .env file`);
			return ServerResponse.internalError();
		}

		let email: string;
		try {
			const tokenContent = jwt.verify(token, JWT_SECRET) as any;
			(event as any).tokenContent = tokenContent;
			email = tokenContent.email;
		} catch (e) {
			return ServerResponse.error(401, `Invalid authorization token`);
		}

		if (fetchUser) {
			let user: User | null;
			try {
				user = await getUser(email);
			} catch (e) {
				console.error('Failed to fetch user on authorization verification', e);
				return ServerResponse.internalError();
			}

			if (!user) {
				return ServerResponse.error(401, 'User on authorization token not found');
			}

			(event as any).user = user;
		}

		return handler(event, ...args);
	}) as APIGatewayProxyHandler;
}
