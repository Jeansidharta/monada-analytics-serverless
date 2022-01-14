import v8n from 'v8n';
import { createUserFromCpfCnpj, doesUserExist } from '../../dynamo/users';
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
		validateBody<{ secret: string; cpfCnpj: string }>(
			v8n().schema({
				secret: v8n().string().not.empty(),
				cpfCnpj: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const body = middlewareData.body;

		const isSecretInvalid = body.secret !== middlewareData.SIGNUP_SECRET;
		if (isSecretInvalid) {
			return ServerResponse.error(HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST, 'Invalid secret');
		}

		const cpfCnpj = body.cpfCnpj;

		const cpfCnpjRegex = /(^\d{3}\.\d{3}\.\d{3}\-\d{2}$)|(^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$)/;
		const isCNPJInvalid = !cpfCnpjRegex.exec(cpfCnpj);

		if (isCNPJInvalid) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST,
				'Invalid CNPJ. It should be on the format of 12.345.678/9012-34',
			);
		}

		// Asserts user does not exist
		if (await doesUserExist(cpfCnpj, middlewareData.DYNAMODB_USERS_TABLE)) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C400_BAD_REQUEST,
				'User already exists',
			);
		}

		try {
			const user = await createUserFromCpfCnpj(cpfCnpj, middlewareData.DYNAMODB_USERS_TABLE);
			return ServerResponse.success(user, 'Usuário criado com sucesso');
		} catch (e) {
			console.error('Failed to create user', e);
			return ServerResponse.internalError();
		}
	});
