import { ServerResponse } from '../../lib/server-response';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../models/user';
import { getUser } from '../../dynamo/users';
import { makeGatewayHandler } from '../../lib/make-handler';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { expectBody } from '../../lib/handler-validators/expect-body';
import { validateBody } from '../../lib/handler-validators/validate-body';
import v8n from 'v8n';
import { expectHTTPMethod } from '../../lib/handler-validators/expect-http-methods';

export const login = makeGatewayHandler()
	.use(expectEnv('JWT_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectHTTPMethod('POST'))
	.use(expectBody())
	.use(
		validateBody<{ email: string; password: string }>(
			v8n().schema({
				email: v8n().string().not.empty(),
				password: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;

		let user: User | null;
		try {
			user = await getUser(body.email, middlewareData.DYNAMODB_USERS_TABLE);
		} catch (e) {
			console.error(e);
			return ServerResponse.internalError();
		}

		if (!user) {
			return ServerResponse.error(403, 'Usuário ou senha incorretos');
		}

		if (!bcrypt.compareSync(body.password, user.password)) {
			return ServerResponse.error(403, 'Usuário ou senha incorretos');
		}

		const token = jwt.sign({ email: body.email }, middlewareData.JWT_SECRET, { expiresIn: '7d' });

		const response = ServerResponse.success(
			{ token, user: { ...user, password: null } },
			'Login bem sucedido',
		);

		response.headers['Authorization'] = token;

		return response;
	});
