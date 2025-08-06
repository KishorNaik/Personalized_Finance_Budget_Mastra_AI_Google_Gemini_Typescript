import { JwtService } from '@/shared/services/users/userJwt.Service';
import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	RoleEnum,
	sealed,
	Service,
	StatusCodes,
} from '@kishornaik/utils';

export interface ICreateUserGenerateJwtServiceParameters {
	identifier: string;
}

export interface ICreateUserGenerateJwtServiceResult {
	token: string;
}

export interface ICreateUserGenerateJwtService
	extends IServiceHandlerAsync<
		ICreateUserGenerateJwtServiceParameters,
		ICreateUserGenerateJwtServiceResult
	> {}

@sealed
@Service()
export class CreateUserGenerateJwtService implements ICreateUserGenerateJwtService {
	private readonly _jwtService: JwtService;

	public constructor() {
		this._jwtService = Container.get(JwtService);
	}

	public async handleAsync(
		params: ICreateUserGenerateJwtServiceParameters
	): Promise<Result<ICreateUserGenerateJwtServiceResult, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { identifier } = params;

			// Guard
			const guardResult = new GuardWrapper().check(identifier, 'identifier').validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Generate Jwt
			const result = await this._jwtService.generateTokenAsync({
				id: identifier,
				role: RoleEnum.USER,
			});
			if (!result)
				return ResultFactory.error(
					StatusCodes.INTERNAL_SERVER_ERROR,
					'Error while generating jwt'
				);

			return ResultFactory.success({ token: result });
		});
	}
}
