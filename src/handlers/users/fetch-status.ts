import { expectBody } from '../../lib/handler-validators/expect-body';
import { expectEnv } from '../../lib/handler-validators/require-env';
import { validateBody } from '../../lib/handler-validators/validate-body';
import { makeGatewayHandler } from '../../lib/make-handler';
import v8n from 'v8n';
import { ServerResponse } from '../../lib/server-response';
import { getUser } from '../../dynamo/users';
import { isUserInitialized, UserInitialized, UserUninitialized } from '../../models/user';

export const fetchStatus = makeGatewayHandler()
	.use(expectEnv('DYNAMODB_USERS_TABLE'))
	.use(expectBody())
	.use(
		validateBody<{ cnpj: string }>(
			v8n().schema({
				cnpj: v8n().string().not.empty(),
			}),
		),
	)
	.asHandler(async middlewareData => {
		const cnpj = middlewareData.body.cnpj;

		let user: UserInitialized | UserUninitialized | null;
		try {
			user = await getUser(cnpj, middlewareData.DYNAMODB_USERS_TABLE);
		} catch (e) {
			console.error('Failed to fetch user from CNPJ', e);
			return ServerResponse.internalError();
		}

		if (!user) {
			return ServerResponse.success('NOT_CREATED');
		}

		if (isUserInitialized(user)) {
			return ServerResponse.success('INITIALIZED');
		} else {
			return ServerResponse.success('UNINITIALIZED');
		}
	});
