export type Type = any;
export type Key = any;
export type Ref = null | { current: any } | ((Instance: any) => void);

export type Props = any;
export type ElementType = any;

export interface ReactElementType {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: string;
}

export type Action<State> = State | ((prevState: State) => State);

export type ReactContext<T> = {
	$$typeof: symbol | number;
	Provider: ReactProviderType<T> | null;
	_currentValue: T;
};

export type ReactProviderType<T> = {
	$$typeof: symbol | number;
	_context: ReactContext<T> | null;
};

export type Usable<T> = Thenable<T> | ReactContext<T>;

// unTracked
// pending
// fullfilled -> resolve
// rejected -> reject

export interface Wakeable<Result> {
	then(
		onFullfilled: () => Result,
		onRejected: () => Result
	): void | Wakeable<Result>;
}
export interface ThenableImpl<T, Result, Err> {
	then(
		onFullfilled: (value: T) => Result,
		onRejected: (error: Err) => Result
	): void | Wakeable<Result>;
}

export interface unTrackedThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status?: void;
}

export interface PendingThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'pending';
}

export interface FullfilledThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'fulfilled';
	value: T;
}

export interface RejectedThenable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'rejected';
	reason: Err;
}

export type Thenable<T, Result = void, Err = any> =
	| unTrackedThenable<T, Result, Err>
	| PendingThenable<T, Result, Err>
	| RejectedThenable<T, Result, Err>
	| FullfilledThenable<T, Result, Err>;
