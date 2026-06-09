import { throwError }
  from '../../utils/errorHelper.js';

export class ProjectAuthorization {
  static require(
    condition,
    message = 'Forbidden'
  ) {
    if (!condition) {
      throwError(message, 403);
    }
  }
}