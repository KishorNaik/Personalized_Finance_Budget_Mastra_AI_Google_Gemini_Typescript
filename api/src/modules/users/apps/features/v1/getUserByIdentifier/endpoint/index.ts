import { Response } from 'express';
import {
	Body,
	Get,
	HttpCode,
	JsonController,
	OnUndefined,
	Param,
	Post,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { ValidationMiddleware } from '@/middlewares/security/validations';
import { StatusCodes } from '@kishornaik/utils';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { GetUserByIdentifierRequestDto } from '../contracts';
import { GetUserByIdentifierQuery } from '../query';
import { authenticateJwt } from '@/middlewares/security/auth/jwt';

@JsonController(`/api/v1/users`)
@OpenAPI({ tags: [`users`] })
export class GetUserByIdentifierEndpoint {
	@Get('/:identifier')
	@OpenAPI({
		summary: `Get user by identifier`,
		tags: [`users`],
		description: `Get user by identifier`,
	})
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(authenticateJwt)
	public async getAsync(@Param('identifier') identifier: string, @Res() res: Response) {
		const request = new GetUserByIdentifierRequestDto();
		request.identifier = identifier;
		const response = await mediator.send(new GetUserByIdentifierQuery(request));
		return res.status(response.statusCode).json(response);
	}
}
