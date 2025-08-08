import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
} from '@kishornaik/utils';
import { SignInResponseDto } from '../../../contracts';

export interface ISignInMapResponseServiceParameters {
	firstName: string;
	lastName: string;
	email: string;
	jwtToken: string;
}

export interface ISignInMapResponseService
	extends IServiceHandlerAsync<ISignInMapResponseServiceParameters, SignInResponseDto> {}

@sealed
@Service()
export class SignInMapResponseService implements ISignInMapResponseService {
	public async handleAsync(
		params: ISignInMapResponseServiceParameters
	): Promise<Result<SignInResponseDto, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { email, firstName, jwtToken, lastName } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(email, 'email')
				.check(firstName, 'firstName')
				.check(jwtToken, 'jwtToken')
				.check(lastName, 'lastName')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map Response
			const response: SignInResponseDto = {
				email: email,
				firstName: firstName,
				lastName: lastName,
				jwtToken: jwtToken,
			};

			return ResultFactory.success(response);
		});
	}
}
