import { expectBody } from '../../lib/handler-validators/expect-body';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { validateBody } from '../../lib/handler-validators/validate-body';
import { makeGatewayHandler } from '../../lib/make-handler';
import v8n from 'v8n';
import { ServerResponse } from '../../lib/server-response';
import { isUserInitialized, UserInitialized, UserUninitialized } from '../../models/user';
import { getAccessKey } from '../../dynamo/access-key';
import { AccessKey } from '../../models/access-key';
import { HTTPStatusCode } from '../../lib/server-response/status-codes';
import { getUser } from '../../dynamo/users';
import { generateJWT } from '../../lib/jwt';

export const validateAccessKey = makeGatewayHandler()
	.use(expectEnv('JWT_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectEnv('DYNAMODB_ACCESS_KEY_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ accessKey: string }>(
			v8n().schema({
				accessKey: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const key = middlewareData.body.accessKey;

		let accessKey: AccessKey | null;
		try {
			accessKey = await getAccessKey(key, middlewareData.DYNAMODB_ACCESS_KEY_TABLE);
		} catch (e) {
			console.error('Failed to fetch access key', e);
			return ServerResponse.internalError();
		}

		if (!accessKey) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C404_NOT_FOUND,
				'Chave de acesso não encontrada',
			);
		}

		if (accessKey.expirationDate > Date.now()) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C401_UNAUTHORIZED,
				'Chave de acesso expirada',
			);
		}

		let user: UserUninitialized | UserInitialized | null;

		try {
			user = await getUser(key, middlewareData.DYNAMODB_USERS_TABLE);
		} catch (e) {
			console.error('Failed to fetch user', e);
			return ServerResponse.internalError();
		}

		if (!user) {
			console.error(`Failed to fetch user associated with access key "${accessKey.key}"`);
			return ServerResponse.internalError();
		}

		const token = generateJWT(
			{ cpf: user.cpf },
			accessKey.expirationDate,
			middlewareData.JWT_SECRET,
		);

		let response: ServerResponse;
		if (isUserInitialized(user)) {
			response = ServerResponse.success({ user, token, status: 'INITIALIZED' });
		} else {
			response = ServerResponse.success({ user, token, status: 'UNINITIALIZED' });
		}

		response.headers['Authorization'] = token;

		return response;
	});
