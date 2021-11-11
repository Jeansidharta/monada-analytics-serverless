import { ServerResponse } from '../server-response';
import { getUser } from '../../dynamo/users';
import { HTTPStatusCode } from '../server-response/status-codes';
import { Middleware } from '../make-handler/middleware';
import { JWTPayload } from '../jwt';
import { UserInitialized, UserUninitialized } from '../../models/user';

type RequiredData = {
	tokenContent: JWTPayload;
	DYNAMODB_USERS_TABLE: string;
};

type ResultData = {
	user: UserInitialized | UserUninitialized;
};

export function fetchAuthUser(): Middleware<RequiredData, ResultData, any> {
	return async middlewareData => {
		const { cnpj } = middlewareData.tokenContent;
		let user: UserInitialized | UserUninitialized | null;
		try {
			user = await getUser(cnpj, middlewareData.DYNAMODB_USERS_TABLE);
		} catch (e) {
			console.error('Failed to fetch user on authorization verification', e);
			return ServerResponse.internalError();
		}

		if (!user) {
			return ServerResponse.error(
				HTTPStatusCode.CLIENT_ERROR.C401_UNAUTHORIZED,
				'User on authorization token not found',
			);
		}

		middlewareData.user = user;

		return null;
	};
}
