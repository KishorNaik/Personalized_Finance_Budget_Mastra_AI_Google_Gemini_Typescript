import { Request, Response } from 'express';
import {
	Body,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Req,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { ValidationMiddleware } from '@/middlewares/security/validations';
import { StatusCodes } from '@kishornaik/utils';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { authenticateJwt } from '@/middlewares/security/auth/jwt';
import { CreateGoalRequestDto } from '../contracts';
import { CreateGoalCommand } from '../commands';

@JsonController(`/api/v1/goals`)
@OpenAPI({ tags: [`goals`] })
export class CreateTransactionEndpoint {
	@Post()
	@OpenAPI({
		summary: `create a goal in the system.`,
		tags: [`goals`],
		description: `Create a new goal in the system.`,
	})
	@HttpCode(StatusCodes.CREATED)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@OnUndefined(StatusCodes.UNAUTHORIZED)
	@OnUndefined(StatusCodes.NOT_FOUND)
	@UseBefore(authenticateJwt, ValidationMiddleware(CreateGoalRequestDto))
	async createTransaction(
		@Body() request: CreateGoalRequestDto,
		@Req() requestExpress: Request,
		@Res() res: Response
	) {
		const response = await mediator.send(new CreateGoalCommand(requestExpress, request));
		return res.status(response.statusCode).json(response);
	}
}
