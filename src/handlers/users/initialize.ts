import v8n from 'v8n';
import { getUser, initializeUser } from '../../dynamo/users';
import { expectBody } from '../../lib/handler-validators/expect-body';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { validateBody } from '../../lib/handler-validators/validate-body';
import { makeGatewayHandler } from '../../lib/make-handler';
import { ServerResponse } from '../../lib/server-response';
import { HTTPStatusCode } from '../../lib/server-response/status-codes';
import { isUserInitialized, UserInitialized } from '../../models/user';
import bcrypt from 'bcryptjs';
import { generateJWT } from '../../lib/jwt';
import { AccessKey } from '../../models/access-key';
import { getAccessKey } from '../../dynamo/access-key';

export const initialize = makeGatewayHandler()
	.use(expectEnv('JWT_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectEnv('DYNAMODB_ACCESS_KEY_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ accessKey: string; name: string; password: string }>(
			v8n().schema({
				accessKey: v8n().string().not.empty(),
				name: v8n().string().not.empty(),
				password: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;
		let accessKey: AccessKey | null;
		try {
			accessKey = await getAccessKey(body.accessKey, middlewareData.DYNAMODB_ACCESS_KEY_TABLE);
		} catch (e) {
			console.error('Failed to fetch access key', e);
			return ServerResponse.internalError();
		}

		if (!accessKey) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C404_NOT_FOUND,
				'Chave de acesso inválida',
			);
		}

		if (Date.now() > accessKey.expirationDate) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C401_UNAUTHORIZED,
				'Chave de acesso expirada',
			);
		}

		const uninitializedUser = await getUser(accessKey.userCpf, middlewareData.DYNAMODB_USERS_TABLE);

		if (!uninitializedUser) {
			console.error(`No user associated with access key "${accessKey.key}" was found`);
			return ServerResponse.internalError();
		}

		if (isUserInitialized(uninitializedUser)) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST,
				'Este usuário já foi inicializado',
			);
		}

		const hashedPassword = bcrypt.hashSync(body.password, 10);

		let user: UserInitialized;
		try {
			user = await initializeUser(
				{ name: body.name, hashedPassword },
				uninitializedUser,
				middlewareData.DYNAMODB_USERS_TABLE,
			);
		} catch (e) {
			console.error('Failed to initialize user', e);
			return ServerResponse.internalError();
		}

		const token = generateJWT(
			{ cpf: user.cpf },
			accessKey.expirationDate,
			middlewareData.JWT_SECRET,
		);

		const response = ServerResponse.success(
			{ token, user: { ...user, hashedPassword: null } },
			'Login bem sucedido',
		);

		response.headers['Authorization'] = token;

		return response;
	});
