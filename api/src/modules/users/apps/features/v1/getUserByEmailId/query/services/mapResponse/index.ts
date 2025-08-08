import { UserEntity } from '@kishornaik/db';
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
import { GetUserByEmailIdResponseDto } from '../../../contracts';

export interface IGetUserByEmailIdMapResponseService
	extends IServiceHandlerAsync<UserEntity, GetUserByEmailIdResponseDto> {}

@sealed
@Service()
export class GetUserByEmailIdMapResponseService implements IGetUserByEmailIdMapResponseService {
	public async handleAsync(
		params: UserEntity
	): Promise<Result<GetUserByEmailIdResponseDto, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync<GetUserByEmailIdResponseDto>(
			async () => {
				// guard
				const guardResult = new GuardWrapper().check(params, 'params').validate();
				if (guardResult.isErr())
					return ResultFactory.error(
						guardResult.error.statusCode,
						guardResult.error.message
					);

				const mapResult: GetUserByEmailIdResponseDto = {
					identifier: params.identifier,
					email: params.email,
					firstName: params.firstName,
					lastName: params.lastName,
					credentials: {
						hash: params.credentials.hash,
						identifier: params.credentials.identifier,
						salt: params.credentials.salt,
						userName: params.credentials.userName,
						status: params.credentials.status,
					},
				};

				return ResultFactory.success(mapResult);
			}
		);
	}
}
