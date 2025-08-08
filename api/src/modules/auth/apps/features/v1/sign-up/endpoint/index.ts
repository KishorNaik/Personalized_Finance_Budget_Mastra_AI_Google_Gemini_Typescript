import { Response } from 'express';
import {
	Body,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { ValidationMiddleware } from '@/middlewares/security/validations';
import { StatusCodes } from '@kishornaik/utils';
import { SignUpRequestDto } from '../contracts';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { SignUpCommand } from '../commands';

@JsonController(`/api/v1/auth`)
@OpenAPI({ tags: [`auth`] })
export class SignUpEndpoint {
	@Post()
	@OpenAPI({
		summary: `Sign-up`,
		tags: [`auth`],
		description: `Create a new user in the system.`,
	})
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(ValidationMiddleware(SignUpRequestDto))
	public async postAsync(@Body() request: SignUpRequestDto, @Res() res: Response) {
		const response = await mediator.send(new SignUpCommand(request));
		return res.status(response.statusCode).json(response);
	}
}
