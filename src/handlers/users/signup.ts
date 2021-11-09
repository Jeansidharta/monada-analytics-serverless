import { ServerResponse } from '../../lib/server-response';
import bcrypt from 'bcryptjs';
import { createUser } from '../../dynamo/users';
import { makeGatewayHandler } from '../../lib/make-handler';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { expectBody } from '../../lib/handler-validators/expect-body';
import { validateBody } from '../../lib/handler-validators/validate-body';
import v8n from 'v8n';
import { HTTPStatusCode } from '../../lib/server-response/status-codes';

export const signup = makeGatewayHandler()
	.use(expectEnv('SIGNUP_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ email: string; password: string; secret: string }>(
			v8n().schema({
				email: v8n().string().not.empty(),
				password: v8n().string().not.empty(),
				secret: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;

		if (body.secret !== middlewareData.SIGNUP_SECRET) {
			return ServerResponse.error(HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST, 'Invalid Secret');
		}

		const hashedPassword = bcrypt.hashSync(body.password, 10);
		try {
			await createUser(body.email, hashedPassword, middlewareData.DYNAMODB_USERS_TABLE);
		} catch (e) {
			console.error(e);
			return ServerResponse.internalError();
		}

		return ServerResponse.success(undefined, 'Usuário criado com sucesso');
	});
