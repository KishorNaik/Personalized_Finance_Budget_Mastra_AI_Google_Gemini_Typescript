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
import { GetGoalsRequestDto } from '../contracts';
import { GetGoalsQuery } from '../query';

@JsonController(`/api/v1/goals`)
@OpenAPI({ tags: [`goals`] })
export class GetGoalsEndpoint {
	@Get()
	@OpenAPI({
		summary: `Get Goals`,
		tags: [`goals`],
		description: `Get Goals by Month and Years`,
	})
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@OnUndefined(StatusCodes.NOT_FOUND)
	@UseBefore(authenticateJwt)
	public async getAsync(
		@QueryParams() request: GetGoalsRequestDto,
		@Req() req: Request,
		@Res() res: Response
	) {
		const response = await mediator.send(new GetGoalsQuery(req, request));
		return res.status(response.statusCode).json(response);
	}
}
