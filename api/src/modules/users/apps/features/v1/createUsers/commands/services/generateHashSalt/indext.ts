import { HashPasswordService } from '@/shared/services/users/user.HashPassword.Service';
import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
} from '@kishornaik/utils';

export interface ICreateUserGenerateHashAndSaltServiceParameters {
	password: string;
}

export interface ICreateUserGenerateHashAndSaltServiceResult {
	hash: string;
	salt: string;
}

export interface ICreateUserGenerateHashAndSaltService
	extends IServiceHandlerAsync<
		ICreateUserGenerateHashAndSaltServiceParameters,
		ICreateUserGenerateHashAndSaltServiceResult
	> {}

@sealed
@Service()
export class CreateUserGenerateHashAndSaltService implements ICreateUserGenerateHashAndSaltService {
	private readonly _hashPasswordService: HashPasswordService;

	public constructor() {
		this._hashPasswordService = Container.get(HashPasswordService);
	}

	public async handleAsync(
		params: ICreateUserGenerateHashAndSaltServiceParameters
	): Promise<Result<ICreateUserGenerateHashAndSaltServiceResult, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { password } = params;

			// Guard
			const guardResult = new GuardWrapper().check(password, 'password').validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Hash Password
			const result = await this._hashPasswordService.hashPasswordAsync(password);
			if (result.isErr())
				return ResultFactory.error(result.error.statusCode, result.error.message);

			const { hash, salt } = result.value;
			if (!hash || !salt)
				return ResultFactory.error(
					StatusCodes.INTERNAL_SERVER_ERROR,
					'Error while hashing password'
				);

			return ResultFactory.success({ hash, salt });
		});
	}
}
