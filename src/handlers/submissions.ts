import { ServerResponse } from '../lib/server-response';
import { createSubmission } from '../dynamo/submissions';
import { Submission } from '../models/submission';
import { makeGatewayHandler } from '../lib/make-handler';
import { expectEnv } from '../lib/handler-validators/require-env';
import { expectBody } from '../lib/handler-validators/expect-body';
import { expectAuth } from '../lib/handler-validators/expect-auth';

export const create = makeGatewayHandler()
	.use(expectEnv('JWT_SECRET'))
	.use(expectEnv('DYNAMODB_SUBMISSIONS_TABLE'))
	.use(expectBody())
	.use(expectAuth())
	.asHandler(async middlewareData => {
		const userCNPJ = middlewareData.tokenContent.cnpj;
		const body = middlewareData.body as any;

		let submission: Submission;
		try {
			submission = await createSubmission(
				userCNPJ,
				body,
				middlewareData.DYNAMODB_SUBMISSIONS_TABLE,
			);
		} catch (e) {
			console.log(e);
			return ServerResponse.internalError();
		}

		return ServerResponse.success(submission, 'Formulário submetido com sucesso');
	});
