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

export const initializeFromCNPJ = makeGatewayHandler()
	.use(expectEnv('JWT_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ cnpj: string; name: string; password: string }>(
			v8n().schema({
				cnpj: v8n().string().not.empty(),
				name: v8n().string().not.empty(),
				password: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;

		const cnpj = body.cnpj;

		const uninitializedUser = await getUser(cnpj, middlewareData.DYNAMODB_USERS_TABLE);

		if (!uninitializedUser) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C404_NOT_FOUND,
				'User not found with this CNPJ',
			);
		}

		if (isUserInitialized(uninitializedUser)) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST,
				'User has already been initialized',
			);
		}

		const hashedPassword = bcrypt.hashSync(body.password, 10);

		let user: UserInitialized;
		try {
			user = await initializeUser(
				{ ...body, hashedPassword: hashedPassword },
				uninitializedUser,
				middlewareData.DYNAMODB_USERS_TABLE,
			);
		} catch (e) {
			console.error('Failed to initialize user', e);
			return ServerResponse.internalError();
		}

		const token = generateJWT({ cnpj }, middlewareData.JWT_SECRET);

		const response = ServerResponse.success(
			{ token, user: { ...user, hashedPassword: null } },
			'Login bem sucedido',
		);

		response.headers['Authorization'] = token;

		return response;
	});
