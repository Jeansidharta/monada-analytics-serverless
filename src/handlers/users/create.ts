import v8n from 'v8n';
import { createUserFromCNPJ, doesUserExist } from '../../dynamo/users';
import { expectBody } from '../../lib/handler-validators/expect-body';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { validateBody } from '../../lib/handler-validators/validate-body';
import { makeGatewayHandler } from '../../lib/make-handler';
import { ServerResponse } from '../../lib/server-response';
import { HTTPStatusCode } from '../../lib/server-response/status-codes';

export const create = makeGatewayHandler()
	.use(expectEnv('SIGNUP_SECRET'))
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ secret: string; cnpj: string }>(
			v8n().schema({
				secret: v8n().string().not.empty(),
				cnpj: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;

		const isSecretInvalid = body.secret !== middlewareData.SIGNUP_SECRET;
		if (isSecretInvalid) {
			return ServerResponse.error(HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST, 'Invalid secret');
		}

		const cnpj = body.cnpj;

		const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/;
		const isCNPJInvalid = !cnpjRegex.exec(cnpj);
		if (isCNPJInvalid) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST,
				'Invalid CNPJ. It should be on the format of 12.345.678/9012-34',
			);
		}

		// Asserts user does not exist
		if (await doesUserExist(cnpj, middlewareData.DYNAMODB_USERS_TABLE)) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST,
				'User already exists',
			);
		}

		try {
			const user = await createUserFromCNPJ(cnpj, middlewareData.DYNAMODB_USERS_TABLE);
			return ServerResponse.success(user, '');
		} catch (e) {
			console.error('Failed to create user from CNPJ', e);
			return ServerResponse.internalError();
		}
	});
