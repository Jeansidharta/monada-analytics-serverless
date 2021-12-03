import { ServerResponse } from '../../lib/server-response';
import bcrypt from 'bcryptjs';
import { getUser } from '../../dynamo/users';
import { makeGatewayHandler } from '../../lib/make-handler';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { expectBody } from '../../lib/handler-validators/expect-body';
import { validateBody } from '../../lib/handler-validators/validate-body';
import v8n from 'v8n';
import { expectHTTPMethod } from '../../lib/handler-validators/expect-http-methods';
import { isUserInitialized, UserInitialized, UserUninitialized } from '../../models/user';
import { HTTPStatusCode } from '../../lib/server-response/status-codes';
import { generateJWT } from '../../lib/jwt';
import { createSubmission, getSubmission } from '../../dynamo/submissions';
import { Submission } from '../../models/submission';

export const login = makeGatewayHandler()
	.use(expectEnv('JWT_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectEnv('DYNAMODB_SUBMISSIONS_TABLE'))
	.use(expectHTTPMethod('POST'))
	.use(expectBody())
	.use(
		validateBody<{ cnpj: string; password: string }>(
			v8n().schema({
				cnpj: v8n().string().not.empty(),
				password: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;

		let user: UserInitialized | UserUninitialized | null;
		try {
			user = await getUser(body.cnpj, middlewareData.DYNAMODB_USERS_TABLE);
		} catch (e) {
			console.error('Failed to fetch user from CNPJ', e);
			return ServerResponse.internalError();
		}

		if (!user) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C403_FORBIDDEN,
				'Usuário ou senha incorretos',
			);
		}

		if (!isUserInitialized(user)) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C403_FORBIDDEN,
				'Usuário não inicializado',
			);
		}

		if (!bcrypt.compareSync(body.password, user.hashedPassword)) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C403_FORBIDDEN,
				'Usuário ou senha incorretos',
			);
		}

		let userSubmissison: Submission;
		try {
			const result = await getSubmission(body.cnpj, middlewareData.DYNAMODB_SUBMISSIONS_TABLE);
			if (!result) {
				userSubmissison = await createSubmission(
					body.cnpj,
					body,
					middlewareData.DYNAMODB_SUBMISSIONS_TABLE,
				);
			} else {
				userSubmissison = result;
			}
		} catch (e) {
			console.error(`Error fetching user "${body.cnpj}" submission`, e);
			return ServerResponse.internalError();
		}

		const token = generateJWT({ cnpj: body.cnpj }, middlewareData.JWT_SECRET);

		const response = ServerResponse.success(
			{ token, user: { ...user, hashedPassword: null }, submission: userSubmissison },
			'Login bem sucedido',
		);

		response.headers['Authorization'] = token;

		return response;
	});
