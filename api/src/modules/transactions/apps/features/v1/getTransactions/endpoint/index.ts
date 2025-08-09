import { Request, Response } from 'express';
import {
	Body,
	Get,
	HttpCode,
	JsonController,
	OnUndefined,
	Param,
	Post,
	QueryParams,
	Req,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { ValidationMiddleware } from '@/middlewares/security/validations';
import { StatusCodes } from '@kishornaik/utils';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { authenticateJwt } from '@/middlewares/security/auth/jwt';
import { GetTransactionsRequestDto } from '../contracts';
import { GetTransactionsQuery } from '../query';

@JsonController(`/api/v1/transactions`)
@OpenAPI({ tags: [`transactions`] })
export class GetTransactionsEndpoint {
	@Get()
	@OpenAPI({
		summary: `Get transactions`,
		tags: [`transactions`],
		description: `Get Transactions`,
	})
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@OnUndefined(StatusCodes.NOT_FOUND)
	@UseBefore(authenticateJwt)
	public async getAsync(
		@QueryParams() request: GetTransactionsRequestDto,
		@Req() req: Request,
		@Res() res: Response
	) {
		const response = await mediator.send(new GetTransactionsQuery(req, request));
		return res.status(response.statusCode).json(response);
	}
}
