import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	IServiceHandlerVoidAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { IPublishGetUserByEmailIdIntegrationEventServiceResult } from '../getUserByEmailId';
import { HashPasswordService } from '@/shared/services/users/user.HashPassword.Service';

export interface IValidationCredentialsServiceParameters {
	credentials: { hash: string; salt: string };
	password: string;
}

export interface IValidateCredentialsService
	extends IServiceHandlerVoidAsync<IValidationCredentialsServiceParameters> {}

@sealed
@Service()
export class ValidateCredentialsService implements IValidateCredentialsService {
	private readonly _hashPasswordService: HashPasswordService;

	public constructor() {
		this._hashPasswordService = Container.get(HashPasswordService);
	}

	public async handleAsync(
		params: IValidationCredentialsServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const {
				credentials: { hash, salt },
				password,
			} = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(hash, 'hash')
				.check(salt, 'salt')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Validate Password
			const result = await this._hashPasswordService.comparePasswordAsync(password, hash);
			if (result.isErr() || !result.value)
        return ResultFactory.error(
          StatusCodes.UNAUTHORIZED,
          `User name and password do not match`
        );

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
