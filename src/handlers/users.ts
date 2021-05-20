import type { APIGatewayProxyHandler } from 'aws-lambda';
import { withBody } from '../lib/with-body';
import { ServerResponse } from '../lib/response';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/user';
import { withAuth } from '../lib/with-auth';
import { createUser, getUser, updateUserAbout } from '../dynamo/users';

export const signup: APIGatewayProxyHandler = withBody(async event => {
	const SIGNUP_SECRET = process.env['SIGNUP_SECRET'] as string;

	const body = event.body as unknown as { email: string; password: string; secret: string };
	if (!body.email) return ServerResponse.error(400, 'Email is required');
	if (!body.password) return ServerResponse.error(400, 'password is required');
	if (!body.secret) return ServerResponse.error(400, 'secret is required');
	if (body.secret !== SIGNUP_SECRET) return ServerResponse.error(400, 'secret dont match');

	const hashedPassword = bcrypt.hashSync(body.password, 10);
	try {
		await createUser(body.email, hashedPassword);
	} catch (e) {
		console.error(e);
		return ServerResponse.internalError();
	}

	return ServerResponse.success(undefined, 'User created successfuly');
});

export const login: APIGatewayProxyHandler = withBody(async event => {
	const JWT_SECRET = process.env['JWT_SECRET'] as string;

	const body = event.body as unknown as { email: string; password: string };
	if (!body.email) return ServerResponse.error(400, 'Email is required');
	if (!body.password) return ServerResponse.error(400, 'password is required');

	let user: User | null;
	try {
		user = await getUser(body.email);
	} catch (e) {
		console.error(e);
		return ServerResponse.internalError();
	}

	if (!user) {
		return ServerResponse.error(403, 'User not found');
	}

	if (!bcrypt.compareSync(body.password, user.password)) {
		return ServerResponse.error(403, 'Incorrect password');
	}

	if (!JWT_SECRET) {
		console.error(`Environment variable 'JWT_SECRET' not found. Check your .env file`);
		return ServerResponse.internalError();
	}

	const token = jwt.sign({ email: body.email }, JWT_SECRET, { expiresIn: '7d' });

	const response = ServerResponse.success(
		{ token, user: { ...user, password: null } },
		'Login successful',
	);
	response.headers['Authorization'] = token;
	return response;
});

export const update: APIGatewayProxyHandler = withAuth(
	false,
	withBody(async event => {
		const email = (event as any).tokenContent.email as string;
		const body = event.body as unknown as { about: any };
		if (!body.about) return ServerResponse.error(400, 'about is required');

		let updatedUser: User;
		try {
			updatedUser = await updateUserAbout(email, body.about);
		} catch (e) {
			console.error(e);
			return ServerResponse.internalError();
		}
		return ServerResponse.success({ ...updatedUser, password: null }, 'Update successful');
	}),
);
