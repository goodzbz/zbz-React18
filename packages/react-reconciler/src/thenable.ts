import {
	FullfilledThenable,
	PendingThenable,
	RejectedThenable,
	Thenable,
} from 'shared/ReactTypes';

export const SuspenseException = new Error(
	'这不是真实的错误,是Suspense工作的一部分,如果你捕获到这么一个错误请将它抛出去'
);

let suspendedThenable: Thenable<any> | null = null;

export function getSuspenseThenable(): Thenable<any> {
	if (suspendedThenable === null) {
		throw new Error('应该存在suspendedThenable,这是个bug');
	}
	const thenable = suspendedThenable;
	suspendedThenable = null;
	return thenable;
}

function noop() {}

export function trackUsedThenable<T>(thenable: Thenable<T>) {
	switch (thenable.status) {
		case 'fulfilled':
			return thenable.value;
		case 'rejected':
			throw thenable.reason;
		default:
			if (typeof thenable.status === 'string') {
				//
				thenable.then(noop, noop);
			} else {
				// untracked
				// pending
				const pending = thenable as unknown as PendingThenable<T, void, any>;
				pending.status = 'pending';
				pending.then(
					(val) => {
						if (pending.status === 'pending') {
							// @ts-ignore
							const fulfilled: FullfilledThenable<T, void, any> = pending;
							fulfilled.status = 'fulfilled';
							fulfilled.value = val;
						}
					},
					(err) => {
						if (pending.status === 'pending') {
							// @ts-ignore
							const rejected: RejectedThenable<T, void, any> = pending;
							rejected.status = 'rejected';
							rejected.reason = err;
						}
					}
				);
			}

			break;
	}
	suspendedThenable = thenable;
	throw SuspenseException;
}
