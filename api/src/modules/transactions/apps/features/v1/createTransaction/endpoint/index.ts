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
import { CreateTransactionRequestDto } from '../contracts';
import { authenticateJwt } from '@/middlewares/security/auth/jwt';
import { CreateTransactionCommand } from '../commands';

@JsonController(`/api/v1/transactions`)
@OpenAPI({ tags: [`transactions`] })
export class CreateTransactionEndpoint {
	@Post()
	@OpenAPI({
		summary: `create a Transaction in the system.`,
		tags: [`transactions`],
		description: `Create a new Transaction in the system.`,
	})
	@HttpCode(StatusCodes.CREATED)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@OnUndefined(StatusCodes.UNAUTHORIZED)
	@UseBefore(authenticateJwt, ValidationMiddleware(CreateTransactionRequestDto))
	async createTransaction(
		@Body() request: CreateTransactionRequestDto,
		@Req() requestExpress: Request,
		@Res() res: Response
	) {
		const response = await mediator.send(new CreateTransactionCommand(requestExpress, request));
		return res.status(response.statusCode).json(response);
	}
}
