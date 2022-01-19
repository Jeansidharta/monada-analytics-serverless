import { expectBody } from '../../lib/handler-validators/expect-body';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { validateBody } from '../../lib/handler-validators/validate-body';
import { makeGatewayHandler } from '../../lib/make-handler';
import v8n from 'v8n';
import { ServerResponse } from '../../lib/server-response';
import { isUserInitialized, UserInitialized } from '../../models/user';
import { getAccessKey } from '../../dynamo/access-key';
import { AccessKey } from '../../models/access-key';
import { HTTPStatusCode } from '../../lib/server-response/status-codes';
import { getUser } from '../../dynamo/users';
import { generateJWT } from '../../lib/jwt';
import bcrypt from 'bcryptjs';
import { getSubmission } from '../../dynamo/submissions';
import { Submission } from '../../models/submission';

export const login = makeGatewayHandler()
	.use(expectEnv('JWT_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectEnv('DYNAMODB_ACCESS_KEY_TABLE'))
	.use(expectEnv('DYNAMODB_SUBMISSIONS_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ accessKey: string; password: string }>(
			v8n().schema({
				accessKey: v8n().string().not.empty(),
				password: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;
		const key = body.accessKey;

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
				'Chave de acesso ou senha inválidos',
			);
		}

		if (Date.now() > accessKey.expirationDate) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C401_UNAUTHORIZED,
				'Chave de acesso expirada',
			);
		}

		let user: UserInitialized | null;
		let submissions: Submission | null;

		try {
			[user, submissions] = await Promise.all([
				getUser(accessKey.userCpf, middlewareData.DYNAMODB_USERS_TABLE).then(
					user => user as UserInitialized,
				),
				getSubmission(accessKey.userCpf, middlewareData.DYNAMODB_SUBMISSIONS_TABLE),
			]);
		} catch (e) {
			console.error('Failed to fetch user or submissions', e);
			return ServerResponse.internalError();
		}

		if (!user) {
			console.error(`Failed to fetch user associated with access key "${accessKey.key}"`);
			return ServerResponse.internalError();
		}

		if (!isUserInitialized(user) || !bcrypt.compareSync(body.password, user.hashedPassword)) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C403_FORBIDDEN,
				'Chave de acesso ou senha inválidos',
			);
		}

		const token = generateJWT(
			{ cpf: user.cpf },
			accessKey.expirationDate,
			middlewareData.JWT_SECRET,
		);

		const response = ServerResponse.success({ user, token, submissions });
		response.headers['Authorization'] = token;

		return response;
	});
